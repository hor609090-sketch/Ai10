"""
API v1 Authentication Dependencies
Handles dual auth (password + token) for all endpoints
"""
from fastapi import Depends, Header, HTTPException, status, Request
from typing import Optional, Dict, Any, Tuple

from ..core.security import check_rate_limit, decode_jwt_token
from ..core.config import ErrorCodes
from ..services import authenticate_user, validate_token, get_user_by_username


class AuthResult:
    """Authentication result container"""
    def __init__(self, user_id: str, username: str, display_name: str, referral_code: str):
        self.user_id = user_id
        self.username = username
        self.display_name = display_name
        self.referral_code = referral_code


async def get_client_ip(request: Request) -> str:
    """Extract client IP from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def check_rate_limiting(request: Request) -> bool:
    """Rate limit check dependency"""
    client_ip = await get_client_ip(request)
    is_allowed, remaining = check_rate_limit(client_ip)
    
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Rate limit exceeded. Please try again later.",
                "error_code": ErrorCodes.RATE_LIMITED
            }
        )
    
    return True


async def authenticate_request(
    request: Request,
    username: Optional[str] = None,
    password: Optional[str] = None,
    authorization: Optional[str] = Header(None)
) -> AuthResult:
    """
    Authenticate a request using either:
    1. Bearer token (if Authorization header present)
    2. Username + Password (from request body)
    
    Token takes precedence if both are provided.
    """
    # Check rate limiting
    await check_rate_limiting(request)
    
    # Try token auth first
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
            is_valid, result = await validate_token(token)
            
            if is_valid:
                return AuthResult(
                    user_id=result['user_id'],
                    username=result['username'],
                    display_name=result['display_name'],
                    referral_code=result['referral_code']
                )
        
        # Invalid token format or token validation failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Invalid or expired token",
                "error_code": ErrorCodes.INVALID_TOKEN
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Fall back to username/password auth
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Authentication required. Provide username/password or Bearer token.",
                "error_code": ErrorCodes.INVALID_CREDENTIALS
            }
        )
    
    is_valid, result = await authenticate_user(username, password)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result
        )
    
    return AuthResult(
        user_id=result['user_id'],
        username=result['username'],
        display_name=result['display_name'],
        referral_code=result['referral_code']
    )


def create_auth_dependency():
    """Factory to create auth dependency that extracts credentials from body"""
    async def auth_dependency(
        request: Request,
        authorization: Optional[str] = Header(None, alias="Authorization")
    ) -> AuthResult:
        # For JSON body, we need to parse it
        body = {}
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.json()
            except:
                pass
        
        username = body.get('username')
        password = body.get('password')
        
        return await authenticate_request(request, username, password, authorization)
    
    return auth_dependency


# Convenience dependency
require_auth = create_auth_dependency()
