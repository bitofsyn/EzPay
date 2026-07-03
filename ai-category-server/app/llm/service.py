"""
분류 오케스트레이션(계층형 추론).

  1) ML 1차: 기존 scikit-learn 분류기(빠름/무비용)로 먼저 시도.
  2) 확신이 임계값(ml_confidence_threshold) 이상이면 그대로 확정 → LLM 미호출.
  3) 확신이 낮거나 '기타'로 떨어지면 LLM 라우터(로컬↔클라우드 폴백)로 에스컬레이션.

프롬프트 → (Router 추론) → 파싱 → 결과 DTO 로 이어진다.
"""
from __future__ import annotations

import asyncio
from functools import lru_cache
from typing import Optional

from app.config import Settings, get_settings
from app.llm import parser, prompt
from app.llm.categories import FALLBACK_CODE
from app.llm.router import InferenceRouter
from app.llm.schemas import CategorizationRequest, CategorizationResult
from app.logger import logger
from app.predict import predict_with_confidence


class CategorizationService:
    def __init__(self, settings: Settings | None = None, router: InferenceRouter | None = None):
        self._settings = settings or get_settings()
        self._router = router or InferenceRouter(self._settings)

    async def categorize(self, request: CategorizationRequest) -> CategorizationResult:
        """
        요청을 분류하고 결과를 반환한다.

        LLM 이 최종 실패하면 AllProvidersFailedError 를 그대로 전파하여 상위(파이프라인/DLQ)가
        처리하도록 한다(메시지 유실 방지). '낮은 신뢰도'는 정상 결과로 간주하고 status 로만 표시.
        """
        logger.info(
            "[categorization] 처리 시작 request_id=%s tx_id=%s",
            request.request_id, request.transaction_id,
        )

        # 1차: 기존 ML 분류기로 저비용 시도
        ml_result = await self._try_ml(request)
        if ml_result is not None:
            return ml_result

        # 2차: LLM 에스컬레이션(로컬 1차 → 클라우드 폴백)
        outcome = await self._router.classify(prompt.system_prompt(), prompt.user_prompt(request))
        prediction = parser.parse(outcome.raw_content)

        status = self._resolve_status(prediction.confidence, outcome.used_fallback)
        return CategorizationResult(
            request_id=request.request_id,
            transaction_id=request.transaction_id,
            category_code=prediction.category_code,
            category_name=prediction.category_name,
            confidence=prediction.confidence,
            provider=outcome.provider.value,
            status=status,
        )

    async def _try_ml(self, request: CategorizationRequest) -> Optional[CategorizationResult]:
        """
        ML 1차 분류. 임계값 이상으로 확신하고 '기타'가 아니면 결과를 확정한다.
        미충족이면 None 을 반환해 LLM 으로 에스컬레이션시킨다.
        """
        if not self._settings.ml_first_enabled:
            return None

        threshold = self._settings.ml_confidence_threshold
        # predict_with_confidence 는 동기 CPU 작업 → 이벤트 루프 블로킹 방지 위해 스레드 오프로드
        ml = await asyncio.to_thread(predict_with_confidence, request.raw_text, threshold)
        category = ml.get("category")
        confidence = float(ml.get("confidence", 0.0))

        if category and category != FALLBACK_CODE and confidence >= threshold:
            logger.info(
                "[categorization] ML 1차 확정 request_id=%s category=%s conf=%.2f (LLM 생략)",
                request.request_id, category, confidence,
            )
            return CategorizationResult(
                request_id=request.request_id,
                transaction_id=request.transaction_id,
                category_code=category,
                category_name=category,
                confidence=confidence,
                provider="ml",
                status="SUCCESS",
            )

        logger.info(
            "[categorization] ML 확신 부족(category=%s conf=%.2f<%.2f) → LLM 에스컬레이션",
            category, confidence, threshold,
        )
        return None

    def _resolve_status(self, confidence: float, used_fallback: bool) -> str:
        if confidence < self._settings.min_confidence:
            return "LOW_CONFIDENCE"
        return "FALLBACK" if used_fallback else "SUCCESS"

    async def aclose(self) -> None:
        """LLM 클라이언트 커넥션 풀 정리(앱 종료 시)."""
        await self._router.aclose()


@lru_cache
def get_categorization_service() -> CategorizationService:
    """공용 싱글턴. HTTP 라우터와 Kafka 파이프라인이 동일 인스턴스를 공유해 커넥션을 재사용한다."""
    return CategorizationService()
