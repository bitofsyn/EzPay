"""Provider A (Local): 로컬 LM Studio(OpenAI 호환, 기본 http://localhost:1234/v1)."""
from __future__ import annotations

from app.config import Provider, ProviderSettings
from app.llm.openai_compatible import OpenAICompatibleClient


class LmStudioClient(OpenAICompatibleClient):
    """
    LM Studio 는 보통 인증이 필요 없으므로 api_key 가 비어 있으면 Authorization 헤더를
    생략한다(상위 _headers 로직이 처리).
    """

    def __init__(self, settings: ProviderSettings):
        super().__init__(settings)

    @property
    def provider(self) -> Provider:
        return Provider.LOCAL
