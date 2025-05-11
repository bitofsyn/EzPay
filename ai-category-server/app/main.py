from fastapi import FastAPI
from app.predict import predict_category
from app.schemas import PredictRequest, PredictResponse

app = FastAPI()

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    category = predict_category(request.text)
    return PredictResponse(category=category)