# Backend Fixes Implementation Plan

## AUDIT FINDINGS & FIXES

### ✅ 1. System → Webhooks (PRIORITY: P0)
**Issue:** Frontend calls `/api/v1/admin/webhooks` but backend missing
**Files to check:**
- `/app/backend/api/v1/routes/webhook_routes.py` (exists - audit needed)
**Actions:**
- Check if webhook_routes.py has admin webhooks or only bot webhooks
- Implement missing: GET/POST/PUT/DELETE `/api/v1/admin/webhooks`
- Add GET `/api/v1/admin/webhooks/{id}/deliveries`

### ✅ 2. System → API Access (PRIORITY: P0)
**Issue:** Frontend calls `/api/v1/admin/api-keys` - completely missing
**Actions:**
- Create API keys table in database
- Implement GET/POST/DELETE `/api/v1/admin/api-keys`
- Add X-API-Key auth middleware
- Secure key generation + hashing

### ✅ 3. Admin → Clients "Add Client" (PRIORITY: P0)
**Issue:** Button routes to `/admin/clients/new` - page missing
**Actions:**
- Create `/app/frontend/src/pages/admin/AdminClientCreate.js`
- Implement POST `/api/v1/admin/clients`
- Add route in App.js

### ✅ 4. Client Detail Overrides + Activity (PRIORITY: P0)
**Issue:** Frontend calls endpoints that don't exist
**Actions:**
- Add GET `/api/v1/admin/clients/{id}/overrides`
- Add PUT `/api/v1/admin/clients/{id}/overrides`
- Add GET `/api/v1/admin/clients/{id}/activity`

### ✅ 5. Promo Code Redemption in Client Portal (PRIORITY: P1)
**Issue:** Promo codes in admin but not redeemable in client portal
**Actions:**
- Add promo redemption card to PortalDashboard
- Implement POST `/api/v1/portal/promo/redeem`
- Validate & credit to play_credits only

### ✅ 6. Payment Methods for Chatwoot Bot (PRIORITY: P1)
**Issue:** Bot needs payment methods CRUD
**Actions:**
- Create payment_methods table
- Implement GET/POST/PUT/DELETE `/api/v1/admin/payment-methods`
- Implement GET `/api/v1/bot/payment-methods`

### ✅ 7. Telegram Multi-Reviewer Support (PRIORITY: P2)
**Issue:** Single reviewer only, need multi-admin support
**Actions:**
- Add reviewers management UI
- Implement GET/PUT `/api/v1/admin/telegram/reviewers`
- Implement GET/PUT `/api/v1/admin/telegram/routing`

### ✅ 8. Games API Schema Mismatch (PRIORITY: P1)
**Issue:** Frontend/backend schema inconsistency
**Actions:**
- Standardize game schema
- Add per-game analytics endpoint
- Update AdminGames.js to match

## IMPLEMENTATION ORDER
1. Webhooks (needed for System page)
2. API Keys (needed for System page)
3. Client Create + Detail endpoints (needed for Clients management)
4. Promo Redemption (client-facing feature)
5. Payment Methods (bot integration)
6. Games Schema Fix + Analytics
7. Telegram Multi-Reviewer (nice-to-have)

## TESTING CHECKLIST
- [ ] All System pages functional
- [ ] Clients CRUD complete
- [ ] Promo code redemption working
- [ ] Bot can fetch payment methods
- [ ] Games display correct data
- [ ] All buttons call real endpoints
