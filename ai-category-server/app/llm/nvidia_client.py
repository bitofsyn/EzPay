"""Provider B (Cloud): NVIDIA Build(NIM) API. OpenAI 호환, Bearer 토큰 인증."""
from __future__ import annotations

from app.config import Provider, ProviderSettings
from app.llm.openai_compatible import OpenAICompatibleClient


class NvidiaNimClient(OpenAICompatibleClient):
    """
    NVIDIA NIM(기본 https://integrate.api.nvidia.com/v1)을 Bearer 토큰으로 호출한다.
    인증 토큰은 NVIDIA_API_KEY 환경변수로만 주입되며 코드에 하드코딩하지 않는다.
    """

    def __init__(self, settings: ProviderSettings):
        super().__init__(settings)

    @property
    def provider(self) -> Provider:
        return Provider.CLOUD

    @property
    def enabled(self) -> bool:
        # NIM 은 API Key 가 반드시 있어야 사용 가능
        return super().enabled and self.settings.has_api_key
