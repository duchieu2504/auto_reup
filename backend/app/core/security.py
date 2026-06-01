import os
from cryptography.fernet import Fernet

# Lấy khóa mã hóa từ biến môi trường, nếu chưa có thì tự sinh một khóa mặc định (chỉ dùng cho dev)
# TRONG PRODUCTION, LUÔN LUÔN PHẢI SET BIẾN MÔI TRƯỜNG "ENCRYPTION_KEY" VÀ LƯU AN TOÀN
# Để sinh khóa: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
_key = os.environ.get("ENCRYPTION_KEY")
if not _key:
    # Cảnh báo: Đây là khóa tạm thời, nếu khởi động lại container mà không set ENV, dữ liệu cũ sẽ không giải mã được nếu dùng random.
    # Do đó, dùng một khóa tĩnh làm fallback để không bị lỗi giải mã khi quên set ENV.
    _key = b'Zq1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0tU='

fernet = Fernet(_key)

def encrypt_data(data: str) -> str:
    if not data:
        return data
    return fernet.encrypt(data.encode('utf-8')).decode('utf-8')

def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data:
        return encrypted_data
    try:
        return fernet.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
    except Exception as e:
        # Trong trường hợp đổi khóa hoặc data không phải dạng mã hóa, trả về nguyên gốc để tránh crash
        return encrypted_data
