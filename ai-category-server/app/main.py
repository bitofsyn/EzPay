from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from app.api import router  # 분리된 라우터 가져오기
from fastapi.middleware.cors import CORSMiddleware
from app.logger import logger
from app.kafka.pipeline import CategorizationPipeline
from app.llm.service import get_categorization_service

import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 기동 시 이벤트 드리븐 분류 파이프라인 시작(KAFKA_ENABLED=false 면 no-op)
    pipeline = CategorizationPipeline()
    app.state.categorization_pipeline = pipeline
    try:
        await pipeline.start()
    except Exception:  # noqa: BLE001 - Kafka 미가용 시에도 HTTP 서버는 계속 기동
        logger.exception("[categorization] 파이프라인 시작 실패(HTTP 서버는 계속 기동)")
    yield
    await pipeline.stop()
    # LLM 커넥션 풀 정리
    await get_categorization_service().aclose()


app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    logger.info(f"{request.method} {request.url.path} - {duration: .3f}s")
    return response

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router)
