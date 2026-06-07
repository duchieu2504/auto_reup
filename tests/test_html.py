import httpx
import re
import urllib.parse
import json
import sys

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'}
# Lấy cookie hiện tại
sys.path.append('/app')
from app.services.crawler.douyin_api import DouyinAPIClient
client = DouyinAPIClient()

resp = httpx.get('https://www.douyin.com/video/7635501743501069595', headers=headers, cookies=client.cookies, follow_redirects=True)
print("Status HTML:", resp.status_code)
match1 = re.search(r'<script id="RENDER_DATA" type="application/json">(.*?)</script>', resp.text)
match2 = re.search(r'<script id="douyin_web_data" type="application/json">(.*?)</script>', resp.text)
match3 = re.search(r'<script id="SSR_HYDRATED_DATA" type="application/json">(.*?)</script>', resp.text)

print("RENDER_DATA:", bool(match1))
print("douyin_web_data:", bool(match2))
print("SSR_HYDRATED_DATA:", bool(match3))
