from django.shortcuts import render
from .models import CustomUser, Job, SavedJob, CoverLetter
from .serializer import UserSerializer, JobSerializer, JobListSerializer, SavedJobSerializer, CoverLetterSerializer
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
    
class SavedJobViewSet(viewsets.ModelViewSet):
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedJob.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """Remove saved job"""
        job_id = request.data.get('job')
        
        if not job_id:
            return Response(
                {"detail": "Job ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            saved_job = SavedJob.objects.get(user=request.user, job_id=job_id)
            saved_job.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SavedJob.DoesNotExist:
            return Response(
                {"detail": "Saved job not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
class CoverLetterViewSet(viewsets.ModelViewSet):
    serializer_class = CoverLetterSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CoverLetter.objects.filter(user=self.request.user)
    
    def create(self, request):
        """Generate AI cover letter"""
        job_description = request.data.get('job_description')
        resume_text = request.data.get('resume_text', '')
        job_id = request.data.get('job')
        
        if not job_description:
            return Response(
                {"detail": "Job description is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        user_profile = {
            'name': user.get_full_name() or user.username,
            'skills': user.skills or '',
            'bio': user.bio or ''
        }
        
        # Generate cover letter
        generated_letter = ai_helper.generate_cover_letter(
            resume_text, 
            job_description, 
            user_profile
        )
        
        # Save cover letter
        cover_letter_data = {
            'user': user.id,
            'job_description': job_description,
            'resume_text': resume_text,
            'generated_letter': generated_letter
        }
        
        if job_id:
            cover_letter_data['job'] = job_id
        
        cover_letter = CoverLetter.objects.create(
            user=user,
            job_id=job_id if job_id else None,
            job_description=job_description,
            resume_text=resume_text,
            generated_letter=generated_letter
        )
        
        serializer = self.get_serializer(cover_letter)
        return Response(serializer.data, status=status.HTTP_201_CREATED)