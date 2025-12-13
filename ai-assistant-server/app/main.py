from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import api

app = FastAPI()

# CORS 미들웨어 설정
# 개발 중에는 모든 출처를 허용하지만, 프로덕션에서는 특정 도메인만 허용하도록 변경해야 합니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용: 모든 출처 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api.router, prefix="/api", tags=["assistant"])

@app.get("/")
def read_root():
    return {"message": "AI Assistant Server is running"}

