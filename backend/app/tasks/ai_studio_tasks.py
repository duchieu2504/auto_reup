import time
import os
import shutil
from sqlalchemy.orm import Session
from app.core.celery_app import celery_app
from app.core.config import DATA_DIR
from app.db.session import SessionLocal
from app.ai_studio import crud, schemas, services

@celery_app.task(bind=True, name="generate_ai_media_task")
def generate_ai_media_task(self, generation_id: int, mode: str, prompt_text: str, image_path: str, photoroom_key: str = None, veo3_key: str = None, use_local_bg: bool = False):
    """
    Task Celery sinh ảnh hoặc video từ hệ thống AI Studio.
    Đã kết nối Google GenAI (Veo / Imagen 3).
    """
    db: Session = SessionLocal()
    try:
        db_gen = crud.get_generation(db, generation_id)
        if not db_gen:
            return "Generation not found"

        results_dir = os.path.join(DATA_DIR, "ai_results")
        os.makedirs(results_dir, exist_ok=True)
        timestamp = int(time.time())
        
        # We process based on mode
        if mode == "model":
            # Chế độ sinh Video qua Veo 3
            if not veo3_key:
                raise Exception("Thiếu API Key cho Veo3")
                
            video_bytes = services.generate_video_gemini(api_key=veo3_key, prompt=prompt_text, image_path=image_path)
            
            filename = f"result_{timestamp}.mp4"
            actual_output_file = os.path.join(results_dir, filename)
            db_output_file = f"data/ai_results/{filename}"
            
            with open(actual_output_file, 'wb') as f_out:
                f_out.write(video_bytes)
                
        elif mode == "product":
            # Chế độ sinh Ảnh qua Imagen 3
            if not veo3_key:
                raise Exception("Thiếu API Key cho Gemini (Veo3/Imagen3)")
                
            # Nếu bật local_bg, bóc tách nền trước, sau đó lưu tạm và pass sang Imagen 3
            if use_local_bg:
                temp_filename = f"temp_bg_removed_{timestamp}.png"
                temp_output = os.path.join(results_dir, temp_filename)
                success = services.remove_bg_local(image_path, temp_output)
                if not success:
                    raise Exception("Lỗi tách nền cục bộ")
                image_to_edit = temp_output
            else:
                # Dùng ảnh gốc
                image_to_edit = image_path
                
            img_bytes = services.generate_image_gemini(api_key=veo3_key, prompt=prompt_text, image_path=image_to_edit)
            
            filename = f"result_{timestamp}.png"
            actual_output_file = os.path.join(results_dir, filename)
            db_output_file = f"data/ai_results/{filename}"
            
            with open(actual_output_file, 'wb') as f_out:
                f_out.write(img_bytes)
                
        else:
            raise Exception("Chế độ (mode) không hợp lệ hoặc chưa được hỗ trợ.")

        # Cập nhật DB
        crud.update_generation(db, db_gen, schemas.AIGenerationUpdate(
            status="completed",
            output_media_path=db_output_file,
            task_id_external=f"gemini_api_{timestamp}"
        ))

        return f"Success: {db_output_file}"
    except Exception as e:
        db_gen = crud.get_generation(db, generation_id)
        if db_gen:
            crud.update_generation(db, db_gen, schemas.AIGenerationUpdate(
                status="failed",
                error_message=str(e)
            ))
        return f"Failed: {str(e)}"
    finally:
        db.close()
