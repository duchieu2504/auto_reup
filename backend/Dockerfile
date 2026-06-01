FROM python:3.13-slim

# Cài đặt ffmpeg và các system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    libpq-dev \
    adb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cài đặt Playwright browsers và dependencies
RUN playwright install --with-deps chromium

# Mặc định chạy FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
