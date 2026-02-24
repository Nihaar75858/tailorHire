from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, JobViewSet, SavedJobViewSet, CoverLetterViewSet

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('jobs', JobViewSet, basename='job')
router.register('saved-jobs', SavedJobViewSet, basename='saved-job')
router.register('cover-letters', CoverLetterViewSet, basename='cover-letter')

urlpatterns = [
    path('', include(router.urls))
]