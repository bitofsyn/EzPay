from fastapi import APIRouter
from app.predict import predict_category, predict_with_confidence
from app.schemas import PredictRequest, PredictResponse, PredictProbResponse

router = APIRouter()

# 예측된 카테고리만 반환
@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    category = predict_category(request.text)
    return PredictResponse(category=category)

# 카테고리 + 확률 반환
@router.post("/predict-prob", response_model=PredictProbResponse)
def predict_with_prob(request: PredictRequest):
    result = predict_with_confidence(request.text)
    return PredictProbResponse(**result)