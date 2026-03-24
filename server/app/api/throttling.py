from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
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
                
class CoverLetterThrottle(UserRateThrottle): 
    """ Throttle for cover letter generation 10 requests per hour per user """ 
    scope = 'cover_letter' 
    rate = '10/hour' 

class ChatMessageThrottle(UserRateThrottle): 
    """ Throttle for chat messages 30 requests per hour per user """ 
    scope = 'chat_message' 
    rate = '30/hour' 
    
class JobRecommendationThrottle(UserRateThrottle): 
    """ Throttle for AI job recommendations 20 requests per hour per user """ 
    scope = 'job_recommendation' 
    rate = '20/hour' 

class BurstRateThrottle(UserRateThrottle): 
    """ Prevent rapid-fire requests (burst protection) 5 requests per minute """ 
    scope = 'burst' 
    rate = '5/min' 

class DailyAILimitThrottle(UserRateThrottle): 
    """ Daily limit for all AI operations combined 50 AI requests per day per user """ 
    scope = 'daily_ai' 
    rate = '50/day' 
    
class AnonymousStrictThrottle(AnonRateThrottle): 
    """ Very strict throttle for anonymous users Prevents bot attacks """ 
    scope = 'anon_strict' 
    rate = '5/hour'