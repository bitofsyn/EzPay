import mlflow.pyfunc
from app.logger import logger
import os

# MLflow 서버 주소 설정
MLFLOW_TRACKING_URI = "http://mlflow:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def load_model_and_vectorizer():
    # 모델 레지스트리에서 'Staging' 단계에 있는 'category_classifier' 모델을 로드
    # 이 모델은 Vectorizer와 Classifier가 포함된 파이프라인임
    model_name = "category_classifier"
    stage = "Staging"
    model_uri = f"models:/{model_name}/{stage}"
    
    try:
        logger.info(f"MLflow 모델 레지스트리에서 모델 로딩 시작: {model_uri}")
        # pyfunc.load_model은 전체 파이프라인을 로드하므로, vectorizer를 별도로 로드할 필요 없음
        model = mlflow.pyfunc.load_model(model_uri)
        logger.info(f"[MLflow 모델 로딩 성공] 모델: {model_name}, 단계: {stage}")
        
        # 이전 코드와의 호환성을 위해 모델(파이프라인)과 None을 반환
        # predict.py에서 이 변경에 맞춰 수정이 필요함
        return model, None 
        
    except Exception as e:
        logger.error(f"[MLflow 모델 로딩 실패] : {e}")
        logger.error("MLflow 서버가 실행 중인지, 모델이 레지스트리('Staging' 단계)에 등록되었는지 확인하세요.")
        # 모델 로딩 실패 시, 서버가 시작되지 않도록 예외 발생
        raise