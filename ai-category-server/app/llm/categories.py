"""
결제/금융 트랜잭션 자동 분류에 사용하는 미리 정의된 카테고리 카탈로그.

LLM 은 반드시 아래 code 중 하나로만 응답하도록 프롬프트에서 강제되며,
알 수 없는 값이면 기존 ML 서비스와 동일하게 '기타'(FALLBACK)로 폴백한다.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

FALLBACK_CODE = "기타"


@dataclass(frozen=True)
class Category:
    code: str          # 모델이 반환해야 하는 정확한 코드(한글 라벨 = 코드)
    description: str    # 프롬프트에 노출할 설명


# 기존 scikit-learn 분류기의 라벨 체계(한글 카테고리)와 정합되도록 구성.
CATEGORIES: List[Category] = [
    Category("식비", "음식점/외식/배달"),
    Category("카페/간식", "커피/디저트/간식"),
    Category("교통", "대중교통/택시/주유"),
    Category("여행/숙박", "항공/호텔/여행"),
    Category("쇼핑", "의류/전자/온라인 쇼핑"),
    Category("문화/여가", "영화/공연/취미/게임"),
    Category("의료/건강", "병원/약국/헬스"),
    Category("교육", "학원/도서/강의"),
    Category("공과금/통신", "전기/수도/가스/휴대폰 요금"),
    Category("주거", "월세/관리비/부동산"),
    Category("보험", "보험료"),
    Category("투자/저축", "예금/적금/증권/투자"),
    Category("수입", "급여/입금/환급"),
    Category("이체/송금", "개인 간 이체/송금"),
    Category("수수료", "은행/결제 수수료"),
    Category(FALLBACK_CODE, "위 어디에도 해당하지 않음"),
]

_CODE_INDEX = {c.code: c for c in CATEGORIES}


def valid_codes() -> List[str]:
    return [c.code for c in CATEGORIES]


def find(code: Optional[str]) -> Optional[Category]:
    """코드로 카테고리를 조회. 공백/대소문자 정규화."""
    if not code:
        return None
    return _CODE_INDEX.get(code.strip())


def prompt_catalog() -> str:
    """시스템 프롬프트에 삽입할 '코드 : 설명' 목록."""
    lines = []
    for c in CATEGORIES:
        if c.code == FALLBACK_CODE:
            continue  # 폴백은 내부 처리 전용, 모델에는 노출하지 않음
        lines.append(f"- {c.code} : {c.description}")
    return "\n".join(lines)


def json_schema() -> dict:
    """
    LM Studio 등 json_schema(structured output) 지원 서버용 응답 스키마.
    categoryCode 를 정의된 카테고리 enum 으로 강제하여 유효하지 않은 값 자체를 차단한다.
    """
    return {
        "name": "transaction_categorization",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "categoryCode": {"type": "string", "enum": valid_codes()},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "reason": {"type": "string"},
            },
            "required": ["categoryCode", "confidence"],
            "additionalProperties": False,
        },
    }
