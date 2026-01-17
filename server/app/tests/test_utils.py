# import pytest
from unittest.mock import patch, MagicMock
from api.utils import HuggingFaceAI
from sentence_transformers import SentenceTransformer, util
from unittest.mock import patch

# @pytest.mark.django_db
@patch("api.utils.requests.post")
def test_generate_cover_letter_success(mock_post, settings):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"generated_text": "This is a great cover letter."}]
    mock_post.return_value = mock_response

    ai = HuggingFaceAI()
    result = ai.generate_cover_letter(
        resume_text="Experienced engineer with Python skills.",
        job_description="Looking for a Python developer.",
        user_profile={"name": "Alice", "skills": "Python, Django", "bio": "Engineer"}
    )

    assert "great cover letter" in result
    mock_post.assert_called_once()
    
@patch("api.utils.requests.post")
def test_generate_cover_letter_fallback_on_error(mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_post.return_value = mock_response

    ai = HuggingFaceAI()
    result = ai.generate_cover_letter(
        resume_text="",
        job_description="Backend developer role.",
        user_profile={"name": "Bob", "skills": "APIs, REST"}
    )

    assert "Dear Hiring Manager" in result
    assert "Bob" in result

@patch("api.utils.requests.post")
def test_generate_chat_response_success(mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [{"generated_text": "Bot: Hello, how can I help?"}]
    mock_post.return_value = mock_response

    ai = HuggingFaceAI()
    result = ai.generate_chat_response("Hi there!")

    assert "Hello" in result
    mock_post.assert_called_once()

def test_generate_chat_response_fallback():
    ai = HuggingFaceAI()
    msg = "Tell me about resume tips"
    result = ai._generate_fallback_response(msg)

    assert "resume" in msg.lower()
    assert "resume" in result.lower() or "improve your resume" in result.lower()

class MockJob:
    def __init__(self, title, description, requirements):
        self.title = title
        self.description = description
        self.requirements = requirements

@patch("api.utils.util.pytorch_cos_sim")
@patch("api.utils.SentenceTransformer")
def test_recommend_jobs(mock_sim, mock_model):
    mock_encoder = MagicMock()
    mock_encoder.encode.return_value = "embedding"
    mock_model.return_value = mock_encoder
    mock_sim.return_value.item.return_value = 0.9

    ai = HuggingFaceAI()
    jobs = [
        MockJob("Backend Developer", "Python Django APIs", ["REST", "SQL"]),
        MockJob("Frontend Developer", "React JavaScript", ["CSS"])
    ]

    result = ai.recommend_jobs("Python, Django", jobs)

    assert len(result) == 2
    assert isinstance(result[0], MockJob)

