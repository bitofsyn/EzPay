import os
import httpx
import json
import asyncio
from datetime import datetime
import google.generativeai as genai
from google.generativeai.types import GenerationConfig, Tool, FunctionDeclaration

# .env 파일 로드 (python-dotenv가 설치되어 있어야 함)
from dotenv import load_dotenv
load_dotenv()

# API 키 설정
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- 도구(Tool) 정의 ---
# 백엔드 API를 호출하는 실제 함수
async def get_spending_summary(user_id: int, year: int, month: int) -> str:
    """
    주어진 연도와 월에 대한 사용자의 카테고리별 지출 내역을 조회합니다.
    """
    print(f"도구 실행: get_spending_summary(user_id={user_id}, year={year}, month={month})")
    
    backend_url = "http://backend:8080/api/statistics/spending-summary"
    params = {"user_id": user_id, "year": year, "month": month}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(backend_url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "success":
                return json.dumps(data["data"]) if data.get("data") else "해당 기간에 지출 내역이 없습니다."
            else:
                return json.dumps({"error": "지출 내역을 가져오는데 실패했습니다."})

    except httpx.HTTPStatusError as e:
        print(f"백엔드 API 오류: {e.response.status_code} - {e.response.text}")
        return json.dumps({"error": f"서버 내부 오류 (상태 코드: {e.response.status_code})"})
    except Exception as e:
        print(f"도구 실행 중 예외 발생: {e}")
        return json.dumps({"error": "알 수 없는 오류 발생"})

# --- AI 모델 및 서비스 로직 ---
# 사용 가능한 도구를 모델에 알려주는 부분
tools = [
    Tool(
        function_declarations=[
            FunctionDeclaration(
                name='get_spending_summary',
                description='특정 연도와 월의 사용자 지출 내역을 카테고리별로 조회합니다.',
                parameters={
                    "type": "object",
                    "properties": {
                        "year": {"type": "integer", "description": "조회할 연도 (YYYY 형식)"},
                        "month": {"type": "integer", "description": "조회할 월 (1-12 사이의 숫자)"},
                    },
                    "required": ["year", "month"]
                }
            )
        ]
    )
]

# 시스템 프롬프트
system_prompt = f"""
당신은 친절하고 명확하게 답변하는 금융 비서 'EzPay AI'입니다.
사용자의 질문에 대해 아래 역할을 충실히 수행해야 합니다. 현재 날짜는 {datetime.now().strftime('%Y년 %m월 %d일')}입니다.

- 사용자의 질문 의도를 파악하고, 금융 관련 질문에 전문적으로 답변합니다.
- '지출 내역', '돈 쓴 내역', '소비' 등 사용자의 소비 패턴과 관련된 질문을 받으면, 반드시 `get_spending_summary` 도구를 사용하여 정확한 데이터를 기반으로 답변해야 합니다.
- 도구를 사용할 때는 현재 날짜/시간을 기준으로 연도와 월을 정확히 추론해야 합니다. 예를 들어, '지난달'은 현재 날짜 기준의 지난달입니다. '이번달'은 현재 달을 의미합니다.
- 도구의 결과(JSON 데이터)를 받으면, 그 데이터를 사람이 이해하기 쉬운 자연스러운 문장, 표, 또는 목록 형태로 가공하여 사용자에게 최종 답변을 제공합니다.
- 도구 사용에 필요한 연도나 월 정보가 부족하면, 사용자에게 다시 질문하여 정보를 얻어내야 합니다.
- 일반적인 금융 상식이나 개념에 대해서는 친절하게 설명해줍니다.
- 도구를 사용할 수 없는 질문은, 자체 지식으로 답변합니다.
"""

model = genai.GenerativeModel(
    model_name='models/gemma-3-4b-it',
    system_instruction=system_prompt,
    generation_config=GenerationConfig(temperature=0.7)
)

async def get_ai_reply(user_message: str, user_id: int) -> str:
    """
    사용자 메시지를 받아 AI의 응답을 생성합니다. (수동 Tool Calling)
    """
    print(f"사용자 메시지 수신: '{user_message}' (사용자 ID: {user_id})")
    
    try:
        # 1. 모델에 첫 번째 요청 전송
        response = await model.generate_content_async(
            user_message,
            tools=tools
        )
        
        # 2. 모델의 응답에 함수 호출(tool call)이 있는지 확인
        if response.candidates[0].content.parts[0].function_call:
            function_call = response.candidates[0].content.parts[0].function_call
            tool_name = function_call.name
            tool_args = function_call.args

            print(f"모델이 도구 호출을 요청함: {tool_name}({tool_args})")

            # 3. 요청된 도구(함수) 실행
            if tool_name == "get_spending_summary":
                # user_id를 여기서 주입
                tool_result = await get_spending_summary(
                    user_id=user_id,
                    year=tool_args['year'],
                    month=tool_args['month']
                )

                # 4. 도구 실행 결과를 모델에 다시 전달하여 최종 답변 생성
                response = await model.generate_content_async(
                    [
                        user_message, # 원래 사용자 메시지
                        response.candidates[0].content, # 모델의 첫 번째 응답 (tool call 포함)
                        {
                            "tool_response": {
                                "name": tool_name,
                                "response": tool_result
                            }
                        }
                    ],
                    tools=tools
                )
                final_answer = response.text
            else:
                final_answer = "알 수 없는 도구를 호출했습니다."
        else:
            # 함수 호출 없이 바로 답변이 생성된 경우
            final_answer = response.text

        print(f"최종 AI 응답: {final_answer}")
        return final_answer

    except Exception as e:
        print(f"Gemini API 또는 도구 호출 중 오류 발생: {e}")
        return "죄송합니다, AI 비서와 연결하는 데 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
