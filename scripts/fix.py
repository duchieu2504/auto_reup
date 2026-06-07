import os

path = 'backend/app/tasks/uploader_tasks.py'
with open(path, 'rb') as f:
    raw = f.read()

# Decode ignoring errors
text = raw.decode('utf-8', 'ignore')

# We know the original file ended around line 107.
# Let's find the position of the celery task I added
idx = text.find('@celery.task(name=\'tasks.warmup_account\')')
if idx != -1:
    text = text[:idx]

text = text.rstrip() + '\n\n'

new_code = '''@celery.task(name="tasks.warmup_account")
def warmup_account_task(account_data: dict):
    from app.services.uploader.warmup_engine import WarmupEngineFactory
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Bắt đầu nuôi tài khoản: {account_data.get('username')}")
    try:
        engine = WarmupEngineFactory.get_engine(account_data)
        engine.warmup()
        logger.info(f"Hoàn tất nuôi tài khoản: {account_data.get('username')}")
    except Exception as e:
        logger.error(f"Lỗi khi nuôi tài khoản {account_data.get('username')}: {e}")
'''

with open(path, 'w', encoding='utf-8') as f:
    f.write(text + new_code)
print('Fixed encoding!')
