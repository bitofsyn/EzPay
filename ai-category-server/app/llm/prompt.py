"""LLM 이 미리 정의된 JSON 포맷으로만 응답하도록 강제하는 프롬프트 템플릿."""
from __future__ import annotations

from app.llm import categories
from app.llm.schemas import CategorizationRequest

_SYSTEM_PROMPT = """You are a strict financial transaction classification engine for a payment system.
Your ONLY job is to assign each transaction to exactly ONE predefined category.

# Allowed categories (respond ONLY with one of these codes, keep them in Korean exactly as written):
{catalog}

# Output format (MANDATORY)
- Respond with a SINGLE minified JSON object and NOTHING else.
- Do NOT add explanations, markdown, or code fences.
- Schema: {{"categoryCode":"<ONE_OF_THE_CODES_ABOVE>","confidence":<0.0-1.0>,"reason":"<short reason, max 12 words>"}}
- "categoryCode" MUST be exactly one code from the list above.
- If unsure, pick the closest category and lower the confidence.
- "confidence" is your certainty as a decimal between 0 and 1.

# Example
Input: "스타벅스 강남점 결제"
Output: {{"categoryCode":"카페/간식","confidence":0.95,"reason":"coffee shop purchase"}}
"""


def system_prompt() -> str:
    return _SYSTEM_PROMPT.format(catalog=categories.prompt_catalog())


def user_prompt(request: CategorizationRequest) -> str:
    lines = ["Classify the following transaction.", f"description: {(request.raw_text or '').strip()}"]
    if request.amount is not None:
        amount_line = f"amount: {request.amount}"
        if request.currency:
            amount_line += f" {request.currency}"
        lines.append(amount_line)
    lines.append("Return ONLY the JSON object.")
    return "\n".join(lines)
