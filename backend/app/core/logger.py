import logging
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
LOG_FILE = os.path.join(PROJECT_ROOT, "bot.log")

# Tạo formatter chuẩn
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# Ghi ra file
file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
file_handler.setFormatter(formatter)

# Ghi ra màn hình console (để uvicorn cũng thấy)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)

def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Ngăn việc add handler nhiều lần nếu gọi hàm này nhiều lần
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(stream_handler)
        # Tắt propagate để không bị duplicate log với root logger của uvicorn
        logger.propagate = False
        
    return logger
