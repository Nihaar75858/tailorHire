import pytest
from api.models import CustomUser, Job
from django.utils import timezone
from decimal import Decimal

#########################
# Custom User Model Tests
#########################
@pytest.mark.django_db
def test_create_custom_user():
    user = CustomUser.objects.create_user(
        username="john123",
        email="user1@example.com",
        password="hello123",
        firstName="John",
        lastName="Doe",
        bio="I am ready to work",
        location="Indiana, USA",
        skills="Java, Python, C",
        role=["User", "Recruiter"],
    )

    assert user.username == "john123"
    assert user.check_password("hello123")
    assert not user.profile_picture
    assert user.role == ["User", "Recruiter"]
    assert str(user) == "John"
    
    
#########################
# Job Model Tests
#########################
@pytest.mark.django_db
def test_create_job_basic():
    user = CustomUser.objects.create_user(
        username="recruiter",
        password="test123"
    )

    job = Job.objects.create(
        title="Backend Developer",
        company="TechCorp",
        location="New York",
        salary_min=Decimal("60000.00"),
        salary_max=Decimal("90000.00"),
        job_type="full-time",
        description="Develop APIs",
        requirements=["Python", "Django"],
        posted_by=user
    )

    assert job.id is not None
    assert job.title == "Backend Developer"
    assert job.salary_min == Decimal("60000.00")
    assert job.requirements == ["Python", "Django"]
    assert job.job_type in dict(Job.JOB_TYPES)
    assert job.is_active is True
    assert job.posted_by == user
    assert job.created_at is not None

@pytest.mark.django_db
def test_job_str_representation():
    job = Job.objects.create(
        title="Frontend Developer",
        company="WebWorks",
        location="Remote",
        description="Build UIs",
        requirements=[]
    )

    assert str(job) == "Frontend Developer at WebWorks"

@pytest.mark.django_db
def test_job_ordering_by_created_at():
    job1 = Job.objects.create(
        title="Older",
        company="OldCo",
        location="LA",
        description="Test",
        requirements=[]
    )

    job2 = Job.objects.create(
        title="Newer",
        company="NewCo",
        location="SF",
        description="Test",
        requirements=[]
    )

    jobs = Job.objects.all()

    assert jobs.first() == job2
    assert jobs.last() == job1

@pytest.mark.django_db
def test_job_defaults_and_nullables():
    job = Job.objects.create(
        title="Intern",
        company="FutureStart",
        location="Boston",
        description="Assist",
        requirements=[]
    )

    assert job.salary_min is None
    assert job.salary_max is None
    assert job.job_type == "full-time"
    assert job.posted_by is None
    assert job.is_active is True
    
@pytest.mark.django_db
def test_job_updates_updated_at():
    job = Job.objects.create(
        title="DevOps",
        company="CloudNet",
        location="Austin",
        description="Infra",
        requirements=[]
    )

    old_updated_at = job.updated_at

    job.title = "Senior DevOps"
    job.save()

    job.refresh_from_db()

    assert job.title == "Senior DevOps"
    assert job.updated_at > old_updated_at
        
@pytest.mark.django_db
def test_salary_range_display():
    job = Job.objects.create(
        title="Designer",
        company="Designify",
        location="Remote",
        description="Visuals",
        requirements=[],
        salary_min=Decimal("40000.00"),
        salary_max=Decimal("60000.00")
    )

    assert job.salary_range() == "$40000.00 - $60000.00"
    
@pytest.mark.django_db
def test_salary_range_only_min():
    job = Job.objects.create(
        title="Junior",
        company="X",
        location="Remote",
        description="Test",
        requirements=[],
        salary_min=Decimal("30000.00")
    )

    assert job.salary_range() == "From $30000.00"
    
@pytest.mark.django_db
def test_salary_range_only_max():
    job = Job.objects.create(
        title="Junior",
        company="X",
        location="Remote",
        description="Test",
        requirements=[],
        salary_max=Decimal("50000.00")
    )

    assert job.salary_range() == "Up to $50000.00"
