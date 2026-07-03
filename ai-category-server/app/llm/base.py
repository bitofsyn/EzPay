"""추론 클라이언트 다형성(Strategy Pattern)의 추상 계약."""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.config import Provider


class InferenceClient(ABC):
    """
    서로 다른 AI Provider(로컬/클라우드)가 동일한 classify 계약을 구현한다.
    라우터는 이 인터페이스만 알고 Provider 를 전환/폴백한다.
    """

    @property
    @abstractmethod
    def provider(self) -> Provider:
        """이 클라이언트가 담당하는 Provider."""

    @property
    @abstractmethod
    def enabled(self) -> bool:
        """설정이 완료되어 사용 가능한지 여부(미설정 클라우드 키 등은 False)."""

    @abstractmethod
    async def classify(self, system_prompt: str, user_content: str) -> str:
        """
        시스템 프롬프트 + 사용자 입력을 LLM 에 전달하고 원본 응답 텍스트를 반환한다.

        실패 시 app.llm.exceptions.InferenceError 계열 예외를 던진다.
        """

    async def aclose(self) -> None:
        """보유한 커넥션/리소스를 정리한다. 기본 no-op(하위 클래스가 필요 시 override)."""
        return None
