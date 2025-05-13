from .model_loader import load_model_and_vectorizer

# 앱 시작 시 모델과 벡터 불러오기 (성능 위해 1번만 로드)
model, vectorizer = load_model_and_vectorizer()

def predict_category(text: str) -> str:
    vector = vectorizer.transform([text]) # 입력 텍스트 벡터화
    prediction = model.predict(vector)[0] # 예측 수행
    return prediction
