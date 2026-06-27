FROM python:3.10-slim

# Thêm đường dẫn thư viện CUDA của các gói pip
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.10/site-packages/nvidia/cublas/lib:/usr/local/lib/python3.10/site-packages/nvidia/cudnn/lib

# Cài đặt ffmpeg và các system dependencies bao gồm espeak-ng cho phonemizer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    libpq-dev \
    adb \
    espeak-ng \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Nâng cấp pip để tránh lỗi "invalid wheel" khi giải nén file siêu lớn (>1.8GB)
RUN pip install --upgrade pip setuptools wheel

# Cài đặt PyTorch và Llama-cpp-python trước (các thư viện quá nặng) để tối ưu Layer Cache
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=1000 --retries 10 \
    torch==2.4.1+cu124 torchaudio==2.4.1+cu124 torchvision==0.19.1+cu124 \
    --extra-index-url https://download.pytorch.org/whl/cu124

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=1000 --retries 10 llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124

# Copy requirements và cài đặt
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=1000 -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cu124

# Cài đặt Playwright browsers và dependencies
RUN playwright install --with-deps chromium

# Mặc định chạy FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
