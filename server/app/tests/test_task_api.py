from rest_framework import status
from django.urls import reverse
from pathlib import Path
from api import models
from django.core.files.uploadedfile import SimpleUploadedFile
import pytest
import json

# create_user = reverse('customuser-list')

# def update_url(id):
#     return reverse('customuser-detail', args=[id])

# def details_url(id):
#     return reverse('customuser-detail', args=[id])

# def sample_payload():
#     image_path = Path(__file__).resolve().parent.parent / "profile" / "test.jpg"
#     with open(image_path, "rb") as img:
#         image = SimpleUploadedFile("test.jpg", img.read(), content_type="image/jpeg")
        
#     payload = {
#         "firstName": "John",
#         "lastName": "Doe",
#         "username": "John123",
#         "email": "user1@example.com",
#         "password": "hello123",
#         "bio": "I am ready to work",
#         "location": "Indiana, USA",
#         "skills": "Java, Python, C",
#         "profile_picture": image,
#         "role": json.dumps(["User"]),
#     }
#     serializer = UserSerializer(data=payload)
#     serializer.is_valid(raise_exception=True)
#     return serializer.save()

@pytest.mark.django_db
class TestUserApi:
    # def setUp(self):
    #     self.login_url = reverse('customuser-login-user')
    #     self.logout_url = reverse('customuser-logout-user')
        
    # def authenticate_user(self):
    #     """Helper: create a user, log in, and set JWT token for authenticated requests."""
    #     user = sample_payload()
    #     payload = {
    #         "username": user.username,
    #         "password": "hello123",
    #     }
    #     res = self.client.post(self.login_url, payload, format='json')
    #     token = res.data.get("access")
    #     self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    #     return user, res

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
        
        # image_path = Path(__file__).resolve().parent.parent / "profile" / "test.jpg"
        # with open(image_path, "rb") as img:
        #     image = SimpleUploadedFile("test.jpg", img.read(), content_type="image/jpeg")
            
        # payload = {
        #     "firstName": "John",
        #     "lastName": "Doe",
        #     "username": "John123",
        #     "email": "user1@example.com",
        #     "password": "hello123",
        #     "bio": "I am ready to work",
        #     "location": "Indiana, USA",
        #     "skills": "Java, Python, C",
        #     "profile_picture": image,
        #     "role": json.dumps(["User"]),
        # }

        # url = update_url(user.id)
        # res = self.client.put(url, payload, format='multipart')
        # print(res.data)
        # user.refresh_from_db()
        # self.assertEqual(res.status_code, status.HTTP_200_OK)

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
        
        # url = details_url(user.id)
        # res = self.client.get(url)
        # self.assertEqual(res.status_code, status.HTTP_200_OK)
        # self.assertEqual(res.data["username"], user.username)
        
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

