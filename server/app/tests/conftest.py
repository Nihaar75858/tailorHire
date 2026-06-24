import pytest
from datetime import timedelta
from django.utils import timezone
from django.urls import reverse
from unittest.mock import patch
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.throttling import (
    CoverLetterThrottle,
    ChatMessageThrottle,
    JobRecommendationThrottle,
    BurstRateThrottle,
    DailyAILimitThrottle,
    AnonymousStrictThrottle,
    AIServiceThrottle
)
from api.models import Job
from django.core.cache import cache

User = get_user_model()

@pytest.fixture
def user(db):
    u = User.objects.create_user(
        username="recruiter",
        email="test@test.com",
        password="pass1234",
        skills="Python, Django"
    )
    # Backdate so AI-gated endpoints (require_verified_user) don't reject by default
    u.date_joined = timezone.now() - timedelta(hours=2)
    u.save()
    return u

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def create_user():
    def _create_user(verified=True, **params):
        defaults = {
            "username": "testuser",
            "email": "test@test.com",
            "password": "hello123"
        }
        defaults.update(params)
        new_user = User.objects.create_user(**defaults)
        if verified:
            new_user.date_joined = timezone.now() - timedelta(hours=2)
            new_user.save()
        return new_user
    return _create_user

@pytest.fixture
def job(user):
    return Job.objects.create(
        title="Software Engineer",
        company="TestCo",
        location="Remote",
        job_type="full-time",
        description="Test job description",
        requirements=["Python", "Django"],
        posted_by=user
    )

@pytest.fixture
def saved_job_url():
    return reverse("saved-job-list")

@pytest.fixture
def remove_saved_job_url():
    return reverse("saved-job-remove")


@pytest.fixture
def factory():
    return APIRequestFactory()

def make_throttle(throttle_class, rate=None):
    """Helper to instantiate any throttle class bypassing settings lookup."""
    with patch.object(throttle_class, 'get_rate', return_value=rate):
        t = throttle_class()  # __init__ calls get_rate(), which is now mocked
    t.history = []
    t.now = t.timer()
    return t

@pytest.fixture
def throttle():
    return make_throttle(AIServiceThrottle, rate="2/min")

@pytest.fixture
def cover_letter_throttle():
    return make_throttle(CoverLetterThrottle, rate="10/hour")

@pytest.fixture
def chat_message_throttle():
    return make_throttle(ChatMessageThrottle, rate="30/hour")

@pytest.fixture
def job_recommendation_throttle():
    return make_throttle(JobRecommendationThrottle, rate="20/hour")

@pytest.fixture
def burst_throttle():
    return make_throttle(BurstRateThrottle, rate="5/min")

@pytest.fixture
def daily_ai_throttle():
    return make_throttle(DailyAILimitThrottle, rate="50/day")

@pytest.fixture
def anon_strict_throttle():
    return make_throttle(AnonymousStrictThrottle, rate="5/hour")

@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()