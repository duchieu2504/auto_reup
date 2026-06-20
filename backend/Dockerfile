FROM python:3.13-slim

# Thêm đường dẫn thư viện CUDA của các gói pip
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.13/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.13/site-packages/nvidia/cudnn/lib

# Cài đặt ffmpeg và các system dependencies bao gồm espeak-ng cho phonemizer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    libpq-dev \
    adb \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài đặt llama-cpp-python hỗ trợ CUDA 12.4 trước từ pre-built wheels
RUN pip install --no-cache-dir llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124

# Copy requirements và cài đặt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cài đặt Playwright browsers và dependencies
RUN playwright install --with-deps chromium

# Mặc định chạy FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
