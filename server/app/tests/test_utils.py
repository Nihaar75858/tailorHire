import pytest
from unittest.mock import MagicMock
from api.utils import HuggingFaceAI
from sentence_transformers import SentenceTransformer, util

#########################
# Cover Letter Tests
#########################
def test_generate_cover_letter_success(monkeypatch):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"generated_text": "This is a great cover letter."}]
    
    def mock_post(*args, **kwargs):
        return mock_response
    
    monkeypatch.setattr("api.utils.requests.post", mock_post)

    ai = HuggingFaceAI()
    result = ai.generate_cover_letter(
        resume_text="Experienced engineer with Python skills.",
        job_description="Looking for a Python developer.",
        user_profile={"name": "Alice", "skills": "Python, Django", "bio": "Engineer"}
    )

    assert "great cover letter" in result
    
def test_generate_cover_letter_fallback_on_error(monkeypatch):
    mock_response = MagicMock()
    mock_response.status_code = 500
    
    def mock_post(*args, **kwargs):
        return mock_response
    
    monkeypatch.setattr("api.utils.requests.post", mock_post)

    ai = HuggingFaceAI()
    result = ai.generate_cover_letter(
        resume_text="",
        job_description="Backend developer role.",
        user_profile={"name": "Bob", "skills": "APIs, REST"}
    )

    assert "Respected Hiring Manager" in result
    assert "Bob" in result

#########################
# Chat Message Tests
#########################
def test_generate_chat_response_success(monkeypatch):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"generated_text": "Bot: Hello, how can I help?"}]
    def mock_post(*args, **kwargs):
        return mock_response
    
    monkeypatch.setattr("api.utils.requests.post", mock_post)

    ai = HuggingFaceAI()
    result = ai.generate_chat_response("Hi there!")

    assert "Hello" in result

def test_generate_chat_response_fallback():
    ai = HuggingFaceAI()
    msg = "Tell me about resume tips"
    result = ai._generate_fallback_response(msg)

    assert "resume" in msg.lower()
    assert "resume" in result.lower() or "improve your resume" in result.lower()

#########################
# Job Tests
#########################
class MockJob:
    def __init__(self, title, description, requirements):
        self.title = title
        self.description = description
        self.requirements = requirements

def test_recommend_jobs(monkeypatch):
    mock_encoder = MagicMock()
    mock_encoder.encode.return_value = "embedding"
    
    monkeypatch.setattr("api.utils.JOB_EMBEDDING_MODEL", mock_encoder)

    mock_similarity = MagicMock()
    mock_similarity.item.return_value = 0.9

    monkeypatch.setattr(
        "api.utils.util.pytorch_cos_sim",
        lambda *args, **kwargs: mock_similarity
    )

    ai = HuggingFaceAI()
    
    jobs = [
        MockJob("Backend Developer", "Python Django APIs", ["REST", "SQL"]),
        MockJob("Frontend Developer", "React JavaScript", ["CSS"])
    ]

    result = ai.recommend_jobs("Python, Django", jobs)

    assert len(result) == 2
    assert isinstance(result[0], MockJob)

