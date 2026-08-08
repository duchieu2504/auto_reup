from sqlalchemy.orm import Session
from app.ai_studio.models import AIGeneration
from app.ai_studio.schemas import AIGenerationCreate, AIGenerationUpdate

def create_generation(db: Session, gen_in: AIGenerationCreate) -> AIGeneration:
    db_obj = AIGeneration(**gen_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_generation(db: Session, gen_id: int) -> AIGeneration:
    return db.query(AIGeneration).filter(AIGeneration.id == gen_id).first()

def get_generations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AIGeneration).order_by(AIGeneration.id.desc()).offset(skip).limit(limit).all()

def update_generation(db: Session, db_obj: AIGeneration, update_in: AIGenerationUpdate) -> AIGeneration:
    update_data = update_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_generation(db: Session, gen_id: int) -> bool:
    db_obj = get_generation(db, gen_id)
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
