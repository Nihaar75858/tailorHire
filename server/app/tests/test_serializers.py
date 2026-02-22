import pytest
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import Group, Permission
from api.models import CustomUser, Job
from api.serializer import UserSerializer, JobSerializer, JobListSerializer

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
    
