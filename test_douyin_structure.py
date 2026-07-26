import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.services.crawler.douyin_api import DouyinAPIClient

def test():
    client = DouyinAPIClient()
    try:
        hot = client.get_hot_search_board()
        items = hot.get("items", [])
        if not items:
            print("No hot items")
            return
        # Get an aweme
        res = client.search_aweme('tiktok', count=1)
        videos = res.get('items', [])
        if not videos:
            print("No search videos")
            return
        
        author = videos[0].get('author', {})
        sec_uid = author.get('sec_uid')
        if not sec_uid:
            print("No sec_uid found")
            return
            
        print(f"Fetching posts for sec_uid: {sec_uid}")
        data = client.get_user_post(sec_uid, count=1)
        aweme_list = data.get("aweme_list", [])
        print("aweme_list length:", len(aweme_list))
        if aweme_list:
            aweme = aweme_list[0]
            stats = aweme.get("statistics", {})
            print("Statistics:", stats)
        else:
            print("No videos found. Data keys:", data.keys())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
