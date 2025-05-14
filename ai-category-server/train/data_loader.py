from sqlalchemy import create_engine
import pandas as pd
import os
from dotenv import load_dotenv

# .env 로드
env_path = os.path.join("config", ".env")

if not os.path.exists(env_path):
    raise FileNotFoundError(f"{env_path} 파일이 존재하지 않습니다. 환경설정이 필요합니다.")

load_dotenv(dotenv_path=os.path.join("config", ".env"))


def load_training_data():
    # SQLAlchemy 연결 문자열 구성
    db_url = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"

    # 엔진 생성
    # 엔진 생성
    engine = create_engine(db_url)

    # 데이터 로드
    df = pd.read_sql("SELECT memo, receiver_name, category FROM training_data", con=engine)

    # 전처리 : 결측제거 + memo와 수신자명 텍스트로 결합
    df = df.dropna(subset=["memo", "receiver_name", "category"])
    df["text"] = df["memo"].astype(str) + " " + df["receiver_name"].astype(str)
    df = df[["text", "category"]].rename(columns={"category": "label"})
    return df
