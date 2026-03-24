from rest_framework.throttling import UserRateThrottle
from rest_framework.exceptions import Throttled 

class AIServiceThrottle(UserRateThrottle): 
    """ Strict rate limiting for AI-powered endpoints Prevents abuse of expensive AI API calls """ 
    scope = 'ai_service' 
    default_rate = '5/min'
    
    def get_cache_key(self, request, view): 
        if request.user.is_authenticated: ident = request.user.pk 
        else: ident = self.get_ident(request) 
        
        return self.cache_format % { 'scope': self.scope, 'ident': ident } 
    
    def throttle_failure(self): 
        """Custom message when rate limit exceeded""" 
        raise Throttled( 
            detail={ 
                "error": "AI service rate limit exceeded", 
                "message": "You've reached the maximum number of AI requests. Please try again later.", 
                "retry_after": self.wait() 
                } 
            )
                
class CoverLetterThrottle():
    pass


class ChatMessageThrottle():
    pass


class JobRecommendationThrottle():
    pass


class BurstRateThrottle():
    pass


class DailyAILimitThrottle():
    pass


class AnonymousStrictThrottle():
    pass