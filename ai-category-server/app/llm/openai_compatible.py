"""
LM Studio 와 NVIDIA NIM 이 공유하는 OpenAI 호환 Chat Completions 호출 로직.

구체 클라이언트는 provider 와 접속 설정만 제공하면 되고, HTTP 요청/응답 및
예외 매핑은 이 추상 클래스가 담당한다(Template Method).
"""
from __future__ import annotations

from abc import abstractmethod
from typing import Optional

import httpx

from app.config import Provider, ProviderSettings
from app.llm.base import InferenceClient
from app.llm.exceptions import (
    InferenceError,
    InferenceTimeoutError,
    RateLimitError,
)
from app.logger import logger


class OpenAICompatibleClient(InferenceClient):
    def __init__(self, settings: ProviderSettings):
        self._settings = settings
        # 커넥션 풀링을 위해 클라이언트당 AsyncClient 1개를 재사용(요청마다 생성 X).
        # 이벤트 루프 위에서 최초 호출 시 지연 생성한다.
        self._http: Optional[httpx.AsyncClient] = None

    # ── 하위 클래스가 정의 ────────────────────────────────────────
    @property
    @abstractmethod
    def provider(self) -> Provider: ...

    # ── 공통 구현 ────────────────────────────────────────────────
    @property
    def settings(self) -> ProviderSettings:
        return self._settings

    @property
    def enabled(self) -> bool:
        return self._settings.is_configured

    def _headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self._settings.has_api_key:
            headers["Authorization"] = f"Bearer {self._settings.api_key}"
        return headers

    def _build_payload(self, system_prompt: str, user_content: str) -> dict:
        payload = {
            "model": self._settings.model,
            "temperature": self._settings.temperature,
            "max_tokens": self._settings.max_tokens,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        }
        if self._settings.top_p is not None:
            payload["top_p"] = self._settings.top_p

        response_format = self._response_format()
        if response_format is not None:
            payload["response_format"] = response_format
        return payload

    def _response_format(self) -> dict | None:
        """
        Provider 별 구조화 출력 규격을 반환한다. 미지원 모델은 파서가 방어적으로 처리하므로
        어떤 모드든 안전하다.
          - json_object : OpenAI/NVIDIA NIM 계열
          - json_schema : LM Studio 등(카테고리 enum 강제)
          - off/그 외    : 사용 안 함
        """
        mode = (self._settings.json_mode or "off").lower()
        if mode == "json_object":
            return {"type": "json_object"}
        if mode == "json_schema":
            from app.llm import categories

            return {"type": "json_schema", "json_schema": categories.json_schema()}
        return None

    def _client(self) -> httpx.AsyncClient:
        """
        풀링된 AsyncClient 를 지연 생성/재사용한다.

        주의(불변식): 검사~할당 사이에 await 지점이 없어 단일 이벤트 루프에서 원자적으로 실행되므로
        동시 호출에도 클라이언트가 중복 생성되지 않는다. 이 메서드 안에 절대 await 를 추가하지 말 것
        (추가한다면 asyncio.Lock 으로 감싸야 함). httpx.AsyncClient 는 동시 요청에 안전하다.
        """
        if self._http is None or self._http.is_closed:
            self._http = httpx.AsyncClient(
                base_url=self._settings.base_url.rstrip("/"),
                timeout=self._settings.timeout_seconds,
                headers=self._headers(),
            )
        return self._http

    async def aclose(self) -> None:
        """풀링된 커넥션을 정리한다(앱 종료 시 호출)."""
        if self._http is not None and not self._http.is_closed:
            await self._http.aclose()
        self._http = None

    async def classify(self, system_prompt: str, user_content: str) -> str:
        if not self._settings.is_configured:
            raise InferenceError(
                f"{self.provider.value} provider 미설정(base_url/model 누락)", retryable=False
            )

        payload = self._build_payload(system_prompt, user_content)

        try:
            response = await self._client().post("/chat/completions", json=payload)
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            # 로컬 서버 다운 / 연결 실패
            raise InferenceTimeoutError(
                f"{self.provider.value} 연결 실패: {exc}"
            ) from exc
        except httpx.TimeoutException as exc:
            raise InferenceTimeoutError(
                f"{self.provider.value} 응답 타임아웃: {exc}"
            ) from exc
        except httpx.HTTPError as exc:
            raise InferenceError(
                f"{self.provider.value} HTTP 오류: {exc}", retryable=True
            ) from exc

        self._raise_for_status(response)

        content = self._extract_content(response.json())
        if not content or not content.strip():
            raise InferenceError(f"{self.provider.value} 응답이 비어 있습니다.", retryable=True)

        logger.debug("[%s] 추론 성공 (%d자)", self.provider.value, len(content))
        return content

    def _raise_for_status(self, response: httpx.Response) -> None:
        code = response.status_code
        if code == 200:
            return
        if code == 429:
            raise RateLimitError(f"{self.provider.value} rate limit/토큰 초과(429)")
        if 500 <= code < 600:
            raise InferenceError(
                f"{self.provider.value} 서버 오류({code})", retryable=True
            )
        # 4xx (인증 오류/잘못된 요청 등) → 재시도 불가
        raise InferenceError(
            f"{self.provider.value} 요청 오류({code}): {response.text[:200]}",
            retryable=False,
        )

    @staticmethod
    def _extract_content(body: dict) -> str | None:
        choices = body.get("choices") or []
        if not choices:
            return None
        message = choices[0].get("message") or {}
        return message.get("content")
