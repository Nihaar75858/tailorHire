from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import UserAIQuota

User = get_user_model()

class Command(BaseCommand):
    help = 'Block user from AI services'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to block')
        parser.add_argument(
            '--unblock',
            action='store_true',
            help='Unblock user instead',
        )

    def handle(self, *args, **options):
        username = options['username']
        unblock = options['unblock']
        
        try:
            user = User.objects.get(username=username)
            quota, created = UserAIQuota.objects.get_or_create(user=user)
            
            if unblock:
                quota.daily_limit = 50
                quota.monthly_limit = 1000
                quota.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully unblocked user: {username}')
                )
            else:
                quota.daily_limit = 0
                quota.monthly_limit = 0
                quota.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully blocked user: {username}')
                )
                
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User not found: {username}')
            )