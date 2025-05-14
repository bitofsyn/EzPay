from .model_loader import load_model_and_vectorizer

# 앱 시작시 한번만 메모리에 로드
model, vectorizer = load_model_and_vectorizer()

# 가장 확률이 높은 카테고리 예측
def predict_category(text: str) -> str:
    vector = vectorizer.transform([text])
    prediction = model.predict(vector)[0]
    return prediction

# 예측된 카테고리와 확률 반환
def predict_with_confidence(text: str, threshold : float = 0.4) -> dict:
    vector = vectorizer.transform([text])
    proba = model.predict_proba(vector)[0]
    max_idx = proba.argmax()
    max_confidence = float(proba[max_idx])
    predicted_category = model.classes_[max_idx]

    # 임계값 이하일 경우 '기타' 처리
    if max_confidence < threshold:
        return {
            "category" : "기타",
            "confidence" : max_confidence
        }

    return {
        "category": model.classes_[max_idx],
        "confidence": float(proba[max_idx])  # JSON 직렬화 위해 float 변환
    }
