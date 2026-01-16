"""
API v1 Game Load Routes - STRICT WALLET-ONLY LOADING
Games can ONLY be loaded from wallet balance
"""
from fastapi import APIRouter, Request, HTTPException, status, Header
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
import json
import logging

from ..core.database import fetch_one, fetch_all, execute, get_pool
from ..core.config import get_api_settings
from .dependencies import check_rate_limiting

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/games", tags=["Game Loading"])
settings = get_api_settings()


# ==================== MODELS ====================

class GameLoadRequest(BaseModel):
    """Game load request - ONLY from wallet"""
    game_id: str = Field(..., description="Game ID to load")
    amount: float = Field(..., gt=0, description="Amount to load from wallet")


class GameLoadResponse(BaseModel):
    """Game load response"""
    success: bool
    load_id: str
    message: str
    amount_loaded: float
    wallet_balance_remaining: float
    game_credentials: dict = None


# ==================== AUTH HELPER ====================

async def get_game_user(request: Request, portal_token: Optional[str], client_token: Optional[str]):
    """Authenticate user for game operations"""
    user_id = None
    
    if client_token:
        from ..core.security import decode_jwt_token
        payload = decode_jwt_token(client_token)
        if payload:
            user_id = payload.get('sub') or payload.get('user_id')
    elif portal_token:
        session = await fetch_one("""
            SELECT user_id FROM portal_sessions 
            WHERE session_token = $1 AND expires_at > NOW()
        """, portal_token)
        if session:
            user_id = session['user_id']
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user = await fetch_one("SELECT * FROM users WHERE user_id = $1", user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


# ==================== ENDPOINTS ====================

@router.get("/available")
async def get_available_games(
    request: Request,
    x_portal_token: Optional[str] = Header(None, alias="X-Portal-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    GET /api/v1/games/available
    Get list of games available for loading
    """
    await check_rate_limiting(request)
    
    client_token = authorization.replace("Bearer ", "") if authorization else None
    user = await get_game_user(request, x_portal_token, client_token)
    
    games = await fetch_all("""
        SELECT game_id, game_name, display_name, description, thumbnail, category,
               min_deposit_amount, max_deposit_amount
        FROM games 
        WHERE is_active = TRUE
        ORDER BY display_name
    """)
    
    wallet_balance = float(user.get('real_balance', 0) or 0)
    
    return {
        "games": [
            {
                **dict(g),
                "can_load": wallet_balance >= float(g.get('min_deposit_amount', 0) or 0)
            }
            for g in games
        ],
        "wallet_balance": wallet_balance
    }


@router.post("/load")
async def load_game_from_wallet(
    request: Request,
    data: GameLoadRequest,
    x_portal_token: Optional[str] = Header(None, alias="X-Portal-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    POST /api/v1/games/load
    Load a game ONLY from wallet balance
    
    STRICT RULE: Games can ONLY be loaded from wallet balance.
    Direct deposits, referral earnings, and bonuses must first enter wallet.
    """
    await check_rate_limiting(request)
    
    client_token = authorization.replace("Bearer ", "") if authorization else None
    user = await get_game_user(request, x_portal_token, client_token)
    
    # Get game details
    game = await fetch_one("""
        SELECT * FROM games WHERE game_id = $1 AND is_active = TRUE
    """, data.game_id)
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found or not active")
    
    # STRICT VALIDATION: Only wallet balance can be used
    wallet_balance = float(user.get('real_balance', 0) or 0)
    
    if wallet_balance < data.amount:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Insufficient wallet balance",
                "error_code": "INSUFFICIENT_BALANCE",
                "wallet_balance": wallet_balance,
                "requested_amount": data.amount,
                "shortfall": data.amount - wallet_balance,
                "hint": "Please add funds to your wallet first via the Add Balance feature."
            }
        )
    
    # Validate against game limits
    min_amount = float(game.get('min_deposit_amount', 0) or 0)
    max_amount = float(game.get('max_deposit_amount', 100000) or 100000)
    
    if data.amount < min_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum load amount for {game['display_name']} is {min_amount}"
        )
    
    if data.amount > max_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum load amount for {game['display_name']} is {max_amount}"
        )
    
    # Check for user restrictions
    if user.get('deposit_locked'):
        raise HTTPException(status_code=403, detail="Your account is restricted from loading games")
    
    # Process game load
    load_id = str(uuid.uuid4())
    new_balance = wallet_balance - data.amount
    client_ip = request.client.host if request.client else None
    
    # Generate game credentials (placeholder - would integrate with actual game API)
    game_credentials = {
        "session_id": str(uuid.uuid4())[:8],
        "game_token": f"GT-{load_id[:8]}",
        "loaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Use transaction for atomicity
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Deduct from wallet
            await conn.execute("""
                UPDATE users SET real_balance = $1, updated_at = NOW()
                WHERE user_id = $2
            """, new_balance, user['user_id'])
            
            # Record game load
            await conn.execute("""
                INSERT INTO game_loads 
                (load_id, user_id, game_id, game_name, amount, wallet_balance_before, 
                 wallet_balance_after, status, game_credentials, ip_address, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9, NOW())
            """, load_id, user['user_id'], game['game_id'], game['game_name'],
               data.amount, wallet_balance, new_balance, json.dumps(game_credentials), client_ip)
            
            # Log to immutable wallet ledger
            await conn.execute("""
                INSERT INTO wallet_ledger 
                (ledger_id, user_id, transaction_type, amount, balance_before, balance_after,
                 reference_type, reference_id, description, created_at)
                VALUES ($1, $2, 'debit', $3, $4, $5, 'game_load', $6, $7, NOW())
            """, str(uuid.uuid4()), user['user_id'], data.amount,
               wallet_balance, new_balance, load_id, 
               f"Game load: {game['display_name']}")
            
            # Audit log
            await conn.execute("""
                INSERT INTO audit_logs 
                (log_id, user_id, username, action, resource_type, resource_id, details, ip_address, created_at)
                VALUES ($1, $2, $3, 'game.loaded', 'game_load', $4, $5, $6, NOW())
            """, str(uuid.uuid4()), user['user_id'], user['username'], load_id,
               json.dumps({
                   "game": game['game_name'],
                   "amount": data.amount,
                   "balance_before": wallet_balance,
                   "balance_after": new_balance
               }), client_ip)
    
    # Emit game load notification
    from ..core.notification_router import emit_event, EventType
    await emit_event(
        event_type=EventType.GAME_LOAD_SUCCESS,
        title="Game Load Successful",
        message=f"Client {user['display_name']} loaded ₱{data.amount:,.2f} to {game['display_name']}.\n\nRemaining wallet balance: ₱{new_balance:,.2f}",
        reference_id=load_id,
        reference_type="game_load",
        user_id=user['user_id'],
        username=user.get('username'),
        display_name=user.get('display_name'),
        amount=data.amount,
        extra_data={
            "game_name": game['game_name'],
            "game_display_name": game['display_name'],
            "wallet_balance_remaining": new_balance
        },
        requires_action=False
    )
    
    return {
        "success": True,
        "load_id": load_id,
        "message": f"Successfully loaded {data.amount} to {game['display_name']}",
        "amount_loaded": data.amount,
        "wallet_balance_remaining": new_balance,
        "game_credentials": game_credentials,
        "game": {
            "game_id": game['game_id'],
            "game_name": game['game_name'],
            "display_name": game['display_name']
        }
    }


@router.get("/load-history")
async def get_game_load_history(
    request: Request,
    limit: int = 20,
    offset: int = 0,
    x_portal_token: Optional[str] = Header(None, alias="X-Portal-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    GET /api/v1/games/load-history
    Get user's game load history
    """
    await check_rate_limiting(request)
    
    client_token = authorization.replace("Bearer ", "") if authorization else None
    user = await get_game_user(request, x_portal_token, client_token)
    
    loads = await fetch_all("""
        SELECT gl.load_id, gl.game_name, g.display_name, gl.amount, 
               gl.wallet_balance_before, gl.wallet_balance_after, gl.status, gl.created_at
        FROM game_loads gl
        LEFT JOIN games g ON gl.game_id = g.game_id
        WHERE gl.user_id = $1
        ORDER BY gl.created_at DESC
        LIMIT $2 OFFSET $3
    """, user['user_id'], limit, offset)
    
    total = await fetch_one("""
        SELECT COUNT(*) as count FROM game_loads WHERE user_id = $1
    """, user['user_id'])
    
    return {
        "loads": [
            {
                **dict(l),
                "created_at": l['created_at'].isoformat() if l['created_at'] else None
            }
            for l in loads
        ],
        "total": total['count'] if total else 0
    }


@router.get("/{game_id}")
async def get_game_details(
    request: Request,
    game_id: str,
    x_portal_token: Optional[str] = Header(None, alias="X-Portal-Token"),
    authorization: Optional[str] = Header(None, alias="Authorization")
):
    """
    GET /api/v1/games/{game_id}
    Get game details with user's loading capability
    """
    await check_rate_limiting(request)
    
    client_token = authorization.replace("Bearer ", "") if authorization else None
    user = await get_game_user(request, x_portal_token, client_token)
    
    game = await fetch_one("""
        SELECT * FROM games WHERE game_id = $1 AND is_active = TRUE
    """, game_id)
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    wallet_balance = float(user.get('real_balance', 0) or 0)
    min_amount = float(game.get('min_deposit_amount', 0) or 0)
    
    # Get user's load history for this game
    recent_loads = await fetch_all("""
        SELECT load_id, amount, created_at FROM game_loads 
        WHERE user_id = $1 AND game_id = $2
        ORDER BY created_at DESC LIMIT 5
    """, user['user_id'], game_id)
    
    return {
        "game": {
            **dict(game),
            "can_load": wallet_balance >= min_amount,
            "wallet_balance": wallet_balance,
            "min_load": min_amount,
            "max_load": float(game.get('max_deposit_amount', 100000) or 100000)
        },
        "recent_loads": [
            {
                **dict(l),
                "created_at": l['created_at'].isoformat() if l['created_at'] else None
            }
            for l in recent_loads
        ]
    }
