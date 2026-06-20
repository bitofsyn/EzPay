from app.model_loader import load_model_and_vectorizer
from app.logger import logger

pipeline_model, vectorizer = load_model_and_vectorizer()


def _ensure_model_loaded():
    global pipeline_model, vectorizer
    if pipeline_model is None:
        pipeline_model, vectorizer = load_model_and_vectorizer(force_reload=True)
    return pipeline_model, vectorizer


def _predict_labels(text: str):
    model, local_vectorizer = _ensure_model_loaded()
    if model is None:
        raise RuntimeError("모델이 로드되지 않았습니다.")

    if hasattr(model, "predict") and local_vectorizer is None:
        return model.predict([text])[0]

    features = local_vectorizer.transform([text])
    return model.predict(features)[0]


def _predict_probabilities(text: str):
    model, local_vectorizer = _ensure_model_loaded()
    if model is None:
        raise RuntimeError("모델이 로드되지 않았습니다.")

    if hasattr(model, "predict_proba") and local_vectorizer is None:
        proba = model.predict_proba([text])[0]
        classes = list(model.predict([text]).__class__.__mro__)
        return proba, None

    features = local_vectorizer.transform([text])
    proba = model.predict_proba(features)[0]
    classes = model.classes_
    return proba, classes

# 가장 확률이 높은 카테고리 예측
def predict_category(text: str) -> str:
    if not text or not text.strip():
        return "기타"
    try:
        prediction = _predict_labels(text)
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
        model, local_vectorizer = _ensure_model_loaded()
        if model is None:
            raise RuntimeError("모델이 로드되지 않았습니다.")

        if local_vectorizer is None:
            proba = model.predict_proba([text])[0]
            if hasattr(model, "_model_impl") and hasattr(model._model_impl, "python_model"):
                underlying = getattr(model._model_impl.python_model, "model", None)
                classes = getattr(underlying, "classes_", None)
            else:
                classes = None
        else:
            features = local_vectorizer.transform([text])
            proba = model.predict_proba(features)[0]
            classes = model.classes_

        if classes is None:
            predicted_category = predict_category(text)
            max_confidence = float(max(proba))
            return {"category": predicted_category, "confidence": max_confidence}
        
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
