# 🎮 Gaming Platform - Complete System Architecture

## 📋 System Overview

This is a **CENTRAL HUB** gaming platform designed to integrate with external services (Telegram, Chatwoot, Game APIs) while managing all client data, transactions, and workflows in one place.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL PLATFORM (This System)                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      FastAPI Backend (8001)                      │    │
│  │  • Client Management    • Order Processing    • Ledger System   │    │
│  │  • Referral Engine      • Game Management     • Settings        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      MongoDB Database                            │    │
│  │  • clients    • ledger_transactions    • orders    • games       │    │
│  │  • referrals  • global_settings        • audit_logs              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      React Frontend (3000)                       │    │
│  │  • Public Games    • Client Portal    • Admin Dashboard          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────│─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   TELEGRAM    │       │     CHATWOOT      │       │    GAME APIs      │
│   Bot/Webhook │       │   (Messenger)     │       │  (Load/Redeem)    │
│               │       │                   │       │                   │
│ • Payment     │       │ • First Contact   │       │ • Account Create  │
│   Confirmation│       │ • Client Signup   │       │ • Load Credits    │
│ • Admin       │       │ • Referral Code   │       │ • Redeem Balance  │
│   Notifications│      │   Entry           │       │ • Get Credentials │
└───────────────┘       └───────────────────┘       └───────────────────┘
```

---

## 🔌 Integration Points & APIs

### 1. **TELEGRAM BOT INTEGRATION** (Payment Confirmation)
**Purpose:** Admin payment verification without needing this platform's admin panel

**Endpoints (Inbound from Telegram):**
```
POST /api/telegram/cash-in
  Body: { client_id, amount, reference_id, payment_method }
  → Creates pending deposit order
  
POST /api/telegram/cash-out
  Body: { client_id, amount, payout_method, payout_details }
  → Creates pending withdrawal order
  
POST /api/telegram/confirm/{order_id}
  → Confirms order, updates ledger, processes referral commission
  
POST /api/telegram/reject/{order_id}
  Body: { reason }
  → Rejects order with reason
  
POST /api/telegram/edit/{order_id}
  Body: { new_amount, reason }
  → Adjusts order amount before confirmation

GET /api/telegram/pending-orders
  → Returns all pending orders for Telegram inline keyboard
```

**What Telegram Bot Sends TO Platform:**
- Client deposit requests (amount, method)
- Client withdrawal requests (amount, destination)
- Admin confirmations/rejections
- Amount adjustments

**What Platform Returns TO Telegram:**
- Order status updates
- Client balance after transaction
- Pending orders list

---

### 2. **CHATWOOT / MESSENGER INTEGRATION** (Client Signup & Support)
**Purpose:** Client onboarding, referral code entry, support conversations

**Endpoints:**
```
POST /api/clients/webhook/chatwoot
  Body: { contact_id, conversation_id, message_type, content }
  → Handles incoming messages, creates new clients
  
POST /api/clients/portal-session
  Body: { chatwoot_contact_id }
  → Creates magic link for portal access
  
GET /api/admin/settings/first-time-greeting
  → Returns greeting messages for first-time clients
```

**Flow:**
1. New user messages Messenger
2. Chatwoot webhook → Platform creates client record
3. Platform sends greeting messages (configurable in admin)
4. Platform asks for referral code
5. User enters code OR types SKIP
6. Platform links referral OR continues
7. Magic link sent for portal access

**What Chatwoot/Messenger Sends:**
- New contact info (name, ID)
- User messages (including referral code)
- Conversation context

**What Platform Returns:**
- Greeting messages
- Referral code prompts
- Magic link for portal
- AI responses (if enabled)

---

### 3. **GAME APIs INTEGRATION** (Load & Redeem)
**Purpose:** Create game accounts, load credits, redeem balances

**Endpoints for External Game Systems:**
```
POST /api/games/webhook/load-complete
  Body: { order_id, game_id, game_user_id, game_password, status }
  → Updates order when game load is complete
  
POST /api/games/webhook/redeem-complete  
  Body: { order_id, redeemed_amount, status }
  → Updates order when redeem is complete

POST /api/games/webhook/account-created
  Body: { client_id, game_id, game_user_id, game_password }
  → Stores game credentials for client
```

**Internal Endpoints (Platform → Game API):**
```
POST /api/admin/orders/{order_id}/process-load
  → Triggers external game API to load credits
  
POST /api/admin/orders/{order_id}/process-redeem
  → Triggers external game API to redeem balance
```

**What Game APIs Should Send:**
- Account creation confirmation (user_id, password)
- Load completion status
- Redeem completion with actual amount
- Error states

**What Platform Sends to Game APIs:**
- Load requests (game_id, amount, client credentials)
- Redeem requests (game_id, amount)
- Account creation requests

---

### 4. **AI TEST SPOT** (Internal Testing)
**Purpose:** Test AI responses before deploying to production

**Endpoints:**
```
POST /api/admin/test/ai-test/simulate
  Body: { messages: [...], test_scenario }
  → Returns GPT-4o response for testing
  
GET /api/admin/test/ai-test/info
  → Returns available scenarios and sample prompts
```

---

## 📊 Data Flow Diagrams

### **Deposit (Cash-In) Flow:**
```
User → Messenger → Chatwoot → Platform API → Create Order (PENDING)
                                    ↓
              Admin ← Telegram Bot ← Notification
                                    ↓
              Admin Confirms via Telegram/Panel
                                    ↓
              Platform → Update Ledger → Credit Balance
                                    ↓
              → Process Referral Commission (if applicable)
                                    ↓
              → Update Referral Stats → Check Tier Upgrade
```

### **Withdrawal (Cash-Out) Flow:**
```
User → Portal → Request Withdrawal → Create Order (PENDING)
                                    ↓
              Admin ← Telegram Bot ← Notification
                                    ↓
              Admin Confirms via Telegram/Panel
                                    ↓
              Platform → Update Ledger → Debit Balance
                                    ↓
              → Mark for Payout → Admin processes externally
```

### **Game Load Flow:**
```
User → Portal → Select Game + Amount → Create Load Order
                                    ↓
              Platform → Check Balance (Cash or Play Credits)
                                    ↓
              → Call External Game API (if configured)
                                    ↓
              Game API → Load Credits → Webhook Callback
                                    ↓
              Platform → Update Order Status → Debit Wallet
```

---

## 🗄️ Database Collections

### Core Collections:
| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `clients` | Player profiles | client_id, display_name, referral_code, balances |
| `ledger_transactions` | Immutable transaction log | type (IN/OUT/LOAD), amount, wallet_type, status |
| `orders` | All orders/requests | order_id, type, amount, status, game_id |
| `games` | Game catalog | game_id, name, availability_status, credentials |
| `game_credentials` | Per-client game logins | client_id, game_id, username, password |
| `referrals` | Referral relationships | referrer_id, referred_id, status, earnings |
| `global_settings` | Platform configuration | tiers, milestones, anti-fraud, greetings |
| `audit_logs` | Admin action history | admin_id, action, entity, timestamp |
| `ai_test_logs` | AI test conversations | admin_id, messages, response |

---

## ⚙️ Admin Settings (Configurable)

| Setting | Location | Purpose |
|---------|----------|---------|
| Commission Tiers | Settings → Tiers | 5%-30% based on active referrals |
| Active Referral Criteria | Settings → Active Referral | Define when referral is "active" |
| Bonus Milestones | Settings → Milestones | Bonus amounts at referral counts |
| First-Time Greeting | Settings → First Message | Messages for new clients |
| Anti-Fraud Rules | Settings → Anti-Fraud | IP limits, cooldowns, flags |
| Withdrawal Limits | Settings → General | Min/max withdrawal amounts |

---

## 🔐 Authentication Methods

| User Type | Auth Method | Token Type |
|-----------|-------------|------------|
| Admin | Email/Password | JWT (24hr expiry) |
| Client (Messenger) | Magic Link | Portal Token (24hr) |
| Client (Direct) | Username/Password | Client JWT (7 days) |
| Telegram Bot | API Secret Key | Header: X-Internal-API-Key |
| External Services | API Key | Header: X-API-Key |

---

## 📡 Webhook Setup Requirements

### For Telegram Bot:
```
Set webhook URL: https://your-domain.com/api/telegram/webhook
Required environment variables:
  - TELEGRAM_BOT_TOKEN
  - INTERNAL_API_SECRET
```

### For Chatwoot:
```
Set webhook URL: https://your-domain.com/api/clients/webhook/chatwoot
Configure in Chatwoot:
  - Inbox webhook
  - Message events: message_created, conversation_created
```

### For Game APIs:
```
Configure callbacks to:
  - POST /api/games/webhook/load-complete
  - POST /api/games/webhook/redeem-complete
  - POST /api/games/webhook/account-created
```

---

## 🔄 What External Systems Must Provide

### Telegram Bot Must Send:
1. **On Deposit Request:**
   - `client_id` (Chatwoot contact ID or internal ID)
   - `amount` (claimed deposit amount)
   - `payment_method` (GCash, PayMaya, etc.)
   - `reference_id` (payment reference if available)

2. **On Withdrawal Request:**
   - `client_id`
   - `amount`
   - `payout_method`
   - `payout_details` (account number, name)

3. **On Admin Action:**
   - `order_id`
   - `action` (confirm/reject/edit)
   - `new_amount` (if editing)
   - `reason` (if rejecting)

### Chatwoot/Messenger Must Send:
1. **New Contact:**
   - `contact_id`
   - `display_name`
   - `phone` (optional)
   - `email` (optional)

2. **Messages:**
   - `conversation_id`
   - `message_content`
   - `message_type` (text, image, etc.)

### Game APIs Must Send:
1. **Account Created:**
   - `client_id`
   - `game_id`
   - `game_username`
   - `game_password`

2. **Load Complete:**
   - `order_id`
   - `status` (success/failed)
   - `actual_amount_loaded`

3. **Redeem Complete:**
   - `order_id`
   - `status`
   - `redeemed_amount`

---

## 📱 Frontend Routes Summary

### Public (No Auth):
- `/games` - Public game catalog with downloads
- `/login` - Admin login
- `/client-login` - Client username/password login

### Client Portal (Auth Required):
- `/portal` - Dashboard (combined wallet, referral code)
- `/portal/wallets` - Detailed Cash + Play Credits view
- `/portal/referrals` - Referral program, tiers, list
- `/portal/bonus-tasks` - Freeplay task, milestones
- `/portal/load-game` - Load credits to games
- `/portal/withdrawals` - Request cash out
- `/portal/transactions` - Transaction history
- `/portal/credentials` - Game login credentials

### Admin (Admin Auth Required):
- `/admin` - Dashboard with stats
- `/admin/clients` - Client management
- `/admin/orders` - Order processing
- `/admin/games` - Game catalog management
- `/admin/payment-panel` - Manual payment verification
- `/admin/ai-test` - AI conversation testing
- `/admin/settings` - All platform settings
- `/admin/audit-logs` - Admin action history

---

## 🚀 Deployment Checklist

1. **Environment Variables:**
   ```
   MONGO_URL=mongodb://...
   JWT_SECRET_KEY=your-secret
   INTERNAL_API_SECRET=telegram-api-secret
   EMERGENT_LLM_KEY=sk-emergent-... (for AI)
   ```

2. **External Integrations:**
   - [ ] Configure Telegram bot webhook
   - [ ] Configure Chatwoot inbox webhook
   - [ ] Set up Game API callbacks
   - [ ] Configure admin greeting messages

3. **Security:**
   - [ ] Set strong JWT secret
   - [ ] Configure CORS for production domain
   - [ ] Enable anti-fraud settings
   - [ ] Set appropriate withdrawal limits
