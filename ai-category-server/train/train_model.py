from train.data_loader import load_training_data
from train.data_validator import validate_data # 데이터 검증 함수 임포트
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from app.logger import logger
import os
import json
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
import mlflow
import mlflow.sklearn

# --- MLflow 설정 ---
MLFLOW_TRACKING_URI = "http://mlflow:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("ezpay_category_classifier")


def plot_confusion_matrix(y_true, y_pred, labels, save_path):
    # ... (이전과 동일)
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=labels, yticklabels=labels, cmap="Blues")
    plt.xlabel("예측값")
    plt.ylabel("실제값")
    plt.title("Confusion Matrix")
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    logger.info(f"혼동 행렬 저장 완료 → {save_path}")


def train_and_log_model():
    """전체 학습 및 로깅 로직 담당"""
    with mlflow.start_run() as run:
        run_id = run.info.run_id
        logger.info(f"[MLflow Run 시작] Run ID: {run_id}")

        # --- 1. 데이터 로딩 ---
        df = load_training_data()
        mlflow.log_param("total_data_count", len(df))

        # --- 2. 데이터 유효성 검증 ---
        logger.info("[데이터 유효성 검증 시작]")
        try:
            validate_data(df)
            logger.info("데이터 유효성 검증 통과")
        except ValueError as e:
            logger.error(f"데이터 유효성 검증 실패: {e}")
            mlflow.set_tag("run_status", "failed")
            mlflow.set_tag("failure_reason", "data_validation")
            
            # 오류 로그를 아티팩트로 저장
            error_file = "data_validation_errors.txt"
            with open(error_file, "w") as f:
                f.write(str(e))
            mlflow.log_artifact(error_file)
            
            # 예외를 다시 발생시켜 실행 중단
            raise

        # --- 3. 학습/테스트 데이터 분리 ---
        # ... (이전과 동일)
        test_size = 0.2
        random_state = 42
        mlflow.log_param("test_size", test_size)
        mlflow.log_param("random_state", random_state)

        X = df["text"]
        y = df["label"]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)

        # --- 4. 모델 파이프라인 생성 및 학습 ---
        # ... (이전과 동일)
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', LogisticRegression(max_iter=1000))
        ])
        mlflow.log_param("model_type", "LogisticRegression")
        mlflow.log_param("vectorizer_type", "TfidfVectorizer")
        
        pipeline.fit(X_train, y_train)

        # --- 5. 모델 평가 ---
        # ... (이전과 동일)
        logger.info("[모델 성능 평가 (테스트 데이터)]")
        y_pred = pipeline.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        mlflow.log_metric("accuracy", acc)
        logger.info(f"정확도: {acc:.4f}")
        
        report = classification_report(y_test, y_pred, zero_division=0, output_dict=True)
        mlflow.log_metric("f1_score_macro_avg", report['macro avg']['f1-score'])
        
        report_path = "classification_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=4)
        mlflow.log_artifact(report_path)

        labels = sorted(list(set(y_test) | set(y_pred)))
        cm_path = "confusion_matrix.png"
        plot_confusion_matrix(y_test, y_pred, labels, cm_path)
        mlflow.log_artifact(cm_path)

        # --- 6. 모델 로깅 및 등록 ---
        mlflow.sklearn.log_model(
            sk_model=pipeline,
            artifact_path="model",
            registered_model_name="category_classifier"
        )
        logger.info("모델을 MLflow에 로깅 및 등록 완료")
        mlflow.set_tag("run_status", "success")


# 실행 진입점
if __name__ == "__main__":
    try:
        logger.info(f"MLflow 서버 주소: {MLFLOW_TRACKING_URI}")
        train_and_log_model()
        logger.info("[학습 스크립트 완료]")
    except Exception as e:
        logger.error(f"학습 중 오류 발생 : {e}")
        raise e
