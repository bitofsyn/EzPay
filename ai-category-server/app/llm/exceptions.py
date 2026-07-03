"""추론 파이프라인 예외 계층."""
from __future__ import annotations


class InferenceError(Exception):
    """LLM 추론 호출 실패 최상위 예외.

    retryable=True 이면 재시도/폴백 대상(타임아웃, 5xx, rate limit),
    False 이면 즉시 다음 Provider 로 넘어가거나 실패 처리(4xx, 미설정).
    """

    def __init__(self, message: str, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


class InferenceTimeoutError(InferenceError):
    """응답 지연/연결 실패(로컬 서버 다운 포함). 재시도 및 폴백 대상."""

    def __init__(self, message: str):
        super().__init__(message, retryable=True)


class RateLimitError(InferenceError):
    """토큰 초과/요청 한도 초과(HTTP 429). 백오프 후 재시도 및 폴백."""

    def __init__(self, message: str):
        super().__init__(message, retryable=True)


class AllProvidersFailedError(InferenceError):
    """기본 + 폴백 Provider 모두 최종 실패. 파이프라인에서 DLQ 처리 대상."""

    def __init__(self, message: str):
        super().__init__(message, retryable=False)
