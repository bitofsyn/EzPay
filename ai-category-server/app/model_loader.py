from pathlib import Path
import joblib
import mlflow.pyfunc

from app.logger import logger

MLFLOW_TRACKING_URI = "http://mlflow:5000"
MLFLOW_MODEL_URI = "models:/category_classifier/Staging"
LOCAL_MODEL_PATH = Path("/app/models/model.pkl")
LOCAL_VECTORIZER_PATH = Path("/app/models/vectorizer.pkl")

mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

_cached_model = None
_cached_vectorizer = None
_model_source = "uninitialized"
_load_error = None


def _load_from_mlflow():
    logger.info(f"MLflow 모델 레지스트리에서 모델 로딩 시작: {MLFLOW_MODEL_URI}")
    model = mlflow.pyfunc.load_model(MLFLOW_MODEL_URI)
    logger.info("[MLflow 모델 로딩 성공]")
    return model, None, "mlflow"


def _load_from_local_files():
    if not LOCAL_MODEL_PATH.exists() or not LOCAL_VECTORIZER_PATH.exists():
        raise FileNotFoundError("로컬 모델 파일이 없습니다.")

    logger.info("로컬 모델 파일에서 모델 로딩 시작")
    model = joblib.load(LOCAL_MODEL_PATH)
    vectorizer = joblib.load(LOCAL_VECTORIZER_PATH)
    logger.info("[로컬 모델 로딩 성공]")
    return model, vectorizer, "local"


def load_model_and_vectorizer(force_reload: bool = False):
    global _cached_model, _cached_vectorizer, _model_source, _load_error

    if _cached_model is not None and not force_reload:
        return _cached_model, _cached_vectorizer

    loaders = (_load_from_mlflow, _load_from_local_files)
    last_error = None

    for loader in loaders:
        try:
            model, vectorizer, source = loader()
            _cached_model = model
            _cached_vectorizer = vectorizer
            _model_source = source
            _load_error = None
            return _cached_model, _cached_vectorizer
        except Exception as exc:
            last_error = exc
            logger.error(f"[모델 로딩 실패] source={loader.__name__}: {exc}")

    _cached_model = None
    _cached_vectorizer = None
    _model_source = "unavailable"
    _load_error = str(last_error) if last_error else "unknown"
    logger.error("MLflow와 로컬 모델 파일 모두 로딩하지 못했습니다.")
    return None, None


def get_model_status():
    if _cached_model is None and _model_source == "uninitialized":
        load_model_and_vectorizer()

    return {
        "ready": _cached_model is not None,
        "source": _model_source,
        "error": _load_error,
    }
