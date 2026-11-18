import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
print("key set:", bool(os.environ.get("GEMINI_API_KEY")))

client = genai.Client(http_options={"api_version": "v1beta"})
resp = client.models.generate_content(
    model="gemini-3.8-flash",
    contents='Reply with JSON {"ok": true}',
    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1),
)
print(resp.text)