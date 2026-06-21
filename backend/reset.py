import sqlite3
import os

db_path = os.path.join('../data', 'history.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("UPDATE social_accounts SET status='active' WHERE status='warming_up'")
conn.commit()
print(f'Da reset {cursor.rowcount} tai khoan ve active')
conn.close()
