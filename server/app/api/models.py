from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.contrib.auth import get_user_model

# Create your models here.
class CustomUser(AbstractUser):
    firstName = models.CharField(max_length=100)
    lastName = models.CharField(max_length=100)
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
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

User = get_user_model()

class AIUsageLog(models.Model):
    """
    Track AI usage for monitoring and cost management
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    endpoint = models.CharField(max_length=100)
    request_data = models.JSONField(null=True, blank=True)
    duration = models.FloatField(help_text="Request duration in seconds")
    status_code = models.IntegerField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['endpoint', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.endpoint} - {self.user} - {self.created_at}"


class UserAIQuota(models.Model):
    """
    Track user AI quotas and limits
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_quota')
    daily_limit = models.IntegerField(default=50)
    monthly_limit = models.IntegerField(default=1000)
    daily_usage = models.IntegerField(default=0)
    monthly_usage = models.IntegerField(default=0)
    last_reset_date = models.DateField(auto_now_add=True)
    is_premium = models.BooleanField(default=False)
    
    def reset_daily(self):
        """Reset daily usage counter"""
        self.daily_usage = 0
        self.save()
    
    def reset_monthly(self):
        """Reset monthly usage counter"""
        self.monthly_usage = 0
        self.save()
    
    def can_make_request(self):
        """Check if user can make AI request"""
        if self.is_premium:
            return True
        return self.daily_usage < self.daily_limit and self.monthly_usage < self.monthly_limit
    
    def increment_usage(self):
        """Increment usage counters"""
        self.daily_usage += 1
        self.monthly_usage += 1
        self.save()

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
    
class Application(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('reviewing', 'Reviewing'),
        ('interview', 'Interview'),
        ('rejected', 'Rejected'),
        ('accepted', 'Accepted'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='applications')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    cover_letter = models.TextField(blank=True, null=True)
    resume = models.FileField(
        upload_to='resumes/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx'])]
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        unique_together = ['user', 'job']
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.job.title}"
    
class ChatMessage(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='chat_messages'
    )
    message = models.TextField(blank=False)
    response = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.message[:50]}"