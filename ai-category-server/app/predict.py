from app.model_loader import load_model_and_vectorizer
from app.logger import logger

# 앱 시작시 한번만 메모리에 로드
# 이제 model은 (Vectorizer + Classifier) 파이프라인이며, vectorizer는 None입니다.
pipeline_model, _ = load_model_and_vectorizer()

# 가장 확률이 높은 카테고리 예측
def predict_category(text: str) -> str:
    if not text or not text.strip():
        return "기타"
    try:
        # 파이프라인은 전처리(vectorize)와 예측을 한번에 수행
        prediction = pipeline_model.predict([text])[0]
        return prediction
    except Exception as e:
        logger.error(f"[예측 실패] {e}")
        return "기타"

# 예측된 카테고리와 확률 반환
def predict_with_confidence(text: str, threshold : float = 0.4) -> dict:
    if not text or not text.strip():
        logger.warning("입력 텍스트 없음 → 기타 처리")
        return {"category" : "기타", "confidence" : 0.0}

    try:
        # 파이프라인으로 확률 예측
        proba = pipeline_model.predict_proba([text])[0]
        
        # 파이프라인의 마지막 단계(classifier)에서 클래스 레이블을 가져옴
        classifier = pipeline_model.steps[-1][1]
        classes = classifier.classes_
        
        max_idx = proba.argmax()
        max_confidence = float(proba[max_idx])
        predicted_category = classes[max_idx]

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
            "confidence": float(proba[max_idx])
        }
    except Exception as e:
        logger.error(f"[예측 실패] {e}")
        return {"category" : "기타", "confidence" : 0.0}