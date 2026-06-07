from celery import shared_task
import os
import traceback
from typing import Dict, Any

@shared_task(name="render_faceless_video", bind=True)
def render_faceless_video(self, task_data: Dict[str, Any]):
    """
    Task render video cho AI Faceless
    """
    try:
        from app.services.processor.faceless_engine import FacelessEngine
        
        # Cập nhật state
        self.update_state(state='PROGRESS', meta={'progress': 5, 'message': 'Bắt đầu quá trình Faceless...'})
        
        engine = FacelessEngine()
        result = engine.render_video(self, task_data)
        
        self.update_state(state='SUCCESS', meta={'progress': 100, 'message': 'Render hoàn tất!'})
        return {"status": "success", "data": result}
        
    except Exception as e:
        error_msg = f"Lỗi render faceless video: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        self.update_state(state='FAILURE', meta={'progress': 0, 'message': str(e)})
        raise e
