from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, JobViewSet, SavedJobViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('jobs', JobViewSet, basename='job')
router.register('saved-jobs', SavedJobViewSet, basename='saved-job')

urlpatterns = [
    path('', include(router.urls))
]