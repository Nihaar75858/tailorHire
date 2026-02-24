import pytest
import django.db
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import Group, Permission
from api.models import CustomUser, Job, SavedJob, CoverLetter
from api.serializer import UserSerializer, JobSerializer, JobListSerializer, SavedJobSerializer, CoverLetterSerializer

#########################
# User Serializer Tests
#########################
@pytest.mark.django_db
def test_user_serializer_create_hashes_password():
    data = {
        "username": "john123",
        "email": "user@example.com",
        "password": "plainpassword",
        "firstName": "John",
        "lastName": "Doe",
    }

    serializer = UserSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    user = serializer.save()

    assert user.username == "john123"
    assert user.password != "plainpassword"
    assert user.check_password("plainpassword")
    
@pytest.mark.django_db
def test_user_serializer_password_write_only():
    user = CustomUser.objects.create_user(
        username="john",
        password="secret"
    )

    serializer = UserSerializer(user)
    data = serializer.data

    assert "password" not in data
    
@pytest.mark.django_db
def test_user_serializer_role_saved():
    data = {
        "username": "roleuser",
        "password": "test123",
        "email": "role@example.com",
        "firstName": "Role",
        "lastName": "User",
        "role": ["User", "Recruiter"]
    }

    serializer = UserSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    user = serializer.save()

    assert user.role == ["User", "Recruiter"]
    
@pytest.mark.django_db
def test_user_serializer_groups_assignment():
    group = Group.objects.create(name="TestGroup")

    data = {
        "username": "groupuser",
        "password": "test123",
        "email": "role@example.com",
        "firstName": "Role",
        "lastName": "User",
        "groups": [group.id]
    }

    serializer = UserSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    user = serializer.save()

    assert user.groups.count() == 1
    assert user.groups.first() == group
    
@pytest.mark.django_db
def test_user_serializer_update_password():
    user = CustomUser.objects.create_user(
        username="updateuser",
        password="oldpass"
    )

    serializer = UserSerializer(
        instance=user,
        data={"password": "newpass"},
        partial=True
    )

    assert serializer.is_valid(), serializer.errors
    updated_user = serializer.save()

    assert updated_user.check_password("newpass")

#########################
# Job Serializer Tests
#########################
@pytest.mark.django_db
def test_job_serializer_posted_by_name():
    user = CustomUser.objects.create_user(
        username="recruiter",
        password="test123"
    )

    job = Job.objects.create(
        title="Backend Dev",
        company="TechCorp",
        location="NY",
        description="APIs",
        requirements=[],
        posted_by=user
    )

    serializer = JobSerializer(job)
    data = serializer.data

    assert data["posted_by_name"] == "recruiter"
    
@pytest.mark.django_db
def test_job_serializer_posted_by_read_only():
    user = CustomUser.objects.create_user(
        username="recruiter",
        password="test123"
    )

    data = {
        "title": "Backend Dev",
        "company": "TechCorp",
        "location": "NY",
        "description": "APIs",
        "requirements": [],
        "posted_by": user.id
    }

    serializer = JobSerializer(data=data)
    assert serializer.is_valid(), serializer.errors

    job = serializer.save()

    # Should NOT be assigned automatically
    assert job.posted_by is None
    
#########################
# Job List Serializer Tests
#########################
@pytest.mark.django_db
def test_job_list_serializer_fields():
    user = CustomUser.objects.create_user(
        username="recruiter",
        password="test123"
    )

    job = Job.objects.create(
        title="Backend Dev",
        company="TechCorp",
        location="NY",
        description="APIs",
        requirements=[],
        posted_by=user
    )

    serializer = JobListSerializer(job)
    data = serializer.data

    expected_fields = {
        "id", "title", "company", "location",
        "salary_min", "salary_max",
        "job_type", "description",
        "requirements", "posted_by_name", "created_at"
    }

    assert set(data.keys()) == expected_fields
    
#########################
# Saved Job Serializer Tests
#########################
@pytest.mark.django_db
def test_savedjob_serializer_create(user, job):
    serializer = SavedJobSerializer(
        data={"job": job.id},
        context={"request": None}
    )

    assert serializer.is_valid(), serializer.errors

    # user must be injected manually since it's read-only
    saved = serializer.save(user=user)

    assert saved.user == user
    assert saved.job == job
    
@pytest.mark.django_db
def test_savedjob_serializer_user_read_only(user, job):
    another_user = CustomUser.objects.create_user(
        username="hacker",
        password="test123",
        email="hack@example.com",
        firstName="Hack",
        lastName="User"
    )

    serializer = SavedJobSerializer(
        data={"job": job.id, "user": another_user.id}
    )

    assert serializer.is_valid(), serializer.errors

    saved = serializer.save(user=user)

    # Should not allow overriding user
    assert saved.user == user
    
@pytest.mark.django_db
def test_savedjob_serializer_saved_at_read_only(user, job):
    serializer = SavedJobSerializer(
        data={"job": job.id, "saved_at": "2000-01-01T00:00:00Z"}
    )

    assert serializer.is_valid(), serializer.errors

    saved = serializer.save(user=user)

    assert saved.saved_at is not None
    
@pytest.mark.django_db
def test_savedjob_serializer_job_details(user, job):
    saved = SavedJob.objects.create(user=user, job=job)

    serializer = SavedJobSerializer(saved)
    data = serializer.data

    assert "job_details" in data
    assert data["job_details"]["title"] == job.title
    assert data["job_details"]["company"] == job.company

@pytest.mark.django_db
def test_savedjob_serializer_duplicate(user, job):
    SavedJob.objects.create(user=user, job=job)

    serializer = SavedJobSerializer(data={"job": job.id})
    assert serializer.is_valid(), serializer.errors

    with pytest.raises(django.db.utils.IntegrityError):
        serializer.save(user=user)
        
@pytest.mark.django_db
def test_savedjob_serializer_fields(user, job):
    saved = SavedJob.objects.create(user=user, job=job)

    serializer = SavedJobSerializer(saved)
    data = serializer.data

    expected_fields = {"id", "job", "job_details", "saved_at"}

    assert set(data.keys()) == expected_fields
    
#########################
# Cover Letter Serializer Tests
#########################
@pytest.mark.django_db
class TestCoverLetterSerializer:

    def test_serialize_cover_letter(self):
        """Should serialize all fields correctly"""
        user = CustomUser.objects.create_user(username="john", password="pass123")

        job = Job.objects.create(
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

        letter = CoverLetter.objects.create(
            user=user,
            job=job,
            job_description="Job desc",
            resume_text="Resume",
            generated_letter="Generated text"
        )

        serializer = CoverLetterSerializer(letter)
        data = serializer.data

        assert data["job"] == job.id
        assert data["job_title"] == "Backend Dev"
        assert data["job_description"] == "Job desc"
        assert data["generated_letter"] == "Generated text"

    def test_create_cover_letter_valid(self):
        """Should validate creation payload (excluding read-only fields)"""
        user = CustomUser.objects.create_user(username="create", password="pass123")

        job = Job.objects.create(
            title="Dev",
            company="XYZ",
            location="Remote",
            salary_min=40000,
            salary_max=60000,
            job_type="Full-time",
            description="Desc",
            requirements="Req",
            posted_by=user
        )

        payload = {
            "job": job.id,
            "job_description": "Some job desc",
            "resume_text": "Resume text"
        }

        serializer = CoverLetterSerializer(data=payload)
        assert serializer.is_valid()

    def test_generated_letter_is_read_only(self):
        """Should not allow client to set generated_letter"""
        user = CustomUser.objects.create_user(username="readonly", password="pass123")

        payload = {
            "job_description": "Desc",
            "generated_letter": "Hacked!"
        }

        serializer = CoverLetterSerializer(data=payload)

        assert serializer.is_valid()
        assert "generated_letter" not in serializer.validated_data

    def test_user_is_read_only(self):
        """User field should not be writable"""
        user = CustomUser.objects.create_user(username="u1", email="u1@test.com", password="pass123")
        other_user = CustomUser.objects.create_user(username="u2", email="u2@test.com", password="pass123")

        payload = {
            "user": other_user.id,
            "job_description": "Desc"
        }

        serializer = CoverLetterSerializer(data=payload)

        assert serializer.is_valid()
        assert "user" not in serializer.validated_data