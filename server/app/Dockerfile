FROM tailorhire-ai-base

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Create directories for static and media files
RUN mkdir -p /app/staticfiles /app/media/profiles /app/media/resumes

# Collect static files (this will run again in docker-compose)
RUN python manage.py collectstatic --noinput || true

CMD ["gunicorn", "app.wsgi:application", "--bind", "0.0.0.0:8000", "--timeout", "300", "--workers", "2"]
