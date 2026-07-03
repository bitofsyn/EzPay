"""완료 결과 및 DLQ 메시지를 발행하는 얇은 프로듀서 래퍼."""
from __future__ import annotations

import json
from typing import Optional

from aiokafka import AIOKafkaProducer

from app.config import Settings
from app.llm.schemas import CategorizationResult
from app.logger import logger


class ResultProducer:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._producer: Optional[AIOKafkaProducer] = None

    async def start(self) -> None:
        self._producer = AIOKafkaProducer(
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v, ensure_ascii=False, default=str).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            enable_idempotence=True,
        )
        await self._producer.start()
        logger.info("[categorization] ResultProducer 시작")

    async def stop(self) -> None:
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None

    async def publish_completed(self, result: CategorizationResult) -> None:
        assert self._producer is not None, "producer not started"
        await self._producer.send_and_wait(
            self._settings.kafka_completed_topic,
            key=result.request_id,
            value=result.model_dump(by_alias=True),
        )
        logger.info(
            "[categorization] 결과 발행 완료 request_id=%s category=%s provider=%s",
            result.request_id, result.category_code, result.provider,
        )

    async def publish_dlt(self, key: Optional[str], raw_value: bytes, error_message: str) -> None:
        """재시도 소진된 실패 메시지를 원본 페이로드 + 에러 헤더와 함께 DLT 로 보낸다."""
        assert self._producer is not None, "producer not started"
        payload = {
            "originalPayload": _safe_text(raw_value),
            "errorMessage": error_message,
        }
        await self._producer.send_and_wait(
            self._settings.kafka_dlt_topic,
            key=key,
            value=payload,
            headers=[("dlt-exception-message", error_message.encode("utf-8")[:512])],
        )
        logger.error("[categorization] DLT 발행: key=%s error=%s", key, error_message)


def _safe_text(raw: bytes) -> str:
    try:
        return raw.decode("utf-8")
    except Exception:  # noqa: BLE001
        return repr(raw)
