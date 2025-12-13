from fastapi import APIRouter, Depends
from .schemas import ChatRequest, ChatResponse
from . import services

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    """
    사용자의 채팅 메시지를 받아 AI의 응답을 반환합니다.
    """
    reply = await services.get_ai_reply(request.message, request.user_id)
    return ChatResponse(reply=reply)
