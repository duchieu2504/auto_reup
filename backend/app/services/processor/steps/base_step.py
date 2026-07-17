from abc import ABC, abstractmethod

class ProcessorStep(ABC):
    @abstractmethod
    def execute(self, context: dict) -> bool:
        """
        Thực thi một bước trong pipeline.
        Trả về True nếu tiếp tục, False nếu có lỗi hoặc cần dừng.
        """
        pass
