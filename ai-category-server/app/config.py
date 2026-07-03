"""
환경변수 기반 설정 바인딩.

기존 서비스와 동일하게 `config/.env` 를 읽으며, 하이브리드 LLM 추론/Kafka 파이프라인에
필요한 값들을 pydantic-settings 로 타입 안전하게 노출한다.
"""
from __future__ import annotations

from enum import Enum
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Provider(str, Enum):
    LOCAL = "local"
    CLOUD = "cloud"


class ProviderSettings(BaseModel):
    """
    단일 Provider(OpenAI 호환) 접속 설정.

    Settings.provider_settings() 에서 전 필드를 명시해 생성하는 순수 값 객체이므로
    BaseSettings(매 생성 시 env 소스 스캔)가 아닌 BaseModel 로 둔다.
    """

    base_url: str = ""
    api_key: Optional[str] = None
    model: str = ""
    timeout_ms: int = 20000
    max_tokens: int = 256
    temperature: float = 0.0
    top_p: Optional[float] = None
    # 구조화 출력 방식: "off" | "json_object"(OpenAI/NVIDIA) | "json_schema"(LM Studio 등)
    json_mode: str = "off"

    @property
    def timeout_seconds(self) -> float:
        return self.timeout_ms / 1000.0

    @property
    def has_api_key(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url.strip()) and bool(self.model.strip())


class Settings(BaseSettings):
    """
    전역 설정. `EZPAY_` 접두어 없이 개별 필드별로 env 매핑을 지정한다.
    (예: AI_PRIMARY_PROVIDER, NVIDIA_API_KEY ...)
    """

    model_config = SettingsConfigDict(
        env_file="config/.env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ── 추론 라우팅 정책 ──────────────────────────────────────────
    primary_provider: Provider = Field(default=Provider.LOCAL, alias="AI_PRIMARY_PROVIDER")
    fallback_provider: Provider = Field(default=Provider.CLOUD, alias="AI_FALLBACK_PROVIDER")
    fallback_enabled: bool = Field(default=True, alias="AI_FALLBACK_ENABLED")
    max_attempts_per_provider: int = Field(default=2, alias="AI_MAX_ATTEMPTS")
    retry_backoff_ms: int = Field(default=500, alias="AI_RETRY_BACKOFF_MS")
    min_confidence: float = Field(default=0.35, alias="AI_MIN_CONFIDENCE")

    # ── LLM 동시성 백프레셔 ───────────────────────────────────────────
    # 로컬 LM Studio 는 단일 모델 인스턴스라 사실상 직렬 처리된다. 동시 에스컬레이션을
    # 무제한 허용하면 큐가 폭증해 전부 타임아웃으로 무너진다. 세마포어로 동시 LLM
    # 호출 수를 제한해, 초과분은 대기(백프레셔)시켜 안정적인 처리량을 유지한다.
    max_concurrent_llm: int = Field(default=4, alias="AI_MAX_CONCURRENT_LLM")

    # ── 계층형 추론(sklearn 1차 → LLM 에스컬레이션) ─────────────────
    # 빠르고 비용 0 인 기존 ML 분류기를 먼저 시도하고, 확신이 낮을 때만 LLM 호출.
    ml_first_enabled: bool = Field(default=True, alias="AI_ML_FIRST_ENABLED")
    ml_confidence_threshold: float = Field(default=0.7, alias="AI_ML_CONFIDENCE_THRESHOLD")

    # ── Provider A: 로컬 LM Studio ───────────────────────────────
    lm_studio_base_url: str = Field(default="http://localhost:1234/v1", alias="LM_STUDIO_BASE_URL")
    lm_studio_api_key: Optional[str] = Field(default=None, alias="LM_STUDIO_API_KEY")
    lm_studio_model: str = Field(default="local-model", alias="LM_STUDIO_MODEL")
    lm_studio_timeout_ms: int = Field(default=20000, alias="LM_STUDIO_TIMEOUT_MS")
    lm_studio_max_tokens: int = Field(default=256, alias="LM_STUDIO_MAX_TOKENS")
    lm_studio_json_mode: str = Field(default="json_schema", alias="LM_STUDIO_JSON_MODE")
    lm_studio_temperature: float = Field(default=0.0, alias="LM_STUDIO_TEMPERATURE")
    lm_studio_top_p: Optional[float] = Field(default=None, alias="LM_STUDIO_TOP_P")

    # ── Provider B: 클라우드 NVIDIA Build(NIM) ───────────────────
    nvidia_base_url: str = Field(default="https://integrate.api.nvidia.com/v1", alias="NVIDIA_BASE_URL")
    nvidia_api_key: Optional[str] = Field(default=None, alias="NVIDIA_API_KEY")  # 필수(클라우드 사용 시)
    nvidia_model: str = Field(default="meta/llama-3.1-70b-instruct", alias="NVIDIA_MODEL")
    nvidia_timeout_ms: int = Field(default=30000, alias="NVIDIA_TIMEOUT_MS")
    nvidia_max_tokens: int = Field(default=256, alias="NVIDIA_MAX_TOKENS")
    nvidia_json_mode: str = Field(default="json_object", alias="NVIDIA_JSON_MODE")
    nvidia_temperature: float = Field(default=0.2, alias="NVIDIA_TEMPERATURE")
    nvidia_top_p: Optional[float] = Field(default=0.7, alias="NVIDIA_TOP_P")

    # ── Kafka 이벤트 파이프라인 ──────────────────────────────────
    kafka_enabled: bool = Field(default=True, alias="KAFKA_ENABLED")
    kafka_bootstrap_servers: str = Field(default="kafka:9092", alias="KAFKA_BOOTSTRAP_SERVERS")
    kafka_group_id: str = Field(default="ai-category-group", alias="KAFKA_GROUP_ID")
    kafka_request_topic: str = Field(
        default="transaction.categorization.requested", alias="KAFKA_REQUEST_TOPIC"
    )
    kafka_completed_topic: str = Field(
        default="transaction.categorization.completed", alias="KAFKA_COMPLETED_TOPIC"
    )
    kafka_dlt_topic: str = Field(
        default="transaction.categorization.requested.DLT", alias="KAFKA_DLT_TOPIC"
    )

    def provider_settings(self, provider: Provider) -> ProviderSettings:
        """Provider enum → 접속 설정 매핑."""
        if provider == Provider.LOCAL:
            return ProviderSettings(
                base_url=self.lm_studio_base_url,
                api_key=self.lm_studio_api_key,
                model=self.lm_studio_model,
                timeout_ms=self.lm_studio_timeout_ms,
                max_tokens=self.lm_studio_max_tokens,
                temperature=self.lm_studio_temperature,
                top_p=self.lm_studio_top_p,
                json_mode=self.lm_studio_json_mode,
            )
        return ProviderSettings(
            base_url=self.nvidia_base_url,
            api_key=self.nvidia_api_key,
            model=self.nvidia_model,
            timeout_ms=self.nvidia_timeout_ms,
            max_tokens=self.nvidia_max_tokens,
            temperature=self.nvidia_temperature,
            top_p=self.nvidia_top_p,
            json_mode=self.nvidia_json_mode,
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
