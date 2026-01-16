"""
API v1 Core Configuration
Production-ready settings for the referral-based gaming order system
"""
import os
from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class APIv1Settings(BaseSettings):
    """API v1 Configuration"""
    
    # Database
    database_url: str = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/portal_db')
    
    # JWT Settings
    jwt_secret_key: str = os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-in-production-v1')
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Magic Link
    magic_link_expire_minutes: int = 15
    magic_link_base_url: str = os.environ.get('MAGIC_LINK_BASE_URL', 'http://localhost:3000/auth/verify')
    
    # Rate Limiting
    rate_limit_requests: int = 100  # requests per window
    rate_limit_window_seconds: int = 60
    brute_force_max_attempts: int = 5
    brute_force_lockout_minutes: int = 15
    
    # Webhook
    webhook_retry_attempts: int = 3
    webhook_retry_delay_seconds: int = 5
    webhook_timeout_seconds: int = 10
    
    # Security
    password_min_length: int = 8
    referral_code_length: int = 8
    
    # Bot/Internal API
    internal_api_secret: str = os.environ.get('INTERNAL_API_SECRET', 'system-bot-secret-key-v1')
    
    class Config:
        env_file = '.env'
        extra = 'ignore'


@lru_cache()
def get_api_settings() -> APIv1Settings:
    return APIv1Settings()


# Bonus Engine Configuration
DEFAULT_BONUS_RULES = {
    "default": {
        "percent_bonus": 5.0,
        "flat_bonus": 0.0,
        "max_bonus": 100.0,
        "min_amount": 10.0,
        "max_amount": 10000.0
    }
}

# Error Codes
class ErrorCodes:
    # Auth Errors (1xxx)
    INVALID_CREDENTIALS = "E1001"
    USER_NOT_FOUND = "E1002"
    USER_ALREADY_EXISTS = "E1003"
    INVALID_TOKEN = "E1004"
    TOKEN_EXPIRED = "E1005"
    ACCOUNT_LOCKED = "E1006"
    RATE_LIMITED = "E1007"
    
    # Referral Errors (2xxx)
    INVALID_REFERRAL_CODE = "E2001"
    EXPIRED_REFERRAL_CODE = "E2002"
    SELF_REFERRAL_NOT_ALLOWED = "E2003"
    REFERRAL_ALREADY_USED = "E2004"
    
    # Order Errors (3xxx)
    GAME_NOT_FOUND = "E3001"
    INVALID_AMOUNT = "E3002"
    AMOUNT_BELOW_MINIMUM = "E3003"
    AMOUNT_ABOVE_MAXIMUM = "E3004"
    DUPLICATE_ORDER = "E3005"
    ORDER_NOT_FOUND = "E3006"
    
    # Webhook Errors (4xxx)
    WEBHOOK_REGISTRATION_FAILED = "E4001"
    WEBHOOK_NOT_FOUND = "E4002"
    INVALID_WEBHOOK_URL = "E4003"
    
    # General Errors (5xxx)
    VALIDATION_ERROR = "E5001"
    INTERNAL_ERROR = "E5002"
    DATABASE_ERROR = "E5003"
