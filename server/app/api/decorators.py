from functools import wraps
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status
import hashlib
import time

def ai_rate_limit(max_requests=10, time_window=3600):
    """
    Custom decorator for additional AI rate limiting
    
    Usage:
        @ai_rate_limit(max_requests=5, time_window=3600)
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if request.user.is_authenticated:
                user_id = request.user.id
            else:
                # Use IP for anonymous users
                user_id = request.META.get('REMOTE_ADDR', 'unknown')
            
            # Create cache key
            cache_key = f'ai_limit:{view_func.__name__}:{user_id}'
            
            # Get current request count
            request_data = cache.get(cache_key, {'count': 0, 'reset_time': time.time() + time_window})
            
            current_time = time.time()
            
            # Reset if time window passed
            if current_time > request_data['reset_time']:
                request_data = {'count': 0, 'reset_time': current_time + time_window}
            
            # Check limit
            if request_data['count'] >= max_requests:
                return Response({
                    'error': 'Rate limit exceeded',
                    'message': f'Maximum {max_requests} requests per {time_window // 60} minutes',
                    'retry_after': int(request_data['reset_time'] - current_time)
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Increment count
            request_data['count'] += 1
            cache.set(cache_key, request_data, time_window)
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def require_verified_user(view_func):
    """
    Require user to be verified before accessing AI features
    Prevents newly created bot accounts from abusing AI
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'error': 'Authentication required',
                'message': 'You must be logged in to use AI features'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user account is at least 1 hour old
        account_age = (timezone.now() - request.user.date_joined).total_seconds()
        if account_age < 3600:  # 1 hour
            return Response({
                'error': 'Account too new',
                'message': 'AI features are available 1 hour after account creation'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def log_ai_usage(view_func):
    """
    Log AI usage for monitoring and cost tracking
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        start_time = time.time()
        
        # Execute view
        response = view_func(request, *args, **kwargs)
        
        # Log usage
        duration = time.time() - start_time
        
        # Store in database or logging system
        from api.models import AIUsageLog
        AIUsageLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            endpoint=view_func.__name__,
            duration=duration,
            status_code=response.status_code,
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        
        return response
    
    return wrapper