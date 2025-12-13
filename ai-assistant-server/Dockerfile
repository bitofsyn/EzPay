FROM python:3.10

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 나머지 프로젝트 코드 복사
COPY . .

# Uvicorn 서버 실행 (포트 8001)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
