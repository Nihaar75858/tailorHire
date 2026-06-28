from rest_framework import status
from django.urls import reverse
from datetime import timedelta
from django.utils import timezone
from pathlib import Path
from api import models
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
import pytest
import json
from .test_utils import HuggingFaceAI
ai_helper = HuggingFaceAI()

#########################
# User Views Tests
#########################
@pytest.mark.django_db
class TestUserApi:
    def test_create_user(self, api_client):
        """Create Test User"""
        url = reverse("customuser-list")
        
        image_path = Path(__file__).resolve().parent.parent / "profile" / "test.jpg"
        with open(image_path, "rb") as img:
            image = SimpleUploadedFile("test.jpg", img.read(), content_type="image/jpeg")
            
        payload = {
            "firstName": "John",
            "lastName": "Doe",
            "username": "John123",
            "email": "user1@example.com",
            "password": "hello123",
            "bio": "",
            "location": "",
            "skills": "",
            "profile_picture": image,
            "role": json.dumps(["User"]),
        }

        res = api_client.post(url, payload, format='multipart')
        assert res.status_code == status.HTTP_201_CREATED
        
    def test_login_successful(self, api_client, create_user):
        """Login Test User with Username and Password (Successful)"""
        user = create_user()
        url = reverse("customuser-login-user")
        
        payload = {
            "username": user.username,
            "password": "hello123"
        }
        res = api_client.post(url, payload, format='multipart')

        assert res.status_code == status.HTTP_200_OK
        assert "Login successful" == res.data["message"]

    def test_login_invalid_credentials(self, api_client):
        """Login Test User with Username and Password (Failure)"""
        url = reverse("customuser-login-user")
        
        payload = {
            "username": "wrongusername",
            "password": "wrongpassword"
        }
        res = api_client.post(url, payload, format='multipart')

        assert res.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid credentials" in res.data["error"]
        
    def test_logout_user(self, api_client, create_user):
        """Test User Logs out"""
        user = create_user()

        login_url = reverse("customuser-login-user")
        logout_url = reverse("customuser-logout-user")
        
        login_res = api_client.post(
            login_url,
            {"username": user.username, "password": "hello123"},
            format="json",
        )
        
        token = login_res.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        refresh_token = login_res.data["refresh"]
        
        payload = {"refresh": refresh_token}
        res = api_client.post(logout_url, payload, format='json')
        
        assert res.status_code == status.HTTP_200_OK
        assert "Logged out successfully" in res.data["message"]

    def test_update_user(self, api_client, create_user):
        """Test User will Update Profile"""
        user = create_user()
        
        login_url = reverse("customuser-login-user")
        login_res = api_client.post(
            login_url,
            {"username": user.username, "password": "hello123"},
            format="json",
        )
        
        token = login_res.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        url = reverse("customuser-detail", args=[user.id])

        payload = {
            "firstName": "Updated",
            "lastName": "Doe",
        }

        res = api_client.patch(url, payload, format="json")

        assert res.status_code == status.HTTP_200_OK

    def test_user_details(self, api_client, create_user):
        """Test User Details to be sent to the Frontend"""
        user = create_user()
        
        login_url = reverse("customuser-login-user")
        login_res = api_client.post(
            login_url,
            {"username": user.username, "password": "hello123"},
            format="json",
        )

        token = login_res.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        url = reverse("customuser-detail", args=[user.id])
        res = api_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        assert res.data["username"] == user.username

#########################
# Job and JobList Views Tests
#########################        
@pytest.mark.django_db
class TestJobViewSet:
    def test_list_jobs(self, auth_client, job):
        """Should list active jobs"""
        url = reverse("job-list")
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) > 0
        assert results[0]["title"] == job.title

    def test_filter_jobs_by_location(self, auth_client, job):
        """Should filter jobs by location"""
        url = reverse("job-list") + "?location=Remote"
        response = auth_client.get(url)
        assert response.status_code == 200
        results = response.data["results"]
        assert all("Remote" in j["location"] for j in results)

    def test_filter_jobs_by_type(self, auth_client, job):
        """Should filter jobs by job type"""
        url = reverse("job-list") + "?job_type=full-time"
        response = auth_client.get(url)
        assert response.status_code == 200
        results = response.data["results"]
        assert all(j["job_type"] == "full-time" for j in results)

    def test_create_job_authenticated(self, auth_client):
        """Should allow authenticated user to create job"""
        url = reverse("job-list")
        data = {
            "title": "Backend Developer",
            "company": "Techify",
            "location": "New York",
            "salary_min": 80000,
            "salary_max": 130000,
            "job_type": "full-time",
            "description": "Build backend APIs",
            "requirements": ["Python", "FastAPI", "PostgreSQL"],
        }
        response = auth_client.post(url, data, format="json")
        
        assert response.status_code == status.HTTP_201_CREATED
        assert models.Job.objects.count() == 1
        
        created_job = models.Job.objects.first()
        assert created_job.posted_by == response.wsgi_request.user

    def test_create_job_unauthenticated(self, api_client):
        """Should not allow unauthenticated users to create job"""
        url = reverse("job-list")
        data = {
            "title": "Unauthorized Job",
            "company": "Hacker Corp",
            "location": "Dark Web",
            "description": "Malicious things",
            "requirements": ["Hacking"],
        }
        response = api_client.post(url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_recommended_jobs_without_skills(self, auth_client, user):
        """Should return error if user has no skills"""
        user.skills = ""
        user.save()
        url = reverse("job-recommended")
        response = auth_client.get(url)
        assert response.status_code == 400
        assert "update your skills" in response.data["message"].lower()

#########################
# Saved Job Views Tests
#########################
@pytest.mark.django_db
class TestSavedJobViewSet:

    def test_list_only_user_saved_jobs(
        self, auth_client, user, job
    ):
        """List only saved job by the authenticated user"""
        models.SavedJob.objects.create(user=user, job=job)

        response = auth_client.get(reverse("saved-job-list"))

        assert response.status_code == status.HTTP_200_OK
        results = response.data["results"]
        assert len(results) == 1
        assert results[0]["job"] == job.id

    def test_create_saved_job(
        self, auth_client, user, job
    ):
        """Create saved jobs by the authenticated user"""
        response = auth_client.post(
            reverse("saved-job-list"),
            {"job": job.id},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert models.SavedJob.objects.count() == 1

        saved_job = models.SavedJob.objects.first()
        assert saved_job.user == user
        assert saved_job.job == job

    def test_remove_saved_job_success(
        self, auth_client, user, job
    ):
        """Remove respective saved job by the user"""
        models.SavedJob.objects.create(user=user, job=job)

        response = auth_client.delete(
            reverse("saved-job-remove"),
            {"job": job.id},
            format="json",
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert models.SavedJob.objects.count() == 0

    def test_remove_saved_job_not_found(
        self, auth_client, job
    ):
        """Fallback if Saved Job does not exist"""
        response = auth_client.delete(
            reverse("saved-job-remove"),
            {"job": job.id},
            format="json",
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_remove_saved_job_missing_job_id(
        self, auth_client
    ):
        """Remove Saved Job with Missing Id"""
        response = auth_client.delete(
            reverse("saved-job-remove"),
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_requires_authentication(self, client, job):
        """Authentication check"""
        response = client.get(reverse("saved-job-list"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

#########################
# Cover Letter Views Tests
#########################
@pytest.mark.django_db
class TestCoverLetterAPI:

    def test_auth_required(self, api_client):
        url = reverse("cover-letter-list")
        res = api_client.get(url)

        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_cover_letter_success(
        self, api_client, create_user, monkeypatch
    ):
        user = create_user()
        user.date_joined = timezone.now() - timedelta(hours=2)
        user.save()
        api_client.force_authenticate(user=user)

        url = reverse("cover-letter-list")

        # Mock AI
        def mock_generate(*args, **kwargs):
            return "Generated Letter"

        monkeypatch.setattr(
            "api.views.ai_helper.generate_cover_letter",
            mock_generate
        )

        payload = {
            "job_description": "We are looking for a Backend Developer with strong experience in Python and Django to join our growing team.",
            "resume_text": "Python developer"
        }

        res = api_client.post(url, payload, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["generated_letter"] == "Generated Letter"
        assert models.CoverLetter.objects.count() == 1
        assert models.CoverLetter.objects.first().user == user

    def test_missing_job_description_returns_400(
        self, api_client, create_user
    ):
        user = create_user()
        user.date_joined = timezone.now() - timedelta(hours=2)
        user.save()
        api_client.force_authenticate(user=user)

        url = reverse("cover-letter-list")

        payload = {
            "resume_text": "Python developer"
        }

        res = api_client.post(url, payload, format="json")

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "Job description is required" in str(res.data)

    def test_user_sees_only_their_cover_letters(
        self, api_client, create_user
    ):
        user1 = create_user(username="u1", email="u1@test.com")
        user2 = create_user(username="u2", email="u2@test.com")

        models.CoverLetter.objects.create(
            user=user1,
            job_description="Desc1",
            generated_letter="Letter1"
        )

        models.CoverLetter.objects.create(
            user=user2,
            job_description="Desc2",
            generated_letter="Letter2"
        )

        api_client.force_authenticate(user=user1)
        url = reverse("cover-letter-list")
        res = api_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        results = res.data["results"]
        assert len(results) == 1
        assert results[0]["job_description"] == "Desc1"

    def test_create_with_job_id(
        self, api_client, create_user, monkeypatch
    ):
        user = create_user()
        user.date_joined = timezone.now() - timedelta(hours=2)
        user.save()
        api_client.force_authenticate(user=user)

        job = models.Job.objects.create(
            title="Backend Dev",
            company="ABC",
            location="Remote",
            salary_min=50000,
            salary_max=70000,
            job_type="Full-time",
            description="Desc",
            requirements="Req",
            posted_by=user
        )

        def mock_generate(*args, **kwargs):
            return "Generated Letter"

        monkeypatch.setattr(
            "api.views.ai_helper.generate_cover_letter",
            mock_generate
        )

        url = reverse("cover-letter-list")

        payload = {
            "job_description": "We are looking for a Backend Developer with strong experience in Python and Django to join our growing team.",
            "resume_text": "Python dev",
            "job": job.id
        }

        res = api_client.post(url, payload, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        assert models.CoverLetter.objects.first().job == job
        
#########################
# Application Views Tests
#########################
@pytest.mark.django_db
def test_authentication_required(api_client):
    url = reverse("application-list")
    response = api_client.get(url)
    assert response.status_code == 401
    
@pytest.mark.django_db
def test_user_sees_only_their_applications(api_client):
    url = reverse("application-list")
    
    user1 = models.CustomUser.objects.create_user(username="user1", email="user1@test.com", password="pass")
    user2 = models.CustomUser.objects.create_user(username="user2", email="user2@test.com", password="pass")

    job = models.Job.objects.create(title="Backend Dev", company="TestCo")

    app1 = models.Application.objects.create(user=user1, job=job)
    models.Application.objects.create(user=user2, job=job)

    api_client.force_authenticate(user=user1)
    response = api_client.get(url)

    assert response.status_code == 200
    results = response.data["results"]
    assert len(results) == 1
    assert results[0]["id"] == app1.id
    
@pytest.mark.django_db
def test_admin_sees_all_applications(api_client):
    url = reverse("application-list")
    
    admin = models.CustomUser.objects.create_user(username="admin", email="admin@test.com", password="pass", is_staff=True)
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")

    job = models.Job.objects.create(title="Backend Dev", company="TestCo")

    models.Application.objects.create(user=user, job=job)
    models.Application.objects.create(user=admin, job=job)

    api_client.force_authenticate(user=admin)
    response = api_client.get(url)

    assert response.status_code == 200
    results = response.data["results"]
    assert len(results) == 2
    
@pytest.mark.django_db
def test_user_can_create_application(api_client):
    url = reverse("application-list")
    
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")
    job = models.Job.objects.create(title="Backend Dev", company="TestCo")

    api_client.force_authenticate(user=user)

    response = api_client.post(url, {
        "job": job.id,
        "status": "applied"
    })

    assert response.status_code == 201
    assert models.Application.objects.count() == 1
    assert models.Application.objects.first().user == user
    
@pytest.mark.django_db
def test_duplicate_application_fails(api_client):
    url = reverse("application-list")
    
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")
    job = models.Job.objects.create(title="Backend Dev", company="TestCo")

    models.Application.objects.create(user=user, job=job)

    api_client.force_authenticate(user=user)

    with pytest.raises(ValidationError):
        api_client.post(url, {
            "job": job.id,
            "status": "applied"
        })
    
@pytest.mark.django_db
def test_admin_can_update_status(api_client):
    admin = models.CustomUser.objects.create_user(username="admin", email="admin@test.com", password="pass", is_staff=True)
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")

    job = models.Job.objects.create(title="Backend Dev", company="TestCo")
    app = models.Application.objects.create(user=user, job=job)

    api_client.force_authenticate(user=admin)

    url = reverse("application-update-status", args=[app.id])
    response = api_client.patch(
        url, {"status": "interview"}, format="json"
    )

    assert response.status_code == 200
    app.refresh_from_db()
    assert app.status == "interview"
    
@pytest.mark.django_db
def test_non_admin_cannot_update_status(api_client):
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")
    job = models.Job.objects.create(title="Backend Dev", company="TestCo")
    app = models.Application.objects.create(user=user, job=job)

    api_client.force_authenticate(user=user)
    
    url = reverse("application-update-status", args=[app.id])
    response = api_client.patch(
        url, {"status": "interview"}, format="json"
    )

    assert response.status_code == 403
    
@pytest.mark.django_db
def test_invalid_status_rejected(api_client):
    admin = models.CustomUser.objects.create_user(username="admin", email="admin@test.com", password="pass", is_staff=True)
    user = models.CustomUser.objects.create_user(username="user", email="user1@test.com", password="pass")

    job = models.Job.objects.create(title="Backend Dev", company="TestCo")
    app = models.Application.objects.create(user=user, job=job)

    api_client.force_authenticate(user=admin)

    url = reverse("application-update-status", args=[app.id])
    response = api_client.patch(
        url, {"status": "invalid"}, format="json"
    )

    assert response.status_code == 400
    
#########################
# Chat Message Views Tests
#########################
@pytest.mark.django_db
class TestChatMessageAPI:

    def test_auth_required(self, api_client):
        url = reverse("chat-message-list")
        res = api_client.get(url)

        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_chat_message_success(self, auth_client, user, monkeypatch):
        url = reverse("chat-message-list")

        def mock_generate(*args, **kwargs):
            return "Here's some career advice."

        monkeypatch.setattr(
            "api.views.ai_helper.generate_chat_response",
            mock_generate
        )

        payload = {"message": "How do I prepare for a technical interview?"}
        res = auth_client.post(url, payload, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["message"] == "How do I prepare for a technical interview?"
        assert res.data["response"] == "Here's some career advice."
        assert models.ChatMessage.objects.count() == 1
        assert models.ChatMessage.objects.first().user == user

    def test_missing_message_returns_400(self, auth_client):
        url = reverse("chat-message-list")
        res = auth_client.post(url, {}, format="json")

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "Message is required" in str(res.data)

    def test_user_sees_only_their_chat_messages(self, api_client, create_user):
        user1 = create_user(username="chatuser1", email="chatuser1@test.com")
        user2 = create_user(username="chatuser2", email="chatuser2@test.com")

        models.ChatMessage.objects.create(user=user1, message="Hi", response="Hello!")
        models.ChatMessage.objects.create(user=user2, message="Hey", response="Hey there!")

        api_client.force_authenticate(user=user1)
        res = api_client.get(reverse("chat-message-list"))

        assert res.status_code == status.HTTP_200_OK
        results = res.data["results"]
        assert len(results) == 1
        assert results[0]["message"] == "Hi"

    def test_conversation_history_passed_in_chronological_order(
        self, auth_client, user, monkeypatch
    ):
        """View must pass prior messages oldest-first, so recent context is intact"""
        for i in range(5):
            models.ChatMessage.objects.create(
                user=user, message=f"Question {i}", response=f"Answer {i}"
            )

        captured = {}

        def mock_generate(message_text, conversation_history=None):
            captured["conversation_history"] = conversation_history
            return "New response"

        monkeypatch.setattr("api.views.ai_helper.generate_chat_response", mock_generate)

        res = auth_client.post(reverse("chat-message-list"), {"message": "Question 5"}, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        history = captured["conversation_history"]
        assert len(history) == 5
        assert history[0]["message"] == "Question 0"   # oldest first
        assert history[-1]["message"] == "Question 4"  # most recent last

    def test_response_is_not_settable_by_client(self, auth_client, monkeypatch):
        def mock_generate(*args, **kwargs):
            return "Real AI response"

        monkeypatch.setattr("api.views.ai_helper.generate_chat_response", mock_generate)

        res = auth_client.post(reverse("chat-message-list"), {
            "message": "Hello", "response": "Injected response"
        }, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["response"] == "Real AI response"

    def test_brand_new_account_is_rejected(self, api_client, create_user, monkeypatch):
        """Accounts under 1 hour old shouldn't reach AI chat -- anti-abuse"""
        new_user = create_user(verified=False, username="newbie", email="newbie@test.com")
        api_client.force_authenticate(user=new_user)

        monkeypatch.setattr(
            "api.views.ai_helper.generate_chat_response",
            lambda *a, **k: "Should not be reached"
        )

        res = api_client.post(reverse("chat-message-list"), {"message": "Hello"}, format="json")
        assert res.status_code == status.HTTP_403_FORBIDDEN

    def test_quota_exceeded_returns_429(self, auth_client, user, monkeypatch):
        models.UserAIQuota.objects.create(user=user, daily_limit=0, monthly_limit=0)

        monkeypatch.setattr(
            "api.views.ai_helper.generate_chat_response",
            lambda *a, **k: "Should not be reached"
        )

        res = auth_client.post(reverse("chat-message-list"), {"message": "Hello"}, format="json")
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS