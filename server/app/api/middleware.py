from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
import hashlib
import time
from collections import defaultdict
import re

class BotProtectionMiddleware(MiddlewareMixin):
    """
    Detect and block suspicious bot behavior
    """
    
    SUSPICIOUS_USER_AGENTS = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
        'python-requests', 'scrapy', 'headless'
    ]
    
    SUSPICIOUS_PATTERNS = [
        r'(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b)',  # IP addresses in user agent
        r'(bot|crawler|spider|scraper)',
    ]
    
    def process_request(self, request):
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        
        # Check for suspicious user agents
        if any(pattern in user_agent for pattern in self.SUSPICIOUS_USER_AGENTS):
            # Allow legitimate crawlers (optional)
            if 'googlebot' in user_agent or 'bingbot' in user_agent:
                return None
            
            # Block suspicious bots on AI endpoints
            if '/api/chat/' in request.path or '/api/cover-letters/' in request.path:
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'Automated access to AI services is not permitted'
                }, status=403)
        
        return None


class RequestValidationMiddleware(MiddlewareMixin):
    """
    Validate request size and content to prevent abuse
    """
    
    MAX_REQUEST_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_CHAT_MESSAGE_LENGTH = 2000
    MAX_JOB_DESCRIPTION_LENGTH = 10000
    
    def process_request(self, request):
        # Check request size
        if request.META.get('CONTENT_LENGTH'):
            content_length = int(request.META['CONTENT_LENGTH'])
            if content_length > self.MAX_REQUEST_SIZE:
                return JsonResponse({
                    'error': 'Request too large',
                    'message': f'Maximum request size is {self.MAX_REQUEST_SIZE / 1024 / 1024}MB'
                }, status=413)
        
        return None


class IPRateLimitMiddleware(MiddlewareMixin):
    """
    IP-based rate limiting as additional protection
    Prevents distributed bot attacks
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.ip_request_counts = defaultdict(list)
    
    def __call__(self, request):
        ip = self.get_client_ip(request)
        current_time = time.time()
        
        # Check IP-based rate limit for AI endpoints
        if self.is_ai_endpoint(request.path):
            cache_key = f'ip_rate_limit:{ip}'
            request_times = cache.get(cache_key, [])
            
            # Remove requests older than 1 hour
            request_times = [t for t in request_times if current_time - t < 3600]
            
            # Check if exceeded limit (20 requests per hour per IP)
            if len(request_times) >= 20:
                return JsonResponse({
                    'error': 'Rate limit exceeded',
                    'message': 'Too many requests from your IP address. Please try again later.'
                }, status=429)
            
            # Add current request
            request_times.append(current_time)
            cache.set(cache_key, request_times, 3600)
        
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Get real client IP (handles proxies)"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_ai_endpoint(self, path):
        """Check if path is an AI endpoint"""
        ai_endpoints = ['/api/chat/', '/api/cover-letters/', '/api/jobs/recommended/']
        return any(endpoint in path for endpoint in ai_endpoints)