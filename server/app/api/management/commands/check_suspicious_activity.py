from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count
from api.models import AIUsageLog
from datetime import timedelta

class Command(BaseCommand):
    help = 'Check for suspicious AI usage patterns'

    def handle(self, *args, **options):
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        
        # Check for high-frequency users (potential bots)
        high_frequency_users = AIUsageLog.objects.filter(
            created_at__gte=last_hour
        ).values('user_id', 'user__username').annotate(
            count=Count('id')
        ).filter(count__gte=20).order_by('-count')
        
        if high_frequency_users:
            self.stdout.write(self.style.WARNING('\n=== High Frequency Users (Last Hour) ==='))
            for user in high_frequency_users:
                self.stdout.write(
                    self.style.WARNING(
                        f"User: {user['user__username']} (ID: {user['user_id']}) - "
                        f"{user['count']} requests"
                    )
                )
        
        # Check for high-frequency IPs
        high_frequency_ips = AIUsageLog.objects.filter(
            created_at__gte=last_hour
        ).values('ip_address').annotate(
            count=Count('id')
        ).filter(count__gte=30).order_by('-count')
        
        if high_frequency_ips:
            self.stdout.write(self.style.WARNING('\n=== High Frequency IPs (Last Hour) ==='))
            for ip in high_frequency_ips:
                self.stdout.write(
                    self.style.WARNING(
                        f"IP: {ip['ip_address']} - {ip['count']} requests"
                    )
                )
        
        # Check for high error rates
        recent_logs = AIUsageLog.objects.filter(created_at__gte=last_hour)
        total = recent_logs.count()
        errors = recent_logs.exclude(status_code=201).count()
        
        if total > 0:
            error_rate = (errors / total) * 100
            if error_rate > 20:
                self.stdout.write(
                    self.style.WARNING(
                        f'\n=== High Error Rate ===\n'
                        f'Error Rate: {error_rate:.2f}% ({errors}/{total})'
                    )
                )
        
        if not (high_frequency_users or high_frequency_ips or (total > 0 and error_rate > 20)):
            self.stdout.write(self.style.SUCCESS('\nNo suspicious activity detected'))
