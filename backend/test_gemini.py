import google.generativeai as genai

genai.configure(api_key="AIzaSyAcLtUwYEWyqDgbV-NdA0lvzgu45Ga6T9M")

try:
    models = genai.list_models()
    for m in models:
        print(m.name)
except Exception as e:
    print(f"Lỗi: {e}")
