from fastapi import APIRouter
from app.predict import predict_category, predict_with_confidence
from app.schemas import PredictRequest, PredictResponse, PredictProbResponse
from train.train_model import save_model, plot_confusion_matrix, train_model

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

# 모델 재학습하여 혼동 행렬 생성
@router.post("/train")
def train():
    model, vectorizer, y_true, y_pred, labels = train_model()
    save_model(model, vectorizer)
    plot_confusion_matrix(y_true, y_pred, labels)
    return {"message" : "모델 재학습 및 저장 완"}