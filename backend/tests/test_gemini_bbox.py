import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

ENV_PATH = "/app/../data/.env"
load_dotenv(ENV_PATH, override=True)

from app.core.security import decrypt_data
api_key = decrypt_data(os.getenv("GEMINI_API_KEY", ""))

if not api_key:
    print("API Key not found!")
    exit()

client = genai.Client(api_key=api_key)

img_path = "/app/data/templates/tiktok snap 88.jpg"

if not os.path.exists(img_path):
    print("Image not found:", img_path)
    exit()

sample_file = client.files.upload(file=img_path)

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        sample_file,
        "Return the 2D bounding box for the gallery / upload button at the bottom of the screen. Return ONLY a JSON array like [ymin, xmin, ymax, xmax] in normalized coordinates (0.0 to 1.0). Do not include any other text or markdown formatting."
    ]
)
print("BBOX:", response.text)
