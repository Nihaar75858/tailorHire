from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count, Avg, Sum
from api.models import AIUsageLog, UserAIQuota
from datetime import timedelta
import json

class Command(BaseCommand):
    help = 'Generate AI usage report'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to include in report (default: 7)',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['text', 'json'],
            default='text',
            help='Output format',
        )

    def handle(self, *args, **options):
        days = options['days']
        output_format = options['format']
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get usage statistics
        logs = AIUsageLog.objects.filter(created_at__gte=start_date)
        
        total_requests = logs.count()
        successful_requests = logs.filter(status_code=201).count()
        failed_requests = logs.exclude(status_code=201).count()
        
        avg_duration = logs.aggregate(Avg('duration'))['duration__avg'] or 0
        
        # Top users
        top_users = logs.values('user__username').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Endpoint usage
        endpoint_usage = logs.values('endpoint').annotate(
            count=Count('id'),
            avg_duration=Avg('duration')
        ).order_by('-count')
        
        # Quota information
        quota_stats = UserAIQuota.objects.aggregate(
            total_daily=Sum('daily_usage'),
            total_monthly=Sum('monthly_usage'),
            avg_daily=Avg('daily_usage'),
            avg_monthly=Avg('monthly_usage')
        )
        
        if output_format == 'json':
            report = {
                'period_days': days,
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'failed_requests': failed_requests,
                'success_rate': f"{(successful_requests/total_requests*100):.2f}%" if total_requests > 0 else "0%",
                'avg_duration_seconds': f"{avg_duration:.2f}",
                'top_users': list(top_users),
                'endpoint_usage': list(endpoint_usage),
                'quota_stats': quota_stats
            }
            self.stdout.write(json.dumps(report, indent=2, default=str))
        else:
            self.stdout.write(self.style.SUCCESS(f'\n=== AI Usage Report (Last {days} days) ===\n'))
            self.stdout.write(f'Total Requests: {total_requests}')
            self.stdout.write(f'Successful: {successful_requests}')
            self.stdout.write(f'Failed: {failed_requests}')
            self.stdout.write(f'Success Rate: {(successful_requests/total_requests*100):.2f}%' if total_requests > 0 else 'N/A')
            self.stdout.write(f'Average Duration: {avg_duration:.2f}s')
            
            self.stdout.write(self.style.SUCCESS('\n=== Top 10 Users ==='))
            for user in top_users:
                self.stdout.write(f"  {user['user__username']}: {user['count']} requests")
            
            self.stdout.write(self.style.SUCCESS('\n=== Endpoint Usage ==='))
            for endpoint in endpoint_usage:
                self.stdout.write(
                    f"  {endpoint['endpoint']}: {endpoint['count']} requests "
                    f"(avg: {endpoint['avg_duration']:.2f}s)"
                )
            
            self.stdout.write(self.style.SUCCESS('\n=== Quota Statistics ==='))
            self.stdout.write(f"Total Daily Usage: {quota_stats['total_daily'] or 0}")
            self.stdout.write(f"Total Monthly Usage: {quota_stats['total_monthly'] or 0}")
            self.stdout.write(f"Avg Daily per User: {quota_stats['avg_daily'] or 0:.2f}")
            self.stdout.write(f"Avg Monthly per User: {quota_stats['avg_monthly'] or 0:.2f}")
