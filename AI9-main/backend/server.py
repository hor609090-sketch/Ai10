"""
Gaming Platform API - Production-Ready Unified Backend
Single authoritative backend with versioned REST API
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

# Import API v1 - the ONLY backend
from api.v1 import api_v1_router, init_api_v1_db, close_api_v1_db
from api.v1.core.config import get_api_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_api_settings()

# Create FastAPI app
app = FastAPI(
    title="Gaming Platform API v1",
    description="""
## Production-Ready Gaming Order System API

A unified, production-ready REST API for managing gaming orders with referral bonuses.

**Base URL**: `/api/v1`

### Core Features
- **Authentication**: Magic link + password-based auth with JWT sessions
- **Identity Management**: FB/Chatwoot identity linking and resolution
- **Order System**: Deposit/withdrawal with rule engine validation
- **Bonus Engine**: Per-client, signup, and referral bonuses with caps
- **Telegram Integration**: Payment approval with inline buttons
- **Webhooks**: HMAC-signed notifications for order events

### Authentication
All endpoints (except signup) support:
- `username` + `password` in request body, OR
- `Authorization: Bearer <token>` header (takes precedence)

### Error Codes
- `E1xxx`: Authentication errors
- `E2xxx`: Referral errors
- `E3xxx`: Order errors
- `E4xxx`: Webhook errors
- `E5xxx`: Internal errors
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "User signup, magic link login, token management"},
        {"name": "Identity", "description": "External identity resolution and linking (FB/Chatwoot)"},
        {"name": "Referrals", "description": "Referral code validation and perk lookup"},
        {"name": "Orders", "description": "Order validation, creation, and management"},
        {"name": "Payments", "description": "Payment proof upload and verification"},
        {"name": "Webhooks", "description": "Webhook registration and delivery"},
        {"name": "Admin", "description": "Administrative operations"},
        {"name": "Games", "description": "Game catalog and configuration"},
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "E5002"
        }
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await init_api_v1_db()
    logger.info("Application startup complete - API v1 ready")

@app.on_event("shutdown")
async def shutdown_event():
    await close_api_v1_db()
    logger.info("Application shutdown complete")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "message": "Gaming Platform API v1",
        "version": "1.0.0",
        "database": "PostgreSQL"
    }

# Include API v1 router - THE ONLY API
app.include_router(api_v1_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Gaming Platform API",
        "version": "1.0.0",
        "docs": "/docs",
        "api": "/api/v1"
    }

@app.get("/api")
async def api_root():
    return {
        "message": "Gaming Platform API",
        "version": "v1",
        "base_url": "/api/v1",
        "docs": "/docs"
    }
