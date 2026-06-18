from django.contrib import admin
from .models import CustomUser, AIUsageLog, UserAIQuota

# Register your models here.
admin.site.register(CustomUser)


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'endpoint', 'status_code', 'duration', 'ip_address', 'created_at']
    list_filter = ['endpoint', 'status_code', 'created_at']
    search_fields = ['user__username', 'ip_address', 'endpoint']
    readonly_fields = ['user', 'endpoint', 'duration', 'status_code', 'ip_address', 'user_agent', 'created_at']
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False  # Logs should not be manually added
    
    def has_change_permission(self, request, obj=None):
        return False  # Logs should not be edited


@admin.register(UserAIQuota)
class UserAIQuotaAdmin(admin.ModelAdmin):
    list_display = ['user', 'daily_usage', 'daily_limit', 'monthly_usage', 'monthly_limit', 'is_premium']
    list_filter = ['is_premium', 'last_reset_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['daily_usage', 'monthly_usage', 'last_reset_date']
    
    fieldsets = (
        ('User', {
            'fields': ('user', 'is_premium')
        }),
        ('Limits', {
            'fields': ('daily_limit', 'monthly_limit')
        }),
        ('Usage', {
            'fields': ('daily_usage', 'monthly_usage', 'last_reset_date')
        }),
    )
    
    actions = ['reset_daily_quota', 'reset_monthly_quota', 'make_premium', 'remove_premium']
    
    def reset_daily_quota(self, request, queryset):
        count = queryset.update(daily_usage=0)
        self.message_user(request, f'{count} user(s) daily quota reset.')
    reset_daily_quota.short_description = "Reset daily quota"
    
    def reset_monthly_quota(self, request, queryset):
        count = queryset.update(monthly_usage=0)
        self.message_user(request, f'{count} user(s) monthly quota reset.')
    reset_monthly_quota.short_description = "Reset monthly quota"
    
    def make_premium(self, request, queryset):
        count = queryset.update(is_premium=True)
        self.message_user(request, f'{count} user(s) upgraded to premium.')
    make_premium.short_description = "Make premium"
    
    def remove_premium(self, request, queryset):
        count = queryset.update(is_premium=False)
        self.message_user(request, f'{count} user(s) downgraded from premium.')
    remove_premium.short_description = "Remove premium"