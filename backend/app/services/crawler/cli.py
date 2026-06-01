import argparse
import sys
import os

# Đảm bảo in tiếng Việt không lỗi trên Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

# Đảm bảo có thể import module từ thư mục hiện tại khi chạy script độc lập
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from app.services.crawler.douyin_scraper import DouyinScraper, DEFAULT_OUTPUT_DIR

def main():
    parser = argparse.ArgumentParser(description="Tool cào video Douyin/TikTok (Phase 1)")
    parser.add_argument("url", help="URL của Profile Douyin hoặc TikTok cần cào")
    parser.add_argument("--outdir", default=DEFAULT_OUTPUT_DIR, help="Thư mục lưu video tải về")
    
    args = parser.parse_args()
    
    scraper = DouyinScraper(output_dir=args.outdir)
    scraper.scrape_profile(args.url)

if __name__ == "__main__":
    main()
