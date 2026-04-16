from rest_framework import serializers
from django.core.validators import validate_email
import re

class ContentValidator:
    """
    Validate user-submitted content for suspicious patterns
    """
    
    SPAM_PATTERNS = [
        r'(?i)(viagra|cialis|pharmacy|casino|lottery|prize)',
        r'(?i)(click here|buy now|limited offer)',
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',  # URLs
        r'(.)\1{10,}',  # Repeated characters (aaaaaaaaaaa)
    ]
    
    @staticmethod
    def validate_chat_message(message):
        """Validate chat message content"""
        if not message or not message.strip():
            raise serializers.ValidationError("Message cannot be empty")
        
        if len(message) > 2000:
            raise serializers.ValidationError("Message too long (max 2000 characters)")
        
        # Check for spam patterns
        for pattern in ContentValidator.SPAM_PATTERNS:
            if re.search(pattern, message):
                raise serializers.ValidationError("Message contains prohibited content")
        
        return message
    
    @staticmethod
    def validate_job_description(description):
        """Validate job description content"""
        if not description or not description.strip():
            raise serializers.ValidationError("Job description cannot be empty")
        
        if len(description) > 10000:
            raise serializers.ValidationError("Job description too long (max 10000 characters)")
        
        # Minimum length check (prevent gibberish)
        if len(description.strip()) < 50:
            raise serializers.ValidationError("Job description too short (min 50 characters)")
        
        return description
    
    @staticmethod
    def validate_resume_text(text):
        """Validate resume text"""
        if text and len(text) > 50000:
            raise serializers.ValidationError("Resume text too long (max 50000 characters)")
        
        return text


class HoneypotValidator:
    """
    Honeypot field to catch bots
    Add hidden field in forms that humans shouldn't fill
    """
    
    @staticmethod
    def validate_honeypot(value):
        """If honeypot field is filled, it's likely a bot"""
        if value:
            raise serializers.ValidationError("Bot detected")
        return value