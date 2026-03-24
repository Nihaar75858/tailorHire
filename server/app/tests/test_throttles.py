import pytest
from rest_framework.exceptions import Throttled
from django.contrib.auth.models import AnonymousUser
from api.models import CustomUser

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_auth_request(factory, user):
    request = factory.get("/")
    request.user = user
    return request

def make_anon_request(factory):
    request = factory.get("/")
    request.user = AnonymousUser()
    return request

def exhaust_throttle(throttle, request, limit):
    for _ in range(limit):
        throttle.allow_request(request, None)
        
def make_user(username):
    return CustomUser.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="pass"
    )
        
# ── Configuration ──────────────────────────────────────────────────────────────

@pytest.mark.parametrize("throttle_fixture,expected_scope,expected_requests,expected_duration", [
    ("cover_letter_throttle",       "cover_letter",       10, 3600),
    ("chat_message_throttle",       "chat_message",       30, 3600),
    ("job_recommendation_throttle", "job_recommendation", 20, 3600),
    ("burst_throttle",              "burst",               5,   60),
    ("daily_ai_throttle",           "daily_ai",           50, 86400),
    ("anon_strict_throttle",        "anon_strict",         5, 3600),
])
def test_throttle_configuration(request, throttle_fixture, expected_scope, expected_requests, expected_duration):
    throttle = request.getfixturevalue(throttle_fixture)
    assert throttle.scope == expected_scope
    assert throttle.num_requests == expected_requests
    assert throttle.duration == expected_duration

def test_authenticated_user_cache_key(factory, throttle, db):
    user = CustomUser.objects.create_user(username="test", password="pass")
    request = factory.get("/ai-endpoint/")
    request.user = user

    key = throttle.get_cache_key(request, None)

    assert str(user.pk) in key


def test_anonymous_user_cache_key(factory, throttle):
    request = factory.get("/ai-endpoint/")
    request.user = AnonymousUser()

    key = throttle.get_cache_key(request, None)

    assert "127.0.0.1" in key  # default test IP


def test_throttle_failure_returns_custom_message(factory, throttle):
    request = factory.get("/ai-endpoint/")
    request.user = AnonymousUser()

    with pytest.raises(Throttled) as exc:
        throttle.throttle_failure()

    data = exc.value.detail

    assert data["error"] == "AI service rate limit exceeded"
    assert "maximum number of AI requests" in data["message"]
    assert "retry_after" in data


def test_throttle_blocks_after_limit(factory, throttle):
    request = factory.get("/ai-endpoint/")
    request.user = AnonymousUser()

    # First 2 requests allowed
    assert throttle.allow_request(request, None) is True
    assert throttle.allow_request(request, None) is True

    # Third should fail
    with pytest.raises(Throttled):
        throttle.allow_request(request, None)
    
# ── Cache keys ─────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("throttle_fixture,expected_scope", [
    ("cover_letter_throttle",       "cover_letter"),
    ("chat_message_throttle",       "chat_message"),
    ("job_recommendation_throttle", "job_recommendation"),
    ("burst_throttle",              "burst"),
    ("daily_ai_throttle",           "daily_ai"),
])
def test_authenticated_cache_key(request, factory, throttle_fixture, expected_scope, db):
    throttle = request.getfixturevalue(throttle_fixture)
    user = CustomUser.objects.create_user(username=f"{expected_scope}_user", password="pass")
    key = throttle.get_cache_key(make_auth_request(factory, user), None)
    assert key is not None
    assert str(user.pk) in key
    assert expected_scope in key

def test_anon_cache_key_uses_ip(factory, anon_strict_throttle):
    key = anon_strict_throttle.get_cache_key(make_anon_request(factory), None)
    assert key is not None
    assert "127.0.0.1" in key
    assert "anon_strict" in key

def test_different_users_get_different_cache_keys(factory, cover_letter_throttle, db):
    user1 = CustomUser.objects.create_user(username="user_one", email="one@test.com", password="pass")
    user2 = CustomUser.objects.create_user(username="user_two", email="two@test.com", password="pass")
    key1 = cover_letter_throttle.get_cache_key(make_auth_request(factory, user1), None)
    key2 = cover_letter_throttle.get_cache_key(make_auth_request(factory, user2), None)
    assert key1 != key2


# ── Blocking ───────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("throttle_fixture,limit", [
    ("cover_letter_throttle",       10),
    ("chat_message_throttle",       30),
    ("job_recommendation_throttle", 20),
    ("burst_throttle",               5),
    ("daily_ai_throttle",           50),
])
def test_blocks_after_limit(request, factory, throttle_fixture, limit, db):
    throttle = request.getfixturevalue(throttle_fixture)
    user = CustomUser.objects.create_user(username=f"{throttle_fixture}_user", password="pass")
    req = make_auth_request(factory, user)
    exhaust_throttle(throttle, req, limit)
    assert throttle.allow_request(req, None) is False

def test_anon_blocks_after_limit(factory, anon_strict_throttle):
    req = make_anon_request(factory)
    exhaust_throttle(anon_strict_throttle, req, 5)
    assert anon_strict_throttle.allow_request(req, None) is False


# ── AIServiceThrottle specific ─────────────────────────────────────────────────

def test_authenticated_user_cache_key(factory, throttle, db):
    user = CustomUser.objects.create_user(username="test", password="pass")
    request = make_auth_request(factory, user)
    key = throttle.get_cache_key(request, None)
    assert str(user.pk) in key

def test_anonymous_user_cache_key(factory, throttle):
    key = throttle.get_cache_key(make_anon_request(factory), None)
    assert "127.0.0.1" in key

def test_throttle_failure_custom_message(factory, throttle):
    with pytest.raises(Throttled) as exc:
        throttle.throttle_failure()
    data = exc.value.detail
    assert data["error"] == "AI service rate limit exceeded"
    assert "maximum number of AI requests" in data["message"]
    assert "retry_after" in data

def test_throttle_blocks_after_limit(factory, throttle):
    req = make_anon_request(factory)
    exhaust_throttle(throttle, req, 2)
    with pytest.raises(Throttled):
        throttle.allow_request(req, None)


# ── Wait time ──────────────────────────────────────────────────────────────────

def test_burst_wait_is_within_minute(factory, burst_throttle, db):
    user = make_user("burst_wait_user")
    req = make_auth_request(factory, user)
    exhaust_throttle(burst_throttle, req, 5)
    burst_throttle.allow_request(req, None)
    assert 0 < burst_throttle.wait() <= 60

def test_daily_ai_wait_is_within_day(factory, daily_ai_throttle, db):
    user = make_user("daily_wait_user")
    req = make_auth_request(factory, user)
    exhaust_throttle(daily_ai_throttle, req, 50)
    daily_ai_throttle.allow_request(req, None)
    assert 0 < daily_ai_throttle.wait() <= 86400
    
