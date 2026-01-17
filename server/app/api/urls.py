from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, JobViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('jobs', JobViewSet, basename='job')

urlpatterns = router.urls