import json
import os
import re
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

INTERNAL_API_KEY = os.getenv("INTERNAL_API_SECRET_KEY")
HEADERS = {"X-Internal-API-Key": INTERNAL_API_KEY}
AI_PROVIDER = os.getenv("AI_PROVIDER", "lmstudio")
LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL", "http://host.docker.internal:1234/v1").rstrip("/")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL", "qwen2.5-7b-instruct")
LM_STUDIO_API_KEY = os.getenv("LM_STUDIO_API_KEY", "lm-studio")
CURRENT_DATETIME = datetime.now()
STOPWORDS = {
    "좀", "조금", "알려줘", "보여줘", "조회", "내역", "정보", "관련", "대한", "에서",
    "그리고", "이번", "저번", "지난", "오늘", "어제", "지금", "사용자", "나", "내",
    "뭐", "무엇", "어떻게", "가장", "정리", "요약", "기준", "해줘", "주세요",
}


# --- 지식 기반(Knowledge Base) 검색 함수 ---
def _tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[0-9A-Za-z가-힣]{2,}", text.lower())
    return [token for token in tokens if token not in STOPWORDS]


def _search_knowledge_base(query: str) -> str:
    print(f"지식 기반 검색 실행: query='{query}'")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    knowledge_base_dir = os.path.join(base_dir, "..", "knowledge_base")
    query_tokens = set(_tokenize(query))
    ranked_documents: list[tuple[int, str]] = []

    try:
        for filename in os.listdir(knowledge_base_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(knowledge_base_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    doc_tokens = set(_tokenize(content + " " + filename))
                    overlap_score = len(query_tokens & doc_tokens)
                    contains_full_query = int(query.strip().lower() in content.lower()) * 3
                    score = overlap_score + contains_full_query
                    if score > 0:
                        ranked_documents.append((score, f"--- 문서: {filename} ---\n{content}"))

        ranked_documents.sort(key=lambda item: item[0], reverse=True)
        found_content = [content for _, content in ranked_documents[:2]]
        if found_content:
            return "\n\n".join(found_content)
        return "관련된 금융 정보 문서를 찾을 수 없습니다. 일반적인 지식으로 답변해주세요."
    except Exception as e:
        print(f"지식 기반 검색 중 오류 발생: {e}")
        return "정보를 검색하는 중 오류가 발생했습니다."

# --- 도구(Tool) 정의 ---
async def get_spending_summary(user_id: int, year: int, month: int) -> str:
    """주어진 연도와 월에 대한 사용자의 카테고리별 지출 내역을 조회합니다."""
    print(f"도구 실행: get_spending_summary(user_id={user_id}, year={year}, month={month})")
    backend_url = "http://backend:8080/api/statistics/spending-summary"
    params = {"user_id": user_id, "year": year, "month": month}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(backend_url, params=params, headers=HEADERS, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == "success":
                return json.dumps(data["data"]) if data.get("data") else "해당 기간에 지출 내역이 없습니다."
            else:
                return json.dumps({"error": "지출 내역을 가져오는데 실패했습니다."})
    except Exception as e: return json.dumps({"error": f"백엔드 API 호출 오류: {e}"})

async def get_transactions(user_id: int, keyword: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> str:
    """키워드나 기간을 기준으로 사용자의 상세 거래 내역을 검색합니다."""
    print(f"도구 실행: get_transactions(user_id={user_id}, keyword={keyword}, start_date={start_date}, end_date={end_date})")
    backend_url = "http://backend:8080/api/statistics/transactions/search"
    params = {"user_id": user_id}
    if keyword: params["keyword"] = keyword
    if start_date: params["startDate"] = start_date
    if end_date: params["endDate"] = end_date
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(backend_url, params=params, headers=HEADERS, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if data.get("status") == "success":
                return json.dumps(data["data"]) if data.get("data") else "해당 조건에 맞는 거래 내역이 없습니다."
            else:
                return json.dumps({"error": "거래 내역을 검색하는데 실패했습니다."})
    except Exception as e: return json.dumps({"error": f"백엔드 API 호출 오류: {e}"})

def get_financial_advice(topic: str) -> str:
    """'재테크', '목돈', '투자', '저축' 등 일반적인 금융 지식이나 조언에 대한 질문에 답변하기 위해 내부 자료를 검색합니다."""
    return _search_knowledge_base(query=topic)


def _infer_intent(user_message: str) -> str:
    lowered = user_message.lower()

    spending_keywords = ["지출", "쓴", "썼", "사용", "소비", "카테고리", "합계", "얼마", "요약"]
    transaction_keywords = ["거래", "입금", "출금", "송금", "결제", "스타벅스", "월급", "검색", "목록", "언제"]
    finance_keywords = ["재테크", "저축", "투자", "목돈", "etf", "펀드", "주식", "채권", "예금", "적금", "cma"]

    if any(keyword in lowered for keyword in spending_keywords):
        return "spending_summary"
    if any(keyword in lowered for keyword in transaction_keywords):
        return "transactions"
    if any(keyword in lowered for keyword in finance_keywords):
        return "financial_advice"
    return "unknown"


def _infer_year_month(user_message: str) -> tuple[int, int]:
    now = CURRENT_DATETIME
    explicit_match = re.search(r"(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월", user_message)
    if explicit_match:
        year = int(explicit_match.group(1) or now.year)
        month = int(explicit_match.group(2))
        return year, month

    if "지난달" in user_message or "저번 달" in user_message or "저번달" in user_message:
        if now.month == 1:
            return now.year - 1, 12
        return now.year, now.month - 1

    return now.year, now.month


def _infer_date_range(user_message: str) -> tuple[Optional[str], Optional[str]]:
    dates = re.findall(r"\d{4}-\d{2}-\d{2}", user_message)
    if len(dates) >= 2:
        return dates[0], dates[1]

    now = CURRENT_DATETIME
    if "이번 달" in user_message or "이번달" in user_message:
        start_date = now.replace(day=1).strftime("%Y-%m-%d")
        end_date = now.strftime("%Y-%m-%d")
        return start_date, end_date
    if "지난달" in user_message or "저번 달" in user_message or "저번달" in user_message:
        if now.month == 1:
            year, month = now.year - 1, 12
        else:
            year, month = now.year, now.month - 1
        start_date = datetime(year, month, 1).strftime("%Y-%m-%d")
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        end_date = (next_month - timedelta(days=1)).strftime("%Y-%m-%d")
        return start_date, end_date
    return None, None


def _infer_transaction_keyword(user_message: str) -> Optional[str]:
    stripped = re.sub(r"\d{4}-\d{2}-\d{2}", " ", user_message)
    stripped = re.sub(r"[^\w가-힣\s]", " ", stripped)
    candidates = [token for token in _tokenize(stripped) if token not in {"거래", "입금", "출금", "송금", "결제", "검색"}]
    return candidates[0] if candidates else None


def _format_spending_summary(raw_result: str, year: int, month: int) -> str:
    if raw_result.startswith("해당 기간"):
        return f"{year}년 {month}월에는 확인된 지출 내역이 없습니다."

    data = json.loads(raw_result)
    if isinstance(data, dict) and data.get("error"):
        return f"지출 요약을 가져오지 못했습니다. {data['error']}"
    if not isinstance(data, list) or not data:
        return f"{year}년 {month}월 지출 데이터가 없습니다."

    total = 0.0
    lines = [f"{year}년 {month}월 카테고리별 지출입니다."]
    for item in sorted(data, key=lambda row: float(row.get("totalAmount", 0)), reverse=True):
        amount = float(item.get("totalAmount", 0))
        total += amount
        lines.append(f"- {item.get('category', '기타')}: {amount:,.0f}원")
    lines.append(f"총지출은 {total:,.0f}원입니다.")
    return "\n".join(lines)


def _format_transactions(raw_result: str) -> str:
    if raw_result.startswith("해당 조건"):
        return raw_result

    data = json.loads(raw_result)
    if isinstance(data, dict) and data.get("error"):
        return f"거래 내역을 가져오지 못했습니다. {data['error']}"
    if not isinstance(data, list) or not data:
        return "조건에 맞는 거래 내역이 없습니다."

    lines = [f"조건에 맞는 거래 {len(data)}건입니다."]
    for item in data[:10]:
        amount = float(item.get("amount", 0))
        date = item.get("transactionDate", "")
        category = item.get("category") or "미분류"
        description = item.get("description") or item.get("memo") or "설명 없음"
        lines.append(f"- {date[:10]} | {description} | {category} | {amount:,.0f}원")
    if len(data) > 10:
        lines.append(f"외 {len(data) - 10}건이 더 있습니다.")
    return "\n".join(lines)


async def _generate_finance_answer(user_message: str) -> str:
    knowledge = get_financial_advice(user_message)
    messages = [
        {
            "role": "system",
            "content": (
                "당신은 EzPay AI입니다. 반드시 아래 내부 문서를 근거로만 답변하세요. "
                "답변은 실용적으로 4~7문장 안에서 정리하고, 필요하면 마지막에 짧은 주의사항 1개를 덧붙이세요."
            ),
        },
        {
            "role": "user",
            "content": f"질문: {user_message}\n\n내부 문서:\n{knowledge}",
        },
    ]
    response = await _call_lm_studio(messages)
    return _extract_assistant_text(response["choices"][0]["message"])


async def _handle_with_server_routing(user_message: str, user_id: int) -> Optional[str]:
    intent = _infer_intent(user_message)
    print(f"서버 측 추론 intent='{intent}'")

    if intent == "spending_summary":
        year, month = _infer_year_month(user_message)
        tool_result = await get_spending_summary(user_id=user_id, year=year, month=month)
        return _format_spending_summary(tool_result, year, month)

    if intent == "transactions":
        start_date, end_date = _infer_date_range(user_message)
        keyword = _infer_transaction_keyword(user_message)
        tool_result = await get_transactions(
            user_id=user_id,
            keyword=keyword,
            start_date=start_date,
            end_date=end_date,
        )
        return _format_transactions(tool_result)

    if intent == "financial_advice":
        return await _generate_finance_answer(user_message)

    return None

# --- LM Studio 도구 정의 ---
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_spending_summary",
            "description": "특정 연도와 월의 사용자 지출 내역을 카테고리별로 합산하여 조회합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "year": {"type": "integer"},
                    "month": {"type": "integer"},
                },
                "required": ["year", "month"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_transactions",
            "description": "키워드(상점명, 메모 등)나 기간을 기준으로 상세 거래 내역 목록을 검색합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword": {"type": "string"},
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financial_advice",
            "description": "재테크, 목돈, 투자, 저축 방법 등 일반적인 금융 지식이나 조언에 대한 질문에 답변하기 위해 사내 지식 베이스를 검색합니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "사용자가 질문한 금융 관련 주제어 (예: '재테크', '저축')",
                    }
                },
                "required": ["topic"],
            },
        },
    },
]

system_prompt = f"""
당신은 친절하고 명확하게 답변하는 금융 비서 'EzPay AI'입니다. 사용자의 질문을 분석하여, 질문에 가장 적합한 도구를 사용해야 합니다. 현재 날짜는 {datetime.now().strftime('%Y년 %m월 %d일')}입니다.

- **개인 거래 데이터 관련 질문**:
  - **지출 합계/요약**: "돈 얼마나 썼어?", "카테고리별 지출" 등 요약/합계 정보가 필요하면 `get_spending_summary` 도구를 사용하세요.
  - **상세 내역 검색**: "스타벅스에서 쓴 거 보여줘", "월급 들어온 내역" 등 특정 거래를 찾아야 하면 `get_transactions` 도구를 사용하세요.
- **일반 금융 지식 질문**:
  - "재테크 방법", "목돈 모으는 꿀팁", "투자 기본 개념" 등 일반적인 금융 지식이나 조언이 필요하면 `get_financial_advice` 도구를 사용하세요.
- **규칙**:
  - 도구 사용 시, 현재 날짜를 기준으로 날짜(연도, 월, 일)를 정확히 추론해야 합니다.
  - 도구의 결과(JSON 데이터 또는 문서 내용)를 받으면, 그 데이터를 사람이 이해하기 쉬운 자연스러운 문장, 표, 또는 목록 형태로 가공하여 사용자에게 최종 답변을 제공합니다.
  - 도구 사용에 필요한 정보가 부족하면, 사용자에게 다시 질문하여 정보를 얻어내야 합니다.
""".strip()


async def _call_lm_studio(messages: list[dict[str, Any]], tool_definitions: Optional[list[dict[str, Any]]] = None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": LM_STUDIO_MODEL,
        "messages": messages,
        "temperature": 0.3,
    }
    if tool_definitions:
        payload["tools"] = tool_definitions
        payload["tool_choice"] = "auto"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {LM_STUDIO_API_KEY}",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{LM_STUDIO_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def _execute_tool_call(tool_name: str, tool_args: dict[str, Any], user_id: int) -> str:
    print(f"모델이 도구 호출을 요청함: {tool_name}({tool_args})")

    if tool_name == "get_spending_summary":
        return await get_spending_summary(user_id=user_id, **tool_args)
    if tool_name == "get_transactions":
        return await get_transactions(user_id=user_id, **tool_args)
    if tool_name == "get_financial_advice":
        return get_financial_advice(**tool_args)

    return json.dumps({"error": f"지원하지 않는 도구입니다: {tool_name}"}, ensure_ascii=False)


def _extract_assistant_text(message: dict[str, Any]) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = [part.get("text", "") for part in content if isinstance(part, dict)]
        return "\n".join(part for part in text_parts if part).strip()
    return ""

async def get_ai_reply(user_message: str, user_id: int) -> str:
    print(f"사용자 메시지 수신: '{user_message}' (사용자 ID: {user_id})")
    try:
        if AI_PROVIDER != "lmstudio":
            raise ValueError(f"지원하지 않는 AI_PROVIDER입니다: {AI_PROVIDER}")

        routed_answer = await _handle_with_server_routing(user_message, user_id)
        if routed_answer:
            print(f"서버 라우팅 응답 사용: {routed_answer}")
            return routed_answer

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]

        response = await _call_lm_studio(messages, tools)
        assistant_message = response["choices"][0]["message"]
        tool_calls = assistant_message.get("tool_calls", [])

        if tool_calls:
            messages.append(assistant_message)

            for tool_call in tool_calls:
                tool_name = tool_call["function"]["name"]
                raw_arguments = tool_call["function"].get("arguments") or "{}"
                tool_args = json.loads(raw_arguments)
                tool_result = await _execute_tool_call(tool_name, tool_args, user_id)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": tool_result,
                    }
                )

            follow_up_response = await _call_lm_studio(messages, tools)
            final_answer = _extract_assistant_text(follow_up_response["choices"][0]["message"])
        else:
            final_answer = _extract_assistant_text(assistant_message)

        print(f"최종 AI 응답: {final_answer}")
        return final_answer
    except Exception as e:
        print(f"LM Studio API 또는 도구 호출 중 오류 발생: {e}")
        return "죄송합니다, AI 비서와 연결하는 데 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
