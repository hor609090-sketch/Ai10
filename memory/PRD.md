# Gaming Platform - Product Requirements Document

## Original Problem Statement
Build a production-grade gaming transaction platform with one central backend that governs:
- Rules, Bonuses, Orders, Identities, Game operations, Approvals, Audits

**Architecture**: Central FastAPI backend at `/api/v1` with PostgreSQL database. All other systems (Chatwoot AI bot, Admin UI, Games) are CLIENTS of this backend.

---

## Recent Updates (January 16, 2026 - P0 Production Blockers Fixed)

### COMPLETED: P0 Production Blocker Fixes ✅

**1. Status Consistency - Canonical Statuses Enforced**
- **Canonical Pending**: `PENDING_REVIEW` (replaces lowercase variants)
- **Canonical Final States**: 
  - `APPROVED_EXECUTED` - Approval + execution both succeeded
  - `APPROVED_FAILED` - Approved but execution failed
  - `REJECTED` - Rejected by reviewer
- Backward compatibility maintained for legacy statuses

**Files Updated:**
- `/app/backend/api/v1/core/approval_service.py`
- `/app/backend/api/v1/routes/wallet_routes.py`
- `/app/backend/api/v1/routes/bot_routes.py`
- `/app/backend/api/v1/routes/payment_routes.py`
- `/app/backend/api/v1/routes/admin_routes_v2.py`

**2. Site-Uploaded Proofs Now Reach Telegram**
- Base64 images in `extra_data['proof_image']` now sent directly to Telegram via `sendDocument`
- Images are NOT stored in database (only hashes for duplicate detection)
- Proof image data is REDACTED before logging to notification_logs

**File Updated:** `/app/backend/api/v1/core/notification_router.py`

**3. Execution Honesty Enforcement**
- Approval only marks as `APPROVED_EXECUTED` after successful execution
- Failed executions result in `APPROVED_FAILED` with error details
- Database transactions with rollback protect money safety

**4. Final-State Guarantee**
- Orders always reach terminal state: `APPROVED_EXECUTED`, `APPROVED_FAILED`, or `REJECTED`
- No orders stuck in intermediate limbo states

**5. Money Safety**
- Balance changes only committed on successful execution
- Withdrawal checks balance BEFORE attempting deduction
- All operations wrapped in database transactions

**6. Image Storage Policy**
- NO base64 or image URLs stored in database
- Only `proof_image_hash` stored for duplicate detection
- Images forwarded directly to Telegram reviewers

**Test Results (January 16, 2026):**
- Backend: 20/20 tests PASSED (100%)
- All canonical statuses verified
- Image storage policy enforced

---

### COMPLETED: Centralized Approval Service ✅

**approval_service.py** (`/app/backend/api/v1/core/approval_service.py`)
- **SINGLE SOURCE OF TRUTH** for ALL order/wallet approvals
- Used by: Telegram webhook callbacks, Admin UI approvals
- Enforces: Idempotency, Bot permissions, Amount adjustment limits, Proper side effects

**Key Functions:**
- `approve_or_reject_order()` - Handles orders (deposits, game_loads, withdrawals)
- `approve_or_reject_wallet_load()` - Handles wallet load requests

---

### COMPLETED: Multi-Telegram-Bot Notification System ✅

**NotificationRouter Service** (`/app/backend/api/v1/core/notification_router.py`)
- Central event emission service
- 20 standardized event types across 7 categories
- Base64 proof image handling via sendDocument
- Image data redaction before database storage

**Event Types Implemented:**
- Orders: ORDER_CREATED, ORDER_APPROVED, ORDER_REJECTED
- Wallet: WALLET_LOAD_REQUESTED, WALLET_LOAD_APPROVED, WALLET_LOAD_REJECTED
- Games: GAME_LOAD_REQUESTED, GAME_LOAD_SUCCESS, GAME_LOAD_FAILED
- Withdrawals: WITHDRAW_REQUESTED, WITHDRAW_APPROVED, WITHDRAW_REJECTED
- System: SECURITY_ALERT, SYSTEM_ALERT

---

### COMPLETED: Wallet Funding System ✅

**Section 1: WALLET LOAD System**
- ✅ `GET /api/v1/wallet/qr` - Fetch active payment QR codes
- ✅ `POST /api/v1/wallet/load-request` - Submit wallet load with proof image
- ✅ `GET /api/v1/wallet/load-status/{id}` - Check request status
- ✅ `GET /api/v1/wallet/load-history` - User's load history
- ✅ `GET /api/v1/wallet/balance` - Current wallet balance
- ✅ `GET /api/v1/wallet/ledger` - Immutable transaction ledger

**Section 2: Admin QR Management**
- ✅ Admin UI: Payment QR Management page

**Section 3: Telegram Review**
- ✅ Telegram notifications with proof image (base64 via sendDocument)
- ✅ Inline keyboard: Approve / Reject / View
- ✅ **All callbacks use centralized approval_service.py**

---

## System Architecture (IMPLEMENTED)

### Balance & Consumption Law (LOCKED)
- **Consumption Order**: CASH → PLAY CREDITS → BONUS
- Bonus does NOT increase cashout multiplier base
- **Cashout Law**:
  - All balance is redeemed
  - `payout = MIN(balance, max_cashout)`
  - `void = balance - max_cashout`

### Canonical Status Values
```
PENDING STATES:
- PENDING_REVIEW  (canonical)
- pending, pending_review (legacy, accepted for backward compat)
- initiated, awaiting_payment_proof

FINAL STATES:
- APPROVED_EXECUTED  (approval + execution succeeded)
- APPROVED_FAILED    (approved but execution failed)
- REJECTED           (rejected by reviewer)
- approved, rejected (legacy, accepted for backward compat)
```

### Priority System
- **CLIENT > GAME > GLOBAL** for all rules

---

## Database Schema

### Orders Table
- status VARCHAR(30) - supports canonical statuses
- executed_at TIMESTAMPTZ - when execution completed
- execution_result TEXT - execution details/error

### Wallet Load Requests Table
- status VARCHAR(20) - supports canonical statuses
- proof_image_hash VARCHAR(64) - hash only, NO base64 stored

---

## Credentials
- **Admin**: `admin` / `password`
- **Database**: PostgreSQL localhost:5432, database portal_db, user postgres

---

## MOCKED Features
- Telegram message sending (bot notifications go to Telegram API but may not have real bot configured)
- Magic link email delivery (prints to console)

---

## Backlog

### P1 - High Priority
- [ ] Missing Bonus Tasks Endpoint - Create `/api/v1/portal/bonus-tasks` for `PortalBonusTasks.js`
- [ ] Enforce Chatwoot Idempotency - Unique index on orders table
- [ ] Client detail page with full history

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
