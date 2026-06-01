import asyncio
import os
from dotenv import load_dotenv
from app.services.crawler.douyin_api import DouyinAPIClient

async def test():
    load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))
    static_cookie = os.getenv("DOUYIN_COOKIE", "")
    print("Static Cookie len:", len(static_cookie))
    
    client = DouyinAPIClient()
    if static_cookie:
        client.raw_cookie = static_cookie
        client.cookies = {}
        for part in static_cookie.split(";"):
            part = part.strip()
            if "=" in part:
                k, v = part.split("=", 1)
                client.cookies[k] = v
                
    # Test profile API
    print("Testing profile API...")
    sec_uid = "MS4wLjABAAAAgbac9ihpTlet1afYz7ingYX92zHVMzSGZeHQtWVaLSE"
    data = client.get_user_post(sec_uid)
    if data and data.get("aweme_list"):
        print("Profile API Success! Found videos:", len(data["aweme_list"]))
    else:
        print("Profile API Failed. Response:", data)

if __name__ == "__main__":
    asyncio.run(test())
