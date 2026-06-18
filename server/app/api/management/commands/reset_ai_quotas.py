from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import UserAIQuota
from datetime import date

class Command(BaseCommand):
    help = 'Reset daily and monthly AI quotas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--daily',
            action='store_true',
            help='Reset daily quotas only',
        )
        parser.add_argument(
            '--monthly',
            action='store_true',
            help='Reset monthly quotas only',
        )

    def handle(self, *args, **options):
        if options['daily']:
            count = UserAIQuota.objects.all().update(daily_usage=0)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully reset daily quotas for {count} users')
            )
        elif options['monthly']:
            count = UserAIQuota.objects.all().update(monthly_usage=0)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully reset monthly quotas for {count} users')
            )
        else:
            # Auto-detect based on date
            today = date.today()
            if today.day == 1:
                count = UserAIQuota.objects.all().update(
                    daily_usage=0,
                    monthly_usage=0,
                    last_reset_date=today
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully reset monthly and daily quotas for {count} users')
                )
            else:
                count = UserAIQuota.objects.all().update(
                    daily_usage=0,
                    last_reset_date=today
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully reset daily quotas for {count} users')
                )
