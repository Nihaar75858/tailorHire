import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import CustomUser, Job

User = get_user_model()

@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="recruiter", 
        email="test@test.com",
        password="pass1234", 
        skills="Python, Django"
    )

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
    def _create_user(**params):
        defaults = {
            "username": "testuser",
            "email": "test@test.com",
            "password": "hello123"
        }
        defaults.update(params)
        return User.objects.create_user(**defaults)
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