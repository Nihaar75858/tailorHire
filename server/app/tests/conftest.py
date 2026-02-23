import pytest
from pathlib import Path
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.serializer import UserSerializer
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import CustomUser, Job
import json

User = get_user_model()

@pytest.fixture
def user(db):
    return User.objects.create_user(username="recruiter", password="pass1234", skills="Python, Django")

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user():
    def _create_user():
        image_path = Path(__file__).resolve().parent.parent / "profile" / "test.jpg"
        with open(image_path, "rb") as img:
            image = SimpleUploadedFile("test.jpg", img.read(), content_type="image/jpeg")

        payload = {
            "firstName": "John",
            "lastName": "Doe",
            "username": "John123",
            "email": "user1@example.com",
            "password": "hello123",
            "bio": "I am ready to work",
            "location": "Indiana, USA",
            "skills": "Java, Python, C",
            "profile_picture": image,
            "role": json.dumps(["User"]),
        }

        serializer = UserSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        return serializer.save()

    return _create_user

@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

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
def user():
    return CustomUser.objects.create_user(
        username="testuser",
        password="test123"
    )

@pytest.fixture
def job():
    return Job.objects.create(
        title="Backend Dev",
        company="TechCorp",
        location="NY",
        description="APIs",
        requirements=[]
    )

@pytest.fixture
def saved_job_url():
    return reverse("saved-job-list")

@pytest.fixture
def remove_saved_job_url():
    return reverse("saved-job-remove")