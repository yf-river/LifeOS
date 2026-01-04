"""应用配置"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # 应用
    APP_NAME: str = "LifeOS API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://lifeos:lifeos123@localhost:5432/lifeos"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET: str = "your-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 168  # 7天

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # 腾讯云
    TENCENT_SECRET_ID: Optional[str] = None
    TENCENT_SECRET_KEY: Optional[str] = None

    # 腾讯云 COS
    COS_BUCKET: Optional[str] = None
    COS_REGION: str = "ap-guangzhou"

    # DeepSeek AI
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # OpenAI (for embeddings)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_EMBEDDING_DIMENSIONS: int = 1536

    # RAG 配置
    RAG_CHUNK_SIZE: int = 500      # 文本分块大小
    RAG_CHUNK_OVERLAP: int = 50    # 分块重叠字符数
    RAG_TOP_K: int = 5             # 语义搜索返回数量

    # 回收站
    TRASH_RETENTION_DAYS: int = 30
    TRASH_CLEANUP_INTERVAL_HOURS: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
