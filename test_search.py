import sys, urllib.parse, httpx, re, json
sys.path.append('/app')
from app.services.crawler.douyin_api import DouyinAPIClient
client = DouyinAPIClient()
url = 'https://www.douyin.com/search/' + urllib.parse.quote('AI')
resp = httpx.get(url, headers=client.headers, cookies=client.cookies, follow_redirects=True)
match1 = re.search(r'<script id="RENDER_DATA" type="application/json">(.*?)</script>', resp.text)
match2 = re.search(r'<script id="douyin_web_data" type="application/json">(.*?)</script>', resp.text)
print('RENDER_DATA:', bool(match1))
print('douyin_web_data:', bool(match2))
if match1:
    try:
        data = json.loads(urllib.parse.unquote(match1.group(1)))
        print('Data keys (RENDER_DATA):', list(data.keys())[:5])
    except Exception as e:
        print(e)
if match2:
    try:
        data = json.loads(urllib.parse.unquote(match2.group(1)))
        print('Data keys (douyin_web_data):', list(data.keys())[:5])
    except Exception as e:
        print(e)
