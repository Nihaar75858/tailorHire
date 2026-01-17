from django.test import TestCase
from api import models
from django.utils import timezone
from decimal import Decimal

class UserModelTest(TestCase):
    """Tests for the CustomUser model"""
    def test_create_user_model(self):
        """Test user creation and __str__ method"""
        user = models.CustomUser.objects.create(
            firstName = "John",
            lastName = "Doe",
            username = "John123",
            email = "user1@example.com",
            password = "hello123",
            bio = "I am ready to work",
            location = "Indiana, USA",
            skills = "Java, Python, C",
            profile_picture="profiles/profile_picture.jpg",
            role = ["User", "Recruiter", "Admin"],
        )

        self.assertEqual(user.profile_picture, "profiles/profile_picture.jpg")
        
class TestJobModel(TestCase):

    def test_create_job_basic(self):
        """Should create a Job instance with valid data"""
        user = models.CustomUser.objects.create_user(username="recruiter", password="test123")

        job = models.Job.objects.create(
            title="Backend Developer",
            company="TechCorp",
            location="New York",
            salary_min=Decimal("60000.00"),
            salary_max=Decimal("90000.00"),
            job_type="full-time",
            description="Develop and maintain backend APIs.",
            requirements=["Python", "Django", "REST"],
            posted_by=user
        )

        assert job.id is not None
        assert job.title == "Backend Developer"
        assert job.company == "TechCorp"
        assert job.salary_min == Decimal("60000.00")
        assert job.requirements == ["Python", "Django", "REST"]
        assert job.job_type in dict(models.Job.JOB_TYPES)
        assert job.is_active is True
        assert isinstance(job.created_at, timezone.datetime)

    def test_str_representation(self):
        """Should return a human-readable string for the job"""
        job = models.Job.objects.create(
            title="Frontend Developer",
            company="WebWorks",
            location="Remote",
            description="Build modern UIs.",
            requirements=["React", "CSS"]
        )
        assert str(job) == "Frontend Developer at WebWorks"

    def test_ordering_by_created_at(self):
        """Should order jobs with newest first"""
        job1 = models.Job.objects.create(
            title="Older Job", company="OldCo", location="LA", description="Test", requirements=[]
        )
        job2 = models.Job.objects.create(
            title="Newer Job", company="NewCo", location="SF", description="Test", requirements=[]
        )
        jobs = models.Job.objects.all()
        assert jobs.first() == job2
        assert jobs.last() == job1

    def test_defaults_and_nullables(self):
        """Should apply default values and allow nulls where expected"""
        job = models.Job.objects.create(
            title="Intern",
            company="FutureStart",
            location="Boston",
            description="Assist senior devs.",
            requirements=[]
        )

        assert job.salary_min is None
        assert job.salary_max is None
        assert job.job_type == "full-time"
        assert job.posted_by is None
        assert job.is_active is True

    def test_can_update_job_fields(self):
        """Should update editable fields and set updated_at automatically"""
        job = models.Job.objects.create(
            title="DevOps Engineer",
            company="CloudNet",
            location="Austin",
            description="Maintain infrastructure.",
            requirements=["AWS", "CI/CD"]
        )

        old_updated_at = job.updated_at
        job.title = "Senior DevOps Engineer"
        job.is_active = False
        job.save()

        job.refresh_from_db()
        assert job.title == "Senior DevOps Engineer"
        assert job.is_active is False
        assert job.updated_at > old_updated_at
        
    def test_salary_range_display(self):
        job = models.Job.objects.create(
            title="Designer",
            company="Designify",
            location="Remote",
            description="Create visuals.",
            requirements=[],
            salary_min=Decimal("40000.00"),
            salary_max=Decimal("60000.00")
        )
        assert job.salary_range() == "$40000.00 - $60000.00"
