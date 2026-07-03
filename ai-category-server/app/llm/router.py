"""
추론 클라이언트 다형성의 조정자(Strategy 선택 + Fallback + Retry).

동작:
  1) primary_provider 로 provider 당 max_attempts 회(지수 백오프) 시도
  2) 재시도 가능한 오류로 실패 & fallback_enabled 이면 fallback_provider 로 전환
  3) 모든 Provider 실패 시 AllProvidersFailedError → 파이프라인이 DLQ 처리
재시도 불가 오류(4xx/미설정)는 즉시 다음 Provider 로 넘어간다.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Dict, List

from app.config import Provider, Settings
from app.llm.base import InferenceClient
from app.llm.exceptions import AllProvidersFailedError, InferenceError
from app.llm.lm_studio_client import LmStudioClient
from app.llm.nvidia_client import NvidiaNimClient
from app.logger import logger


@dataclass
class InferenceOutcome:
    provider: Provider
    raw_content: str
    used_fallback: bool


class InferenceRouter:
    def __init__(self, settings: Settings):
        self._settings = settings
        self._clients: Dict[Provider, InferenceClient] = {
            Provider.LOCAL: LmStudioClient(settings.provider_settings(Provider.LOCAL)),
            Provider.CLOUD: NvidiaNimClient(settings.provider_settings(Provider.CLOUD)),
        }

    async def aclose(self) -> None:
        """모든 Provider 클라이언트의 커넥션 풀을 정리한다."""
        for client in self._clients.values():
            await client.aclose()

    async def classify(self, system_prompt: str, user_content: str) -> InferenceOutcome:
        order = self._provider_order()
        primary = order[0]
        last_error: Exception | None = None

        for provider in order:
            client = self._clients.get(provider)
            if client is None or not client.enabled:
                logger.warning("[categorization] Provider %s 사용 불가(미설정) → 건너뜀", provider.value)
                continue
            try:
                content = await self._call_with_retry(client, system_prompt, user_content)
                used_fallback = provider != primary
                if used_fallback:
                    logger.warning("[categorization] 폴백 Provider %s 로 분류 성공", provider.value)
                return InferenceOutcome(provider, content, used_fallback)
            except InferenceError as exc:
                last_error = exc
                logger.warning("[categorization] Provider %s 최종 실패: %s", provider.value, exc)

        raise AllProvidersFailedError(
            f"모든 추론 Provider 실패 {[p.value for p in order]}: {last_error}"
        )

    async def _call_with_retry(
        self, client: InferenceClient, system_prompt: str, user_content: str
    ) -> str:
        max_attempts = max(1, self._settings.max_attempts_per_provider)
        last_error: InferenceError | None = None

        for attempt in range(1, max_attempts + 1):
            try:
                return await client.classify(system_prompt, user_content)
            except InferenceError as exc:
                last_error = exc
                if not exc.retryable or attempt == max_attempts:
                    raise
                backoff = (self._settings.retry_backoff_ms / 1000.0) * (2 ** (attempt - 1))
                logger.warning(
                    "[categorization] %s 시도 %d/%d 실패(%s), %.2fs 후 재시도",
                    client.provider.value, attempt, max_attempts, exc, backoff,
                )
                await asyncio.sleep(backoff)

        # 방어적 처리(도달하지 않음)
        raise last_error or InferenceError(f"{client.provider.value} 재시도 실패")

    def _provider_order(self) -> List[Provider]:
        order = [self._settings.primary_provider]
        if (
            self._settings.fallback_enabled
            and self._settings.fallback_provider != self._settings.primary_provider
        ):
            order.append(self._settings.fallback_provider)
        return order
