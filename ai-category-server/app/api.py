from fastapi import APIRouter, HTTPException
from app.model_loader import get_model_status
from app.predict import predict_category, predict_with_confidence
from app.schemas import PredictRequest, PredictResponse, PredictProbResponse
from app.llm.exceptions import InferenceError
from app.llm.schemas import CategorizationRequest, CategorizationResult
from app.llm.service import get_categorization_service

router = APIRouter()


@router.get("/health")
def health():
    return get_model_status()


# 계층형 추론(ML 1차 → LLM 에스컬레이션). Kafka 파이프라인과 동일 서비스 인스턴스를 공유.
@router.post("/categorize", response_model=CategorizationResult)
async def categorize(request: CategorizationRequest):
    try:
        return await get_categorization_service().categorize(request)
    except InferenceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

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
