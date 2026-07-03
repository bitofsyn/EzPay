"""추론 파이프라인에서 오가는 pydantic DTO."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


def _now_utc() -> datetime:
    """타임존 인식 UTC 시각(naive datetime.utcnow() 대체, Py3.12+ deprecation 회피)."""
    return datetime.now(timezone.utc)


class CategorizationRequest(BaseModel):
    """`transaction.categorization.requested` 수신 이벤트 / HTTP 요청 바디."""

    request_id: str = Field(..., alias="requestId")
    transaction_id: Optional[str] = Field(default=None, alias="transactionId")
    raw_text: str = Field(..., alias="rawText")
    amount: Optional[float] = None
    currency: Optional[str] = None

    model_config = {"populate_by_name": True}


class CategoryPrediction(BaseModel):
    """LLM 응답을 파싱한 내부 분류 결과."""

    category_code: str
    category_name: str
    confidence: float = 0.0
    reason: Optional[str] = None

    @classmethod
    def fallback(cls, reason: str) -> "CategoryPrediction":
        from app.llm.categories import FALLBACK_CODE

        return cls(
            category_code=FALLBACK_CODE,
            category_name=FALLBACK_CODE,
            confidence=0.0,
            reason=reason,
        )


class CategorizationResult(BaseModel):
    """`transaction.categorization.completed` 발행 이벤트 / HTTP 응답 바디."""

    request_id: str = Field(..., alias="requestId")
    transaction_id: Optional[str] = Field(default=None, alias="transactionId")
    category_code: str = Field(..., alias="categoryCode")
    category_name: str = Field(..., alias="categoryName")
    confidence: float
    provider: str
    status: str  # SUCCESS | FALLBACK | LOW_CONFIDENCE
    classified_at: datetime = Field(default_factory=_now_utc, alias="classifiedAt")

    model_config = {"populate_by_name": True}
