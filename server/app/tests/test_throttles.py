import pytest
from rest_framework.exceptions import Throttled
from django.contrib.auth.models import AnonymousUser, User
from api.models import CustomUser


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