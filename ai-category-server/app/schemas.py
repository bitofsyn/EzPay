from pydantic import BaseModel

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    category: str

# 확률 포함 예측 응답
class PredictProbResponse(BaseModel):
    category: str
    confidence: float
