"""
API v1 Routes Package - UNIFIED BACKEND
All routes for the Gaming Platform API
"""
from fastapi import APIRouter
from .auth_routes import router as auth_router
from .referral_routes import router as referral_router
from .order_routes_v2 import router as order_router  # Use v2 with withdrawal support
from .webhook_routes import router as webhook_router
from .admin_routes_v2 import router as admin_router  # Use restructured admin
from .admin_system_routes import router as admin_system_router  # System config endpoints
from .identity_routes import router as identity_router
from .payment_routes import router as payment_router
from .bot_routes import router as bot_router
from .analytics_routes import router as analytics_router  # Analytics endpoints
from .portal_routes import router as portal_router  # Client portal enhanced endpoints
from .reward_routes import router as reward_router  # Rewards management
from .wallet_routes import router as wallet_router  # Wallet funding system
from .game_routes import router as game_router  # Game loading (wallet-only)
from .telegram_routes import router as telegram_router  # Multi-bot Telegram system

# Create main v1 router
api_v1_router = APIRouter(prefix="/api/v1")

# Include all sub-routers
api_v1_router.include_router(auth_router)
api_v1_router.include_router(identity_router)
api_v1_router.include_router(referral_router)
api_v1_router.include_router(order_router)
api_v1_router.include_router(payment_router)
api_v1_router.include_router(webhook_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(admin_system_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(portal_router)  # Client portal
api_v1_router.include_router(reward_router)  # Rewards
api_v1_router.include_router(wallet_router)  # Wallet funding
api_v1_router.include_router(game_router)    # Game loading
api_v1_router.include_router(telegram_router)  # Telegram bots
api_v1_router.include_router(bot_router)

__all__ = ["api_v1_router"]
