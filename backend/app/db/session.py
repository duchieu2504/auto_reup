import os
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import DATA_DIR

# Ưu tiên lấy từ biến môi trường (Docker)
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    f"sqlite:///{os.path.join(DATA_DIR, 'history.db').replace(chr(92), '/')}"
)

# SQLite cần connect_args, Postgres thì không
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# Dependency for FastAPI (used with Depends)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Context manager for Celery tasks — guarantees session cleanup
@contextmanager
def get_db_session():
    """Thread-safe DB session context manager for background tasks.
    Automatically rolls back on exception and always closes the session."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
