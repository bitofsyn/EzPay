from fastapi import FastAPI
from app.predict import predict_category
from app.schemas import PredictRequest, PredictResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    category = predict_category(request.text)
    return PredictResponse(category=category)