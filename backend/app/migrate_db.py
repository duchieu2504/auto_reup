import sqlite3
import os

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/db_data/auto_reup.db"))
conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = c.fetchall()
print("auto_reup.db tables:", tables)

if ('social_accounts',) in tables:
    try:
        c.execute("ALTER TABLE social_accounts ADD COLUMN health_checked_at DATETIME")
        print("Migrated social_accounts")
    except Exception as e:
        print("Error on social_accounts:", e)

if ('upload_schedules',) in tables:
    try:
        c.execute("ALTER TABLE upload_schedules ADD COLUMN views_count INTEGER")
        c.execute("ALTER TABLE upload_schedules ADD COLUMN health_status VARCHAR(50) DEFAULT 'unknown'")
        print("Migrated upload_schedules")
    except Exception as e:
        print("Error on upload_schedules:", e)

conn.commit()
conn.close()
