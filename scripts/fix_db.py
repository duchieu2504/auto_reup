import sqlite3
import os

db_path = 'e:/Tradingbot/auto_reup_tiktok/data/app.db'
if not os.path.exists(db_path):
    print("Database not found!")
    exit(1)

db = sqlite3.connect(db_path)
cursor = db.cursor()

columns = ['raw_video_path', 'srt_origin_path', 'srt_translated_path', 'audio_tts_path', 'final_video_path']
changes = 0

for col in columns:
    # Handle Windows paths (data\data\)
    cursor.execute(f"UPDATE video_history SET {col} = REPLACE({col}, 'data\\\\data\\\\', 'data\\\\') WHERE {col} LIKE '%data\\\\data\\\\%'")
    changes += cursor.rowcount
    
    # Handle Unix/URL paths (data/data/)
    cursor.execute(f"UPDATE video_history SET {col} = REPLACE({col}, 'data/data/', 'data/') WHERE {col} LIKE '%data/data/%'")
    changes += cursor.rowcount

db.commit()
print(f'Fixed {changes} paths in database.')
db.close()
