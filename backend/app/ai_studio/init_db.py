from app.db.session import engine, Base
from app.ai_studio.models import AIGeneration

def init_db():
    print("Creating AI Studio tables...")
    Base.metadata.create_all(bind=engine)
    print("AI Studio tables created successfully.")

if __name__ == "__main__":
    init_db()
