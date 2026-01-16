# Gaming Platform API v1 Documentation

## Overview

The Gaming Platform API v1 provides endpoints for both Admin Panel management and Client Portal functionality.

**Base URL**: `/api/v1`

**Authentication**: Bearer JWT Token
- Header: `Authorization: Bearer <token>`
- For Client Portal, also accepts: `X-Portal-Token: <session_token>`

---

## Section 1: Admin UI Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/password |
| POST | `/auth/signup` | Register new user |
| POST | `/auth/validate-token` | Validate JWT token |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Get dashboard overview stats |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/approvals/pending` | Get pending approvals list |
| POST | `/admin/approvals/{order_id}/action` | Approve or reject an order |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/orders` | List all orders with filters |
| GET | `/admin/orders/{order_id}` | Get order details |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/clients` | List clients with search/filters |
| POST | `/admin/clients` | Create new client |
| GET | `/admin/clients/{user_id}` | Get client detail |
| PUT | `/admin/clients/{user_id}` | Update client |
| GET | `/admin/clients/{user_id}/overrides` | Get client overrides |
| PUT | `/admin/clients/{user_id}/overrides` | Update client overrides |
| GET | `/admin/clients/{user_id}/activity` | Get client activity timeline |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/games` | List all games with analytics |
| PUT | `/admin/games/{game_id}` | Update game config |

### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/rules` | Get global rules/defaults |
| PUT | `/admin/rules` | Update global rules |

### Referrals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/referrals/dashboard` | Referral system overview |
| GET | `/admin/referrals/ledger` | List all referral relationships |

### Promo Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/promo-codes` | List all promo codes |
| POST | `/admin/promo-codes` | Create promo code |
| PUT | `/admin/promo-codes/{code_id}/disable` | Disable promo code |
| GET | `/admin/promo-codes/{code_id}/redemptions` | View redemption history |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/reports/balance-flow` | Balance flow report |
| GET | `/admin/reports/profit-by-game` | Profit breakdown by game |
| GET | `/admin/reports/voids` | Void report |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit-logs` | Get audit logs |

---

## Section 2: Admin System Endpoints

**Prefix**: `/api/v1/admin/system`

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/system/webhooks` | List all webhooks |
| POST | `/admin/system/webhooks` | Create new webhook |
| PUT | `/admin/system/webhooks/{webhook_id}` | Update webhook |
| DELETE | `/admin/system/webhooks/{webhook_id}` | Delete webhook |
| GET | `/admin/system/webhooks/{webhook_id}/deliveries` | Get webhook delivery history |

### API Keys
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/system/api-keys` | List all API keys |
| POST | `/admin/system/api-keys` | Generate new API key |
| DELETE | `/admin/system/api-keys/{key_id}` | Revoke API key |

### Payment Methods
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/system/payment-methods` | List payment methods |
| POST | `/admin/system/payment-methods` | Create payment method |
| PUT | `/admin/system/payment-methods/{method_id}` | Update payment method |
| DELETE | `/admin/system/payment-methods/{method_id}` | Delete payment method |

---

## Section 3: Client Portal Endpoints

**Prefix**: `/api/v1/portal`

### Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/wallet/breakdown` | Get wallet overview with locked/withdrawable amounts |
| GET | `/portal/wallet/bonus-progress` | Get bonus progress tracker |
| GET | `/portal/wallet/cashout-preview` | Preview cashout calculation |

#### Response: `/portal/wallet/breakdown`
```json
{
  "overview": {
    "cash_balance": 100.00,
    "bonus_balance": 20.00,
    "play_credits": 10.00,
    "total_balance": 130.00,
    "locked_amount": 30.00,
    "withdrawable_amount": 100.00,
    "pending_withdrawal": 0.00,
    "withdraw_locked": false
  },
  "totals": {
    "total_deposited": 500.00,
    "total_withdrawn": 200.00
  }
}
```

### Promo Codes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/portal/promo/redeem` | Redeem a promo code |
| GET | `/portal/promo/history` | Get redemption history |

#### Request: `/portal/promo/redeem`
```json
{
  "code": "WELCOME10"
}
```

### Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/rewards` | Get granted rewards list |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/transactions/enhanced` | Get enhanced transaction list |

Query params:
- `type_filter`: `deposit`, `withdrawal`, or empty for all
- `limit`: max number of results (default: 50)

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/games/rules` | Get games with deposit/cashout rules |

### Referrals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/portal/referrals/details` | Get referral program details |

#### Response: `/portal/referrals/details`
```json
{
  "referral_code": "USER1234",
  "commission": {
    "current_percentage": 10,
    "max_percentage": 30,
    "is_lifetime": true
  },
  "tier": {
    "current": {"tier": 1, "name": "Bronze", "commission": 10},
    "next": {"tier": 2, "name": "Silver", "commission": 15}
  },
  "earnings": {
    "pending": 25.00,
    "confirmed": 150.00,
    "total": 175.00
  },
  "stats": {
    "active_referrals": 15,
    "total_referrals": 20
  }
}
```

---

## Section 4: Bot API Endpoints

**Prefix**: `/api/v1/bot`

### Internal Endpoints (Require `X-Bot-Secret` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bot/user/register` | Register new user from bot |
| POST | `/bot/order/deposit/create` | Create deposit order |
| POST | `/bot/order/withdrawal/create` | Create withdrawal order |
| GET | `/bot/user/{user_id}/balance` | Get user balance |

---

## Section 5: Analytics Endpoints

**Prefix**: `/api/v1/analytics`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/risk-snapshot` | Get risk and exposure metrics |
| GET | `/analytics/platform-trends` | Get platform performance trends |
| GET | `/analytics/client/{user_id}` | Get client-level analytics |

---

## Error Codes

| Code | Description |
|------|-------------|
| E1001 | User not found |
| E1002 | Invalid credentials |
| E2001 | Authentication required |
| E2002 | Invalid token |
| E3001 | Order not found |
| E3002 | Invalid order status |
| E4001 | Withdrawal blocked |
| E4002 | Insufficient balance |
| E5001 | Internal server error |

---

## Notes

### Frontend Environment
- Required env variable: `REACT_APP_BACKEND_URL`
- Default fallback: `http://localhost:8001`

### CORS
- All origins are allowed in development
- Credentials are supported

### Rate Limiting
- Default: 100 requests per minute per IP
- Admin endpoints: 200 requests per minute
