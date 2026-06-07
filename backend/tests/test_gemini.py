import os
import sys
from google import genai
from dotenv import load_dotenv

load_dotenv('/app/data/.env')
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key present: {bool(api_key)}")

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-3.5-flash',
        contents='hello'
    )
    print("3.5-flash Success!")
except Exception as e:
    print("3.5-flash Error:", e)

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='hello'
    )
    print("2.5-flash Success!")
except Exception as e:
    print("2.5-flash Error:", e)
    
try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='hello'
    )
    print("2.0-flash Success!")
except Exception as e:
    print("2.0-flash Error:", e)
