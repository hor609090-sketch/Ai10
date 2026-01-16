# Gaming Platform - Product Requirements Document

## Original Problem Statement
Build a production-grade gaming transaction platform with one central backend that governs:
- Rules, Bonuses, Orders, Identities, Game operations, Approvals, Audits

**Architecture**: Central FastAPI backend at `/api/v1` with PostgreSQL database. All other systems (Chatwoot AI bot, Admin UI, Games) are CLIENTS of this backend.

---

## Recent Updates (January 16, 2026)

### COMPLETED: Centralized Approval Service Refactor ✅

**approval_service.py** (`/app/backend/api/v1/core/approval_service.py`)
- **SINGLE SOURCE OF TRUTH** for ALL order/wallet approvals
- Used by: Telegram webhook callbacks, Admin UI approvals
- Enforces: Idempotency, Bot permissions, Amount adjustment limits, Proper side effects

**Key Functions:**
- `approve_or_reject_order()` - Handles orders (deposits, game_loads, withdrawals)
- `approve_or_reject_wallet_load()` - Handles wallet load requests

**Refactored Components:**
- `telegram_routes.py` - Now uses `approval_service` for all callbacks
- `admin_routes_v2.py` - `/api/v1/admin/approvals/{order_id}/action` uses `approval_service`
- `wallet_routes.py` - **REMOVED** legacy `/api/v1/wallet/review` endpoint

**MongoDB Cleanup:**
- Removed `motor==3.3.1` from requirements.txt
- Removed `pymongo==4.5.0` from requirements.txt
- Application is now **100% PostgreSQL**

**Test Results (January 16, 2026):**
- Backend: 15/15 tests PASSED (100%)
- Frontend: All pages loading correctly
- Legacy endpoint `/api/v1/wallet/review` correctly returns 404

---

**NotificationRouter Service** (`/app/backend/api/v1/core/notification_router.py`)
- Central event emission service
- 20 standardized event types across 7 categories
- Automatic bot subscription filtering
- Per-event approval button control
- Notification logging

**Event Types Implemented:**
- Orders: ORDER_CREATED, ORDER_APPROVED, ORDER_REJECTED
- Wallet: WALLET_LOAD_REQUESTED, WALLET_LOAD_APPROVED, WALLET_LOAD_REJECTED
- Games: GAME_LOAD_REQUESTED, GAME_LOAD_SUCCESS, GAME_LOAD_FAILED, GAME_ID_CREATED, GAME_ID_RESET
- Withdrawals: WITHDRAW_REQUESTED, WITHDRAW_APPROVED, WITHDRAW_REJECTED
- Referrals: REFERRAL_JOINED, REFERRAL_MILESTONE_REACHED, REFERRAL_REWARD_GRANTED
- System: TRANSACTION_LOGGED, SECURITY_ALERT, SYSTEM_ALERT

**Telegram Bot APIs:**
- `GET /api/v1/admin/telegram/bots` - List all bots
- `POST /api/v1/admin/telegram/bots` - Create bot (validates token with Telegram)
- `PUT /api/v1/admin/telegram/bots/{id}` - Update bot
- `DELETE /api/v1/admin/telegram/bots/{id}` - Delete bot
- `GET /api/v1/admin/telegram/events` - List all event types
- `POST /api/v1/admin/telegram/bots/{id}/permissions` - Update permissions
- `GET /api/v1/admin/telegram/permission-matrix` - Full permission matrix
- `POST /api/v1/admin/telegram/bots/{id}/test` - Send test notification
- `GET /api/v1/admin/telegram/logs` - Notification logs

**Database Tables:**
- `telegram_bots` - Bot configurations with approval permissions
- `telegram_bot_event_permissions` - Per-bot event subscriptions
- `notification_logs` - Delivery tracking

**Admin UI:** `/admin/system/telegram-bots`
- Bots tab: Add/edit/delete bots, test notifications
- Event Permissions tab: Matrix view for enabling events per bot

---

### COMPLETED: Wallet Funding System ✅

**Section 1: WALLET LOAD System**
- ✅ `GET /api/v1/wallet/qr` - Fetch active payment QR codes
- ✅ `POST /api/v1/wallet/load-request` - Submit wallet load with proof image
- ✅ `GET /api/v1/wallet/load-status/{id}` - Check request status
- ✅ `GET /api/v1/wallet/load-history` - User's load history
- ✅ `GET /api/v1/wallet/balance` - Current wallet balance
- ✅ `GET /api/v1/wallet/ledger` - Immutable transaction ledger
- ✅ `POST /api/v1/wallet/review` - Telegram webhook for approve/reject

**Section 2: Admin QR Management**
- ✅ `POST /api/v1/admin/system/payment-qr` - Create QR
- ✅ `GET /api/v1/admin/system/payment-qr` - List all QRs
- ✅ `PATCH /api/v1/admin/system/payment-qr/{id}` - Update QR
- ✅ `DELETE /api/v1/admin/system/payment-qr/{id}` - Delete QR
- ✅ Admin UI: Payment QR Management page

**Section 3: Telegram Review**
- ✅ Telegram notifications with proof image
- ✅ Inline keyboard: Approve / Reject / View
- ✅ Callback handler: `wl_approve`, `wl_reject`, `wl_view`
- ✅ Auto-credit wallet on approval
- ✅ **All callbacks use centralized `approval_service.py`**

**Section 4: Game Loading (STRICT WALLET-ONLY)**
- ✅ `POST /api/v1/games/load` - Load game from wallet ONLY
- ✅ `GET /api/v1/games/available` - List games with load capability
- ✅ `GET /api/v1/games/load-history` - User's game load history
- ✅ Validation: wallet_balance >= load_amount
- ✅ Immutable ledger logging

**Section 7: Audit & Safety**
- ✅ Duplicate proof hash detection
- ✅ IP + device fingerprint logging
- ✅ Immutable wallet_ledger table
- ✅ Audit logs for all actions

### Database Tables Added
- `payment_qr` - Admin-managed QR codes
- `wallet_load_requests` - Client funding requests
- `wallet_ledger` - Immutable transaction log
- `game_loads` - Game loading history

### Frontend Pages Added
- `AdminPaymentQR.js` - QR management UI
- `AdminWalletLoads.js` - Load request review UI
- Updated `PortalWallet.js` - Add Balance flow
- Updated `PortalLoadGame.js` - Wallet-only game loading

---

## System Architecture (IMPLEMENTED)

### Balance & Consumption Law (LOCKED)
- **Consumption Order**: CASH → PLAY CREDITS → BONUS
- Bonus does NOT increase cashout multiplier base
- Bonus IS withdrawable if multiplier condition is met
- **Cashout Law**:
  - All balance is redeemed
  - `payout = MIN(balance, max_cashout)`
  - `void = balance - max_cashout`
  - `void_reason = EXCEEDS_MAX_CASHOUT`

### Priority System
- **CLIENT > GAME > GLOBAL** for all rules

---

## Admin UI - FINAL STRUCTURE (IMPLEMENTED)

### Sidebar Order:
1. **Dashboard** - Read-only overview (pending approvals, today's flow, system status)
2. **Approvals** - Human safety net for pending deposits/withdrawals
3. **Orders** - Transaction control with full order detail page
4. **Clients** - Individual user management with overrides
5. **Games** - Per-game configuration + analytics
6. **Rules** - Global defaults ONLY (not client/game settings)
7. **Referrals** - Dashboard, ledger, top referrers
8. **Promo Codes** - Play credits system
9. **Reports** - Balance flow, profit by game, void report
10. **System** - Kill switch, Telegram, API, webhooks
11. **Audit Logs** - Read-only log viewer

---

## What's Been Implemented ✅

### Backend (FastAPI + PostgreSQL)

#### Rules Engine
- Priority: CLIENT > GAME > GLOBAL
- Deposit validation with balance blocking
- Withdrawal validation with multiplier rules
- Full cashout calculation (payout + void)
- Bonus consumption order tracking

#### Order System
- Deposit orders with bonus calculation
- Withdrawal orders with multiplier enforcement
- Full order detail with balance flow tracking
- Status: initiated → awaiting_payment_proof → pending_review → approved/rejected

#### Promo Codes (NEW)
- Create promo codes for play credits
- One-time per user redemption
- Max redemptions limit
- Expiry support

#### Admin APIs (Restructured)
- `/api/v1/admin/dashboard` - Overview stats
- `/api/v1/admin/approvals/*` - Approval management
- `/api/v1/admin/orders/*` - Order management with detail
- `/api/v1/admin/clients/*` - Client management with overrides
- `/api/v1/admin/games` - Game config + analytics
- `/api/v1/admin/rules` - Global defaults only
- `/api/v1/admin/referrals/*` - Referral management
- `/api/v1/admin/promo-codes/*` - Promo code CRUD
- `/api/v1/admin/reports/*` - Financial reports
- `/api/v1/admin/system` - System config
- `/api/v1/admin/audit-logs` - Audit log viewer

### Frontend (React)

#### Admin Panel (Restructured)
- New sidebar with 11 sections
- Dashboard: Read-only overview with clickable stats
- Rules: Global defaults only with info banner
- Reports: Balance flow, profit by game, void report
- Promo Codes: Create, view, disable codes
- System: Kill switch, integrations control

#### Public Games Page
- Working with v1 API
- Game cards with deposit limits and bonuses

---

## Database Schema

### Users
- user_id, username, password_hash
- real_balance, bonus_balance, play_credits
- deposit_count, total_deposited, total_withdrawn
- signup_bonus_claimed, bonus_percentage
- deposit_locked, withdraw_locked, is_suspicious
- manual_approval_only, no_bonus

### Orders
- order_id, user_id, order_type (deposit/withdrawal)
- amount, bonus_amount, play_credits_added, total_amount
- payout_amount, void_amount, void_reason
- cash_consumed, play_credits_consumed, bonus_consumed
- status, payment_proof_url

### Promo Codes
- code_id, code, credit_amount
- max_redemptions, current_redemptions
- expires_at, is_active

### Games
- game_id, game_name, display_name
- min/max_deposit_amount, min/max_withdrawal_amount
- bonus_rules, withdrawal_rules

### System Settings
- signup_bonus, default_deposit_bonus, default_referral_bonus
- deposit_block_balance, min/max_cashout_multiplier
- master_kill_switch, kill_switch_reason
- telegram_enabled, api_enabled, webhook_enabled

---

## Credentials
- **Admin**: `admin` / `password`
- **URL**: https://refactor-central.preview.emergentagent.com

---

## Recent Updates (January 2026)

### Completed ✅
- **PostgreSQL Database Setup**: Backend now fully connected to PostgreSQL (was previously misconfigured)
- **Security Module Fix**: Updated password hashing to use bcrypt directly (fixed passlib compatibility issue)
- **Admin UI API Path Fixes**: Fixed all admin frontend files to use correct `/api/v1/` endpoints
- **Admin UI Audit**: Verified all buttons, webhooks, and connectors work correctly
- **Test Coverage**: 16 backend API tests passing (100% success rate)

### Files Updated
- `/app/backend/api/v1/core/security.py` - Fixed bcrypt password hashing
- `/app/frontend/src/pages/admin/AdminAuditLogs.js` - Fixed API path
- `/app/frontend/src/pages/admin/AdminAITestSpot.js` - Fixed API path
- `/app/frontend/src/pages/admin/AdminOperationsPanel.js` - Fixed API paths
- `/app/frontend/src/pages/admin/AdminSettings.js` - Fixed API path
- `/app/frontend/src/pages/admin/AdminTelegramSetup.js` - Fixed API path
- `/app/frontend/src/pages/admin/AdminPaymentPanel.js` - Fixed API path
- `/app/frontend/src/pages/admin/AdminClientDetail.js` - Fixed syntax error

---

## MOCKED Features
- Magic link email delivery (prints to console)
- Telegram message sending (placeholder)

---

## Backlog

### P1 - High Priority
- [ ] Enforce Chatwoot Idempotency - Unique index on orders table for `(source='chatwoot', external_ref_id)`
- [ ] Client detail page with full history
- [ ] Audit logs UI implementation

### P2 - Medium Priority
- [ ] Edit Amount feature for Telegram reviewers
- [ ] Webhook monitoring UI
- [ ] Game analytics charts

### P3 - Future
- [ ] Chatwoot bot integration
- [ ] Real email/SMS delivery
- [ ] Advanced reporting

---

## Last Updated
January 16, 2026
