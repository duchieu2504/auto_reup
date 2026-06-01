import httpx

video_id = "7598158190605802602"
url = f"https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids={video_id}"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
}
resp = httpx.get(url, headers=headers)
print("v2 status:", resp.status_code)
print(resp.json())
