from django.shortcuts import render
from .models import CustomUser, Job
from .serializer import UserSerializer, JobSerializer, JobListSerializer
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from .utils import HuggingFaceAI

ai_helper = HuggingFaceAI()
User = get_user_model()

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def profile(self, request):
        """Get or update current user profile"""
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        else:
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login_user(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        print("Trying login for:", username, password)
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)
            return Response({
                'message': 'Login successful',
                "access": str(access),
                "refresh": str(refresh),
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    # LOGOUT
    @action(detail=False, methods=['post'])
    def logout_user(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.filter(is_active=True)
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'company', 'location', 'description']
    ordering_fields = ['created_at', 'title', 'company']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        return JobSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        job_type = self.request.query_params.get('job_type', None)
        location = self.request.query_params.get('location', None)
        
        if job_type:
            queryset = queryset.filter(job_type=job_type)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def recommended(self, request):
        """Get AI-recommended jobs based on user skills"""
        user = request.user
        if not user.skills:
            return Response(
                {"detail": "Please update your skills in profile to get recommendations"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        jobs = Job.objects.filter(is_active=True)
        recommended_jobs = ai_helper.recommend_jobs(user.skills, jobs)
        
        serializer = JobListSerializer(recommended_jobs, many=True)
        return Response(serializer.data)