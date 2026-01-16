"""
API v1 Referral Routes
Referral code validation and perk lookup
"""
from fastapi import APIRouter, Request, Header, HTTPException, status
from typing import Optional

from ..models import (
    ValidateReferralRequest, ValidateReferralResponse,
    ReferralPerk, APIError
)
from ..services import validate_referral_code as validate_code_service, authenticate_user
from ..core.config import ErrorCodes
from .dependencies import get_client_ip, check_rate_limiting, authenticate_request, AuthResult

router = APIRouter(prefix="/referrals", tags=["Referrals"])


@router.post(
    "/validate",
    response_model=ValidateReferralResponse,
    responses={
        400: {"model": APIError, "description": "Invalid referral code"},
        401: {"model": APIError, "description": "Invalid credentials"},
        429: {"model": APIError, "description": "Rate limited"}
    },
    summary="Validate a referral code",
    description="""
    Validate a referral code and retrieve referrer information and perks.
    
    **Authentication**: Requires username + password OR Bearer token
    
    Returns:
    - Referrer's username and display name
    - Available perks (bonus percentages, flat bonuses, caps, etc.)
    
    **Error cases**:
    - Invalid/non-existent referral code
    - Expired referral code
    - Self-referral (cannot use your own code)
    """
)
async def validate_referral(
    request: Request,
    data: ValidateReferralRequest,
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """Validate a referral code"""
    # Authenticate
    auth = await authenticate_request(
        request,
        data.username,
        data.password,
        authorization
    )
    
    # Validate referral code
    success, result = await validate_code_service(
        referral_code=data.referral_code,
        requesting_user_id=auth.user_id,
        requesting_username=auth.username
    )
    
    if not success:
        return ValidateReferralResponse(
            success=False,
            message=result.get('message', 'Invalid referral code'),
            valid=False,
            error_code=result.get('error_code')
        )
    
    # Convert perks to model
    perks = []
    for perk in result.get('perks', []):
        perks.append(ReferralPerk(**perk))
    
    return ValidateReferralResponse(
        success=True,
        message="Referral code is valid",
        valid=True,
        referrer_username=result['referrer_username'],
        referrer_display_name=result['referrer_display_name'],
        perks=perks
    )
