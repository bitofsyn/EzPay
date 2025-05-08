import joblib
import os

def load_model_and_vectorizer():
    model_path = os.path.join("models", "model.pkl")
    vectorizer_path = os.path.join("models", "vectorizer.pkl")

    try:
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        print("모델과 벡터 불러오기 성공")
        return model, vectorizer
    except Exception as e:
        print("모델 또는 벡터 불러오기 실패:", e)
        raise
