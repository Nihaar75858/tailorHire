from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator

# Create your models here.
class CustomUser(AbstractUser):
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    bio = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=300, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]
    )
    role = models.JSONField(blank=True, null=True, default=list)
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    def __str__(self):
        return self.firstName

class Job(models.Model):
    JOB_TYPES = [
        ('full-time', 'Full-time'),
        ('part-time', 'Part-time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]
    
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    salary_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, default='full-time')
    description = models.TextField()
    requirements = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    posted_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='posted_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        
    def salary_range(self):
        if self.salary_min and self.salary_max:
            return f"${self.salary_min} - ${self.salary_max}"
        elif self.salary_min:
            return f"From ${self.salary_min}"
        elif self.salary_max:
            return f"Up to ${self.salary_max}"
        return "Not specified"

    def __str__(self):
        return f"{self.title} at {self.company}"
    
class SavedJob(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"
    
class CoverLetter(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='cover_letters')
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    job_description = models.TextField()
    resume_text = models.TextField(blank=True, null=True)
    generated_letter = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Cover Letter for {self.user.username}"