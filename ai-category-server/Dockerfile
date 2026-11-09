FROM python:3.10

# 작업 디렉토리
WORKDIR /app

# requirements 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 코드 복사
COPY . .

# Git에 바이너리 모델을 저장하지 않고, 이미지 빌드마다 재현 가능한 기본 모델 생성
RUN python -m train.bootstrap_model --output-dir models --verify

# FastAPI 실행 (uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
