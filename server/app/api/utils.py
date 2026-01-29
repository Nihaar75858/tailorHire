import requests
from django.conf import settings
from sentence_transformers import SentenceTransformer, util
import torch

# Call the model once per process
JOB_EMBEDDING_MODEL = SentenceTransformer('paraphrase-MiniLM-L6-v2')

class HuggingFaceAI:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.api_url = "https://api-inference.huggingface.co/models/"
        
    def generate_cover_letter(self, resume_text, job_description, user_profile):
        """Generate cover letter using Hugging Face API"""
        try:
            model = "facebook/bart-large-cnn"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            prompt = f"""
            Generate a professional cover letter based on the following:
            
            Candidate Profile:
            Name: {user_profile.get('name', '')}
            Skills: {user_profile.get('skills', '')}
            Bio: {user_profile.get('bio', '')}
            
            Job Description:
            {job_description}
            
            Resume Summary:
            {resume_text[:500] if resume_text else 'Not provided'}
            """
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": 500,
                    "min_length": 200,
                    "do_sample": True,
                    "temperature": 0.7
                }
            }
            
            response = requests.post(
                f"{self.api_url}{model}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result[0].get('generated_text', '')
            else:
                return self._generate_fallback_cover_letter(user_profile, job_description)
                
        except Exception as e:
            print(f"Error generating cover letter: {str(e)}")
            return self._generate_fallback_cover_letter(user_profile, job_description)
    
    def _generate_fallback_cover_letter(self, user_profile, job_description):
        """Fallback cover letter generation"""
        name = user_profile.get('name', 'Applicant')
        skills = user_profile.get('skills', 'various technical skills')
        
        return f"""Respected Hiring Manager,

I am writing to express my strong interest in the position at your esteemed organization. With my background in {skills} and proven track record in the field, I am confident I would be a valuable addition to your team.

Throughout my career, I have successfully delivered high-quality solutions that align with business objectives. My experience has equipped me with the technical expertise necessary to excel in this role.

I am particularly drawn to this opportunity because it aligns perfectly with my passion for innovation and professional growth. I am excited about the prospect of contributing to your team's success and would welcome the opportunity to discuss how my skills and experience can benefit your organization.

Thank you for considering my application. I look forward to the opportunity to speak with you further.

Sincerely,
{name}"""

    def generate_chat_response(self, user_message, conversation_history=None):
        """Generate AI chat response using Hugging Face"""
        try:
            model = "facebook/blenderbot-400M-distill"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            context = ""
            if conversation_history:
                recent = conversation_history[:3]
                context = "\n".join([f"User: {msg['message']}\nBot: {msg['response']}" 
                                    for msg in recent])
            
            prompt = f"{context}\nUser: {user_message}\nBot:"
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": 200,
                    "temperature": 0.8,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                f"{self.api_url}{model}",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result[0].get('generated_text', '').split('Bot:')[-1].strip()
            else:
                return self._generate_fallback_response(user_message)
                
        except Exception as e:
            print(f"Error generating chat response: {str(e)}")
            return self._generate_fallback_response(user_message)
    
    def _generate_fallback_response(self, user_message):
        """Fallback chat responses"""
        responses = {
            'interview': "For interview preparation, focus on these key areas: 1) Review common technical questions, 2) Practice behavioral questions using the STAR method, 3) Research the company thoroughly, 4) Prepare questions to ask the interviewer.",
            'resume': "To improve your resume: 1) Use action verbs and quantify achievements, 2) Tailor it to each job application, 3) Keep it concise (1-2 pages), 4) Include relevant keywords from job descriptions.",
            'salary': "For salary negotiations: 1) Research market rates for your role and location, 2) Consider total compensation including benefits, 3) Wait for the offer before discussing numbers, 4) Be prepared to justify your requested salary.",
            'career': "For career growth: 1) Set clear short and long-term goals, 2) Continuously learn new skills, 3) Network actively in your industry, 4) Seek mentorship and feedback.",
        }
        
        message_lower = user_message.lower()
        for key, response in responses.items():
            if key in message_lower:
                return response
        
        return "Thank you for your question. I'm here to help with career advice, interview preparation, resume tips, and job search strategies. What specific aspect would you like to discuss?"

    def recommend_jobs(self, user_skills, jobs):
        """Recommend jobs based on skill similarity"""
        try:
            # from sentence_transformers import SentenceTransformer, util
            
            model = JOB_EMBEDDING_MODEL
            
            skill_embedding = model.encode(user_skills, convert_to_tensor=True)
            
            job_scores = []
            for job in jobs:
                job_text = f"{job.title} {job.description} {' '.join(job.requirements)}"
                job_embedding = model.encode(job_text, convert_to_tensor=True)
                
                similarity = util.pytorch_cos_sim(skill_embedding, job_embedding).item()
                job_scores.append((job, similarity))
            
            job_scores.sort(key=lambda x: x[1], reverse=True)
            
            return [job for job, score in job_scores[:10]]
            
        except Exception as e:
            print(f"Error recommending jobs: {str(e)}")
            return jobs[:10]
