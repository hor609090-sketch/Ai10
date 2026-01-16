# Backend Architecture Cleanup Report

## Date: 2026-01-15

---

## Files DELETED (Legacy/Duplicate)

### Routes Directory (`/app/backend/routes/`)
- `admin_routes.py` - Legacy admin endpoints (duplicate of v1/admin)
- `auth_routes.py` - Legacy auth (duplicate of v1/auth)
- `client_routes.py` - Legacy client API
- `portal_routes.py` - Legacy portal routes
- `public_routes.py` - Legacy public endpoints
- `settings_routes.py` - Legacy settings
- `telegram_routes.py` - Legacy telegram integration
- `telegram_admin_routes.py` - Legacy telegram admin
- `test_routes.py` - Legacy test endpoints
- `operations_routes.py` - Recently added but using legacy DB
- `__init__.py` - Routes package init

### Services Directory (`/app/backend/services/`)
- `telegram_service.py` - Legacy telegram service
- `__init__.py` - Services package init

### Root Level Files
- `auth.py` - Legacy authentication utilities
- `config.py` - Legacy configuration (duplicate of v1/core/config)
- `database.py` - Legacy database module (MongoDB/old PostgreSQL)
- `models.py` - Legacy Pydantic models
- `utils.py` - Legacy utilities (bonus calc, referral generation)

---

## Files KEPT (Canonical)

### `/app/backend/server.py`
- **Modified**: Stripped down to only mount API v1 router
- **Purpose**: FastAPI app entry point

### `/app/backend/api/v1/` (Entire Package)
- **core/**
  - `__init__.py` - Package init
  - `config.py` - Settings and error codes
  - `database.py` - **UNIFIED** PostgreSQL database module
  - `security.py` - Password hashing, JWT, rate limiting

- **models/**
  - `__init__.py` - Package init
  - `schemas.py` - Pydantic models for API

- **routes/**
  - `__init__.py` - Assembles all routers into `api_v1_router`
  - `auth_routes.py` - Authentication endpoints
  - `referral_routes.py` - Referral validation
  - `order_routes.py` - Order CRUD
  - `webhook_routes.py` - Webhook registration
  - `admin_routes.py` - **ENHANCED** Admin API
  - `identity_routes.py` - **NEW** Identity management
  - `payment_routes.py` - **NEW** Payment proof & Telegram
  - `dependencies.py` - Auth dependencies

- **services/**
  - `__init__.py` - Package init
  - `auth_service.py` - User creation, magic links
  - `referral_service.py` - Referral perks
  - `order_service.py` - Order validation, bonus calculation
  - `webhook_service.py` - Webhook delivery

---

## Database Schema (UNIFIED)

Single PostgreSQL schema with tables:

| Table | Purpose |
|-------|--------|
| `users` | User accounts with bonus settings |
| `user_identities` | FB/Chatwoot identity mapping |
| `magic_links` | Magic link tokens |
| `sessions` | JWT session tracking |
| `games` | Game catalog with rules |
| `rules` | Deposit/withdrawal rule engine |
| `referral_perks` | Referral bonus configurations |
| `orders` | Order records |
| `webhooks` | Webhook registrations |
| `webhook_deliveries` | Webhook delivery tracking |
| `telegram_config` | Telegram bot settings |
| `system_settings` | Global system configuration |
| `audit_logs` | All admin actions logged |

---

## Architecture Summary

### BEFORE Cleanup
```
/app/backend/
├── auth.py                 # Duplicate auth
├── config.py               # Duplicate config
├── database.py             # Old DB layer
├── models.py               # Old models
├── utils.py                # Scattered bonus logic
├── server.py               # Multiple routers
├── routes/                 # 11 legacy route files
├── services/               # Old services
└── api/v1/                 # New API (partial)
```

### AFTER Cleanup
```
/app/backend/
├── server.py               # Clean entry point
├── requirements.txt        # Dependencies
├── .env                    # Environment config
└── api/v1/                 # ONLY API (unified)
    ├── core/               # Config, DB, Security
    ├── models/             # Pydantic schemas
    ├── routes/             # All endpoints
    └── services/           # Business logic
```

---

## Final Architecture

- **ONE backend**: FastAPI with `/api/v1`
- **ONE auth system**: Magic link + password/JWT
- **ONE database**: PostgreSQL with unified schema
- **ONE rules engine**: Per-client > Per-game > Global
- **ONE bonus engine**: Centralized in order_service
- **ONE order system**: Deposit/withdrawal with states
- **ONE Telegram integration**: Payment approval flow
- **ONE admin API**: Comprehensive management

---

## Key Changes Made

1. **Table names standardized**: Removed `api_` prefix from tables
2. **Database fields aligned**: `min_deposit_amount` instead of `min_recharge_amount`
3. **Order type added**: `order_type` field for deposit/withdrawal distinction
4. **Identity management**: New routes for FB/Chatwoot identity linking
5. **Payment flow**: New routes for payment proof upload and Telegram approval
6. **Admin enhancements**: Rules engine, client bonus settings, Telegram config
7. **Audit logging**: All admin actions tracked

---

## Testing Verified

- ✅ Health check: `GET /api/health`
- ✅ User signup: `POST /api/v1/auth/signup`
- ✅ Magic link flow: Request → Consume → JWT
- ✅ Identity resolution: `POST /api/v1/identity/resolve`
- ✅ Games list: `GET /api/v1/orders/games/list`
- ✅ Order creation: `POST /api/v1/orders/create`
- ✅ Admin stats: `GET /api/v1/admin/stats`
- ✅ Admin clients: `GET /api/v1/admin/clients`
- ✅ Admin settings: `GET /api/v1/admin/settings`
- ✅ Telegram config: `GET /api/v1/admin/telegram`
