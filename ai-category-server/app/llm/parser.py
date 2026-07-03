"""
LLM 원본 응답 텍스트를 CategoryPrediction DTO 로 안전하게 파싱/매핑하는 유틸리티.

모델이 코드펜스(```json ... ```)나 잡담을 섞거나, 코드만 덜렁 반환하는 등 다양한
실패 케이스를 방어적으로 처리하고, 알 수 없는 코드는 '기타'로 폴백한다.
절대 예외를 던지지 않는다.
"""
from __future__ import annotations

import json
import re
from typing import Optional

from app.llm import categories
from app.llm.schemas import CategoryPrediction
from app.logger import logger

# 후보 JSON 블록: 최초 '{' ~ 최후 '}'
_JSON_SPAN = re.compile(r"\{.*\}", re.DOTALL)
# 후보 키 별칭
_CODE_KEYS = ("categoryCode", "category_code", "category", "code")
_REASON_KEYS = ("reason", "explanation")


def parse(raw_response: Optional[str]) -> CategoryPrediction:
    if not raw_response or not raw_response.strip():
        return CategoryPrediction.fallback("empty response")

    prediction = _try_parse_json(raw_response)
    if prediction is not None:
        return prediction

    # JSON 파싱 실패 → 코드 토큰만 반환한 경우 대비 원문 스캔
    scanned = _scan_for_code(raw_response)
    if scanned is not None:
        return scanned

    return CategoryPrediction.fallback(f"unparseable: {_truncate(raw_response)}")


def _try_parse_json(text: str) -> Optional[CategoryPrediction]:
    match = _JSON_SPAN.search(text)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except (json.JSONDecodeError, ValueError) as exc:
        logger.debug("JSON 파싱 실패: %s", exc)
        return None
    if not isinstance(data, dict):
        return None

    raw_code = _first(data, _CODE_KEYS)
    if raw_code is None:
        return None

    category = categories.find(str(raw_code))
    if category is None:
        # 정의되지 않은 코드 → 폴백(단, 근거/신뢰도는 유지하지 않음)
        return CategoryPrediction.fallback(f"unknown code: {raw_code}")

    return CategoryPrediction(
        category_code=category.code,
        category_name=category.code,
        confidence=_clamp_confidence(data.get("confidence")),
        reason=_first(data, _REASON_KEYS),
    )


def _scan_for_code(text: str) -> Optional[CategoryPrediction]:
    for code in categories.valid_codes():
        if code == categories.FALLBACK_CODE:
            continue
        if code in text:
            return CategoryPrediction(
                category_code=code,
                category_name=code,
                confidence=0.5,  # JSON 없이 코드만 추출 → 중간 신뢰도
                reason="recovered from non-JSON response",
            )
    return None


def _first(data: dict, keys) -> Optional[str]:
    for key in keys:
        value = data.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


def _clamp_confidence(value) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, v))


def _truncate(text: str, limit: int = 120) -> str:
    flat = " ".join(text.split())
    return flat if len(flat) <= limit else flat[:limit] + "…"
