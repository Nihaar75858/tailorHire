import pytest
import django.db
from api.models import CustomUser, Job, SavedJob
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
    
#########################
# Saved Job Model Tests
#########################
@pytest.mark.django_db
def test_create_saved_job(user, job):
    saved = SavedJob.objects.create(user=user, job=job)

    assert saved.id is not None
    assert saved.user == user
    assert saved.job == job
    assert saved.saved_at is not None
    
@pytest.mark.django_db
def test_saved_job_str(user, job):
    saved = SavedJob.objects.create(user=user, job=job)

    assert str(saved) == f"{user.username} saved {job.title}"

@pytest.mark.django_db
def test_user_cannot_save_same_job_twice(user, job):
    SavedJob.objects.create(user=user, job=job)

    with pytest.raises(django.db.utils.IntegrityError):
        SavedJob.objects.create(user=user, job=job)
        
@pytest.mark.django_db
def test_saved_job_ordering(user, job):
    job2 = Job.objects.create(
        title="Frontend Dev",
        company="WebCo",
        location="Remote",
        description="UI",
        requirements=[]
    )

    saved1 = SavedJob.objects.create(user=user, job=job)
    saved2 = SavedJob.objects.create(user=user, job=job2)

    saved_jobs = SavedJob.objects.all()

    assert saved_jobs.first() == saved2
    assert saved_jobs.last() == saved1
    
@pytest.mark.django_db
def test_saved_job_deleted_when_user_deleted(job):
    user = CustomUser.objects.create_user(
        username="tempuser",
        password="test123"
    )

    SavedJob.objects.create(user=user, job=job)

    user.delete()

    assert SavedJob.objects.count() == 0
    
@pytest.mark.django_db
def test_saved_job_deleted_when_job_deleted(user):
    job = Job.objects.create(
        title="Temp Job",
        company="TempCo",
        location="LA",
        description="Temp",
        requirements=[]
    )

    SavedJob.objects.create(user=user, job=job)

    job.delete()

    assert SavedJob.objects.count() == 0
    
@pytest.mark.django_db
def test_reverse_relationships(user, job):
    saved = SavedJob.objects.create(user=user, job=job)

    assert user.saved_jobs.count() == 1
    assert job.saved_by.count() == 1
    assert user.saved_jobs.first() == saved
    assert job.saved_by.first() == saved

#########################
# Cover Letter Model Tests
#########################
@pytest.mark.django_db
class TestCoverLetterModel:

    def test_create_cover_letter(self):
        """Should create a cover letter successfully"""
        user = CustomUser.objects.create_user(
            username="testuser",
            password="pass123"
        )

        job = Job.objects.create(
            title="Backend Dev",
            company="ABC Corp",
            location="Remote",
            salary_min=50000,
            salary_max=70000,
            job_type="Full-time",
            description="Backend role",
            requirements="Python",
            posted_by=user
        )

        cover_letter = CoverLetter.objects.create(
            user=user,
            job=job,
            job_description="Backend role description",
            resume_text="My resume text",
            generated_letter="Generated content"
        )

        assert cover_letter.user == user
        assert cover_letter.job == job
        assert cover_letter.generated_letter == "Generated content"

    def test_str_representation(self):
        """Should return readable string representation"""
        user = CustomUser.objects.create_user(
            username="john",
            password="pass123"
        )

        cover_letter = CoverLetter.objects.create(
            user=user,
            job_description="Desc",
            generated_letter="Letter"
        )

        assert str(cover_letter) == "Cover Letter for john"

    def test_ordering_latest_first(self):
        """Newest cover letter should come first"""
        user = CustomUser.objects.create_user(
            username="orderuser",
            password="pass123"
        )

        older = CoverLetter.objects.create(
            user=user,
            job_description="Old",
            generated_letter="Old Letter"
        )

        newer = CoverLetter.objects.create(
            user=user,
            job_description="New",
            generated_letter="New Letter"
        )

        letters = CoverLetter.objects.all()
        assert letters[0] == newer
        assert letters[1] == older

    def test_user_cascade_delete(self):
        """Deleting user should delete cover letters"""
        user = CustomUser.objects.create_user(
            username="deleteuser",
            password="pass123"
        )

        CoverLetter.objects.create(
            user=user,
            job_description="Desc",
            generated_letter="Letter"
        )

        user.delete()

        assert CoverLetter.objects.count() == 0

    def test_job_set_null_on_delete(self):
        """Deleting job should not delete cover letter"""
        user = CustomUser.objects.create_user(
            username="jobuser",
            password="pass123"
        )

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

        letter = CoverLetter.objects.create(
            user=user,
            job=job,
            job_description="Desc",
            generated_letter="Letter"
        )

        job.delete()
        letter.refresh_from_db()

        assert letter.job is None