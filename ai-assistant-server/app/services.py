import os
import httpx
import json
import asyncio
from datetime import datetime, date
from typing import Optional
from google.generativeai.types import GenerationConfig, Tool, FunctionDeclaration
import google.generativeai as genai

# .env 파일 로드
from dotenv import load_dotenv
load_dotenv()

# API 키 설정
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
INTERNAL_API_KEY = os.getenv("INTERNAL_API_SECRET_KEY")
HEADERS = {"X-Internal-API-Key": INTERNAL_API_KEY}


# --- 지식 기반(Knowledge Base) 검색 함수 ---
def _search_knowledge_base(keyword: str) -> str:
    # ... (이하 기존 코드와 동일)
    print(f"지식 기반 검색 실행: 키워드='{keyword}'")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    knowledge_base_dir = os.path.join(base_dir, '..', '..', 'knowledge_base')
    found_content = []
    try:
        for filename in os.listdir(knowledge_base_dir):
            if filename.endswith(".md"):
                filepath = os.path.join(knowledge_base_dir, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if keyword.lower() in content.lower():
                        found_content.append(f"--- 문서: {filename} ---\n{content}")
        if found_content: return "\n\n".join(found_content)
        else: return "관련된 금융 정보 문서를 찾을 수 없습니다. 일반적인 지식으로 답변해주세요."
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
    backend_url = "http://backend:8080/api/transactions/search"
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
    return _search_knowledge_base(keyword=topic)

# --- AI 모델 및 서비스 로직 (이전과 동일) ---
tools = [
    Tool(
        function_declarations=[
            FunctionDeclaration(name='get_spending_summary', description='특정 연도와 월의 사용자 지출 내역을 카테고리별로 합산하여 조회합니다.', parameters={"type": "object","properties": {"year": {"type": "integer"},"month": {"type": "integer"}},"required": ["year", "month"]}),
            FunctionDeclaration(name='get_transactions', description='키워드(상점명, 메모 등)나 기간을 기준으로 상세 거래 내역 목록을 검색합니다.', parameters={"type": "object","properties": {"keyword": {"type": "string"},"start_date": {"type": "string"},"end_date": {"type": "string"}},"required": []}),
            FunctionDeclaration(name='get_financial_advice', description="재테크, 목돈, 투자, 저축 방법 등 일반적인 금융 지식이나 조언에 대한 질문에 답변하기 위해 사내 지식 베이스를 검색합니다.", parameters={"type": "object","properties": {"topic": {"type": "string", "description": "사용자가 질문한 금융 관련 주제어 (예: '재테크', '저축')"}},"required": ["topic"]})
        ]
    )
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
"""

model = genai.GenerativeModel(model_name='models/gemma-3-4b-it', system_instruction=system_prompt)

async def get_ai_reply(user_message: str, user_id: int) -> str:
    # ... (이하 로직은 이전과 동일)
    print(f"사용자 메시지 수신: '{user_message}' (사용자 ID: {user_id})")
    try:
        chat = model.start_chat()
        response = await chat.send_message_async(user_message, tools=tools)
        
        if response.candidates[0].content.parts[0].function_call:
            function_call = response.candidates[0].content.parts[0].function_call
            tool_name = function_call.name
            tool_args = {key: value for key, value in function_call.args.items()}
            tool_result = ""

            print(f"모델이 도구 호출을 요청함: {tool_name}({tool_args})")

            if tool_name == "get_spending_summary":
                tool_result = await get_spending_summary(user_id=user_id, **tool_args)
            elif tool_name == "get_transactions":
                tool_result = await get_transactions(user_id=user_id, **tool_args)
            elif tool_name == "get_financial_advice":
                tool_result = get_financial_advice(**tool_args)

            response = await chat.send_message_async([{"tool_response": {"name": tool_name, "response": tool_result}}], tools=tools)
            final_answer = response.text
        else:
            final_answer = response.text

        print(f"최종 AI 응답: {final_answer}")
        return final_answer
    except Exception as e:
        print(f"Gemini API 또는 도구 호출 중 오류 발생: {e}")
        return "죄송합니다, AI 비서와 연결하는 데 문제가 발생했습니다. 잠시 후 다시 시도해주세요."