from rest_framework import status
from django.urls import reverse
from pathlib import Path
from api import models
from django.core.files.uploadedfile import SimpleUploadedFile
import pytest
import json

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
        
@pytest.mark.django_db
class TestJobViewSet:
    def test_list_jobs(self, auth_client, job):
        """Should list active jobs"""
        url = reverse("job-list")
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0
        assert response.data[0]["title"] == job.title

    def test_filter_jobs_by_location(self, auth_client, job):
        """Should filter jobs by location"""
        url = reverse("job-list") + "?location=Remote"
        response = auth_client.get(url)
        assert response.status_code == 200
        assert all("Remote" in j["location"] for j in response.data)

    def test_filter_jobs_by_type(self, auth_client, job):
        """Should filter jobs by job type"""
        url = reverse("job-list") + "?job_type=full-time"
        response = auth_client.get(url)
        assert response.status_code == 200
        assert all(j["job_type"] == "full-time" for j in response.data)

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
        assert "update your skills" in response.data["detail"].lower()

@pytest.mark.django_db
class TestSavedJobViewSet:

    def test_list_only_user_saved_jobs(
        self, auth_client, user, job
    ):
        """List only saved job by the authenticated user"""
        models.SavedJob.objects.create(user=user, job=job)

        response = auth_client.get(reverse("saved-job-list"))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["job"] == job.id

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
        
@pytest.mark.django_db
class TestCoverLetterAPI:

    def test_auth_required(self, api_client):
        url = reverse("coverletter-list")
        res = api_client.get(url)

        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_cover_letter_success(
        self, api_client, create_user, monkeypatch
    ):
        user = create_user()
        api_client.force_authenticate(user=user)

        url = reverse("coverletter-list")

        # Mock AI
        def mock_generate(*args, **kwargs):
            return "Generated Letter"

        monkeypatch.setattr(
            "cover_letters.views.ai_helper.generate_cover_letter",
            mock_generate
        )

        payload = {
            "job_description": "Backend role",
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
        api_client.force_authenticate(user=user)

        url = reverse("coverletter-list")

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
        url = reverse("coverletter-list")
        res = api_client.get(url)

        assert res.status_code == status.HTTP_200_OK
        assert len(res.data) == 1
        assert res.data[0]["job_description"] == "Desc1"

    def test_create_with_job_id(
        self, api_client, create_user, monkeypatch
    ):
        user = create_user()
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
            "cover_letters.views.ai_helper.generate_cover_letter",
            mock_generate
        )

        url = reverse("coverletter-list")

        payload = {
            "job_description": "Backend role",
            "resume_text": "Python dev",
            "job": job.id
        }

        res = api_client.post(url, payload, format="json")

        assert res.status_code == status.HTTP_201_CREATED
        assert models.CoverLetter.objects.first().job == job