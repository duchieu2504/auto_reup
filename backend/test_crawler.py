import os
import sys

# Thêm đường dẫn project vào sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.services.crawler.douyin_scraper import DouyinScraper
from dotenv import load_dotenv

load_dotenv("e:/Tradingbot/auto_reup_tiktok/.env")

scraper = DouyinScraper(output_dir="e:/Tradingbot/auto_reup_tiktok/data/raw_videos")
url = "https://www.douyin.com/video/7598158190605802602"

print(f"Testing URL: {url}")
for log_line in scraper.scrape_profile_generator(url):
    print(log_line, end="")
