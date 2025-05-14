from model_loader import load_model_and_vectorizer
from logger import logger

# 앱 시작시 한번만 메모리에 로드
model, vectorizer = load_model_and_vectorizer()

# 가장 확률이 높은 카테고리 예측
def predict_category(text: str) -> str:

    if not text or not text.strip():
        return "기타"

    try:
        vector = vectorizer.transform([text])
        prediction = model.predict(vector)[0]
        return prediction
    except Exception as e:
        print(f"[예측 실패] {e}")
        return "기타"

# 예측된 카테고리와 확률 반환
def predict_with_confidence(text: str, threshold : float = 0.4) -> dict:

    if not text or not text.strip():
        logger.warning("입력 텍스트 없음 → 기타 처리")
        return {"category" : "기타", "confidence" : 0.0}

    try:
        vector = vectorizer.transform([text])
        proba = model.predict_proba(vector)[0]
        max_idx = proba.argmax()
        max_confidence = float(proba[max_idx])
        predicted_category = model.classes_[max_idx]

        logger.info(f"[예측 성공] `{text}` → {predicted_category} ({max_confidence:.2f})")

        # 임계값 이하일 경우 '기타' 처리
        if max_confidence < threshold:
            logger.info(f"confidence 낮음 → 기타 처리 : {max_confidence:.2f}")
            return {
                "category" : "기타",
                "confidence" : max_confidence
            }

        return {
            "category": predicted_category,
            "confidence": float(proba[max_idx])  # JSON 직렬화 위해 float 변환
        }
    except Exception as e:
        logger.error(f"[예측 실패] {e}")
        return {"category" : "기타", "confidence" : 0.0}
