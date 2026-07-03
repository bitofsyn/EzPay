"""
MSA 이벤트 드리븐 파이프라인.

transaction.categorization.requested 를 비동기 컨슘 → AI 분류 →
transaction.categorization.completed 로 논블로킹 프로듀스.

예외 처리:
  - Provider 재시도/폴백은 InferenceRouter 가 담당(여기서 재시도를 중복하지 않음).
  - 모든 Provider 실패 또는 파싱 불가한 요청(poison) → DLQ(.DLT) 로 라우팅.
  - Kafka 전송/커밋 실패 등 일시 장애는 레코드 단위로 격리하여 루프를 죽이지 않고,
    해당 오프셋으로 되감아(seek) 백오프 후 재처리(다운스트림 복구 대기).
  - 수동 커밋(enable_auto_commit=False): 처리(성공/DLQ) 완료 후에만 offset 커밋 → 유실 방지.
"""
from __future__ import annotations

import asyncio
import json
from typing import Optional

from aiokafka import AIOKafkaConsumer, TopicPartition
from aiokafka.structs import ConsumerRecord

from app.config import Settings, get_settings
from app.kafka.producer import ResultProducer
from app.llm.schemas import CategorizationRequest
from app.llm.service import get_categorization_service
from app.logger import logger


class CategorizationPipeline:
    def __init__(self, settings: Optional[Settings] = None):
        self._settings = settings or get_settings()
        self._service = get_categorization_service()  # HTTP 라우터와 커넥션 풀 공유
        self._producer = ResultProducer(self._settings)
        self._consumer: Optional[AIOKafkaConsumer] = None
        self._task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self) -> None:
        if not self._settings.kafka_enabled:
            logger.info("[categorization] KAFKA_ENABLED=false → 파이프라인 비활성화")
            return

        await self._producer.start()
        self._consumer = AIOKafkaConsumer(
            self._settings.kafka_request_topic,
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            group_id=self._settings.kafka_group_id,
            enable_auto_commit=False,           # 수동 커밋
            auto_offset_reset="earliest",
            value_deserializer=lambda v: v,     # 원본 bytes 유지(DLQ 보존용)
            key_deserializer=lambda k: k.decode("utf-8") if k else None,
        )
        await self._consumer.start()
        self._running = True
        self._task = asyncio.create_task(self._consume_loop())
        logger.info(
            "[categorization] 파이프라인 시작 topic=%s group=%s",
            self._settings.kafka_request_topic, self._settings.kafka_group_id,
        )

    async def stop(self) -> None:
        self._running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._consumer is not None:
            await self._consumer.stop()
        await self._producer.stop()
        logger.info("[categorization] 파이프라인 정지")

    async def _consume_loop(self) -> None:
        assert self._consumer is not None
        try:
            async for record in self._consumer:
                # 레코드 단위로 장애를 격리한다. 어떤 예외도 루프를 종료시키지 않는다.
                try:
                    handled = await self._handle_record(record)
                except asyncio.CancelledError:
                    raise
                except Exception:  # noqa: BLE001 - 예기치 못한 버그도 루프를 죽이지 않음
                    logger.exception(
                        "[categorization] 레코드 처리 중 예외 offset=%s", record.offset
                    )
                    handled = False

                if handled:
                    await self._commit_safely()
                else:
                    # 전송/커밋 등 일시 장애 → 같은 오프셋으로 되감아 백오프 후 재처리
                    await self._retry_record_later(record)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("[categorization] consume 루프 비정상 종료")

    async def _handle_record(self, record: ConsumerRecord) -> bool:
        """
        레코드 1건을 처리한다.

        반환값:
          True  = 처리 완료(완료 발행 또는 DLQ 라우팅) → 커밋 대상
          False = Kafka 전송 등 일시 장애 → 커밋하지 말고 재처리
        """
        raw_value: bytes = record.value
        key = record.key

        # 1) 역직렬화 실패(poison) → 재시도 무의미, DLQ
        try:
            request = self._deserialize(raw_value)
        except Exception as exc:  # noqa: BLE001
            return await self._to_dlt(key, raw_value, f"invalid payload: {exc}")

        # 2) 분류. Router 가 재시도/폴백을 모두 수행하므로 여기서 중복 재시도하지 않는다.
        #    최종 실패(AllProvidersFailedError 포함)는 poison 으로 간주해 DLQ.
        try:
            result = await self._service.categorize(request)
        except Exception as exc:  # noqa: BLE001
            return await self._to_dlt(
                key, raw_value, f"{type(exc).__name__}: {exc}"
            )

        # 3) 완료 발행. 전송 실패는 일시 장애로 보고 재처리(False).
        try:
            await self._producer.publish_completed(result)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "[categorization] 완료 발행 실패(재처리 예정) request_id=%s: %s",
                request.request_id, exc,
            )
            return False

    async def _to_dlt(self, key, raw_value: bytes, error_message: str) -> bool:
        """DLQ 발행. 성공 시 True(커밋), 발행 자체가 실패하면 False(재처리)."""
        try:
            await self._producer.publish_dlt(key, raw_value, error_message)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error("[categorization] DLT 발행 실패(재처리 예정): %s", exc)
            return False

    async def _commit_safely(self) -> None:
        """offset 커밋. 실패해도 루프를 죽이지 않는다(레코드는 이미 처리됨)."""
        try:
            await self._consumer.commit()
        except asyncio.CancelledError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.error("[categorization] offset 커밋 실패: %s", exc)

    async def _retry_record_later(self, record: ConsumerRecord) -> None:
        """
        일시 장애 레코드를 같은 오프셋으로 되감아(seek) 백오프 후 재처리한다.
        다운스트림(Kafka)이 복구될 때까지 해당 파티션을 사실상 일시정지시키는 효과.
        """
        tp = TopicPartition(record.topic, record.partition)
        try:
            self._consumer.seek(tp, record.offset)
        except Exception as exc:  # noqa: BLE001 - seek 실패 시 다음 폴에서 자연 재시도
            logger.error("[categorization] seek 실패 offset=%s: %s", record.offset, exc)
        await asyncio.sleep(self._settings.retry_backoff_ms / 1000.0)

    @staticmethod
    def _deserialize(raw_value: bytes) -> CategorizationRequest:
        data = json.loads(raw_value.decode("utf-8"))
        return CategorizationRequest.model_validate(data)
