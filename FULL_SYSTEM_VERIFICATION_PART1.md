# FULL SYSTEM DISCOVERY & VERIFICATION REPORT
**Generated:** 2026-01-16  
**Task:** Post-Surgical Complete System Verification  
**Scope:** ALL features, flows, routes, and UI actions

---

## EXECUTIVE SUMMARY

**Total Backend Routes Discovered:** 95+  
**Total Frontend Pages Discovered:** 42  
**Total Database Tables:** 28  
**Verification Status:** IN PROGRESS

---

## PART A: BACKEND ROUTE INVENTORY

### A.1 Admin Routes (39 endpoints)

#### **admin_routes.py** (Legacy - 18 endpoints)
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/admin/stats` | get_admin_stats | Admin | ⚠️ Legacy |
| GET | `/admin/clients` | list_clients | Admin | ⚠️ Duplicate |
| GET | `/admin/clients/{user_id}` | get_client | Admin | ⚠️ Duplicate |
| PUT | `/admin/clients/{user_id}/bonus` | update_client_bonus | Admin | ⚠️ Check usage |
| GET | `/admin/orders` | list_orders | Admin | ⚠️ Duplicate |
| GET | `/admin/orders/{order_id}` | get_order_admin | Admin | ⚠️ Duplicate |
| GET | `/admin/perks` | list_perks | Admin | ✅ Active |
| POST | `/admin/perks` | create_perk | Admin | ✅ Active |
| PUT | `/admin/perks/{perk_id}` | update_perk | Admin | ✅ Active |
| DELETE | `/admin/perks/{perk_id}` | delete_perk | Admin | ✅ Active |
| GET | `/admin/rules` | list_rules | Admin | ⚠️ Duplicate |
| POST | `/admin/rules` | create_rule | Admin | ⚠️ Check usage |
| DELETE | `/admin/rules/{rule_id}` | delete_rule | Admin | ⚠️ Check usage |
| GET | `/admin/settings` | get_system_settings | Admin | ⚠️ Duplicate |
| PUT | `/admin/settings` | update_system_settings | Admin | ⚠️ Duplicate |
| GET | `/admin/games` | list_games_admin | Admin | ⚠️ Duplicate |
| PUT | `/admin/games/{game_id}` | update_game_rules | Admin | ⚠️ Check usage |
| GET | `/admin/audit-logs` | get_audit_logs | Admin | ⚠️ Duplicate |

#### **admin_routes_v2.py** (Main - 29 endpoints + 3 legacy shims)
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/admin/dashboard` | get_dashboard | Admin | ✅ PRIMARY |
| GET | `/admin/approvals/pending` | get_pending_approvals | Admin | ✅ PRIMARY |
| POST | `/admin/approvals/{order_id}/action` | process_approval | Admin | 🔒 CRITICAL |
| GET | `/admin/orders` | list_orders | Admin | ✅ PRIMARY |
| GET | `/admin/orders/{order_id}` | get_order_detail | Admin | ✅ PRIMARY |
| POST | `/admin/clients` | create_client | Admin | ✅ PRIMARY |
| GET | `/admin/clients` | list_clients | Admin | ✅ PRIMARY |
| GET | `/admin/clients/{user_id}` | get_client_detail | Admin | ✅ PRIMARY |
| PUT | `/admin/clients/{user_id}` | update_client | Admin | ✅ PRIMARY |
| PUT | `/admin/clients/{user_id}/overrides` | update_client_overrides | Admin | ✅ PRIMARY |
| GET | `/admin/clients/{user_id}/overrides` | get_client_overrides | Admin | ✅ PRIMARY |
| GET | `/admin/clients/{user_id}/activity` | get_client_activity | Admin | ✅ PRIMARY |
| POST | `/admin/clients/{user_id}/credentials` | add_client_credentials | Admin | ✅ PRIMARY |
| GET | `/admin/games` | list_games | Admin | ✅ PRIMARY |
| POST | `/admin/games` | create_game | Admin | ✅ PRIMARY |
| PUT | `/admin/games/{game_id}` | update_game_config | Admin | ✅ PRIMARY |
| GET | `/admin/rules` | get_global_rules | Admin | ✅ PRIMARY |
| PUT | `/admin/rules` | update_global_rules | Admin | ✅ PRIMARY |
| GET | `/admin/referrals/dashboard` | get_referral_dashboard | Admin | ✅ PRIMARY |
| GET | `/admin/referrals/ledger` | get_referral_ledger | Admin | ✅ PRIMARY |
| GET | `/admin/promo-codes` | list_promo_codes | Admin | ✅ PRIMARY |
| POST | `/admin/promo-codes` | create_promo_code | Admin | ✅ PRIMARY |
| PUT | `/admin/promo-codes/{code_id}/disable` | disable_promo_code | Admin | ✅ PRIMARY |
| GET | `/admin/promo-codes/{code_id}/redemptions` | get_promo_redemptions | Admin | ✅ PRIMARY |
| GET | `/admin/reports/balance-flow` | get_balance_flow_report | Admin | ✅ PRIMARY |
| GET | `/admin/reports/profit-by-game` | get_profit_by_game | Admin | ✅ PRIMARY |
| GET | `/admin/reports/voids` | get_void_report | Admin | ✅ PRIMARY |
| GET | `/admin/system` | get_system_config | Admin | ✅ PRIMARY |
| PUT | `/admin/system` | update_system_config | Admin | ✅ PRIMARY |
| GET | `/admin/audit-logs` | get_audit_logs | Admin | ✅ PRIMARY |

**⚠️ FINDING:** Duplicate routes between admin_routes.py and admin_routes_v2.py

### A.2 Admin System Routes (16 endpoints)

#### **admin_system_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/admin/system/webhooks` | list_admin_webhooks | Admin | ✅ Active |
| POST | `/admin/system/webhooks` | create_admin_webhook | Admin | ✅ Active |
| PUT | `/admin/system/webhooks/{webhook_id}` | update_admin_webhook | Admin | ✅ Active |
| DELETE | `/admin/system/webhooks/{webhook_id}` | delete_admin_webhook | Admin | ✅ Active |
| GET | `/admin/system/webhooks/{webhook_id}/deliveries` | get_webhook_deliveries | Admin | ✅ Active |
| GET | `/admin/system/api-keys` | list_api_keys | Admin | ✅ Active |
| POST | `/admin/system/api-keys` | create_api_key | Admin | ✅ Active |
| DELETE | `/admin/system/api-keys/{key_id}` | delete_api_key | Admin | ✅ Active |
| GET | `/admin/system/payment-methods` | list_payment_methods | Admin | ✅ Active |
| POST | `/admin/system/payment-methods` | create_payment_method | Admin | ✅ Active |
| PUT | `/admin/system/payment-methods/{method_id}` | update_payment_method | Admin | ✅ Active |
| DELETE | `/admin/system/payment-methods/{method_id}` | delete_payment_method | Admin | ✅ Active |
| GET | `/admin/system/payment-qr` | list_payment_qr | Admin | ✅ Active |
| POST | `/admin/system/payment-qr` | create_payment_qr | Admin | ✅ Active |
| PATCH | `/admin/system/payment-qr/{qr_id}` | update_payment_qr | Admin | ✅ Active |
| DELETE | `/admin/system/payment-qr/{qr_id}` | delete_payment_qr | Admin | ✅ Active |
| GET | `/admin/system/wallet-loads` | list_wallet_load_requests | Admin | ✅ Active |
| GET | `/admin/system/wallet-loads/{request_id}` | get_wallet_load_detail | Admin | ✅ Active |

### A.3 Telegram Routes (12 endpoints)

#### **telegram_routes.py**
| Method | Endpoint | Function | Auth | Critical | Status |
|--------|----------|----------|------|----------|--------|
| GET | `/admin/telegram/bots` | list_bots | Admin | Yes | ✅ Active |
| POST | `/admin/telegram/bots` | create_bot | Admin | Yes | ✅ Active |
| PUT | `/admin/telegram/bots/{bot_id}` | update_bot | Admin | Yes | ✅ Active |
| DELETE | `/admin/telegram/bots/{bot_id}` | delete_bot | Admin | Yes | ✅ Active |
| GET | `/admin/telegram/events` | list_event_types | Admin | No | ✅ Active |
| POST | `/admin/telegram/bots/{bot_id}/permissions` | update_bot_permissions | Admin | Yes | ✅ Active |
| GET | `/admin/telegram/bots/{bot_id}/permissions` | get_bot_permissions | Admin | Yes | ✅ Active |
| GET | `/admin/telegram/logs` | get_notification_logs | Admin | No | ✅ Active |
| POST | `/admin/telegram/bots/{bot_id}/test` | test_bot_notification | Admin | No | ✅ Active |
| POST | `/admin/telegram/webhook` | telegram_webhook | **Public** | **YES** | 🔒 SECURE |
| POST | `/admin/telegram/setup-webhook` | setup_webhook | Admin | Yes | ✅ Active |
| GET | `/admin/telegram/webhook-info` | get_webhook_info | Admin | No | ✅ Active |

**🔒 CRITICAL:** Webhook endpoint correctly implements secure callback handling

### A.4 Portal Routes (12 endpoints)

#### **portal_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/portal/wallet/breakdown` | get_wallet_breakdown | Client | ✅ Active |
| GET | `/portal/wallet/bonus-progress` | get_bonus_progress | Client | ✅ Active |
| GET | `/portal/wallet/cashout-preview` | get_cashout_preview | Client | ✅ Active |
| POST | `/portal/promo/redeem` | redeem_promo_code | Client | ✅ Active |
| GET | `/portal/promo/history` | get_promo_history | Client | ✅ Active |
| GET | `/portal/rewards` | get_client_rewards | Client | ✅ Active |
| GET | `/portal/transactions/enhanced` | get_enhanced_transactions | Client | ✅ Active |
| GET | `/portal/games/rules` | get_games_with_rules | Client | ✅ Active |
| GET | `/portal/referrals/details` | get_referral_details | Client | ✅ Active |
| GET | `/portal/credentials` | get_client_credentials | Client | ✅ Active |
| POST | `/portal/security/set-password` | set_client_password | Client | ✅ Active |

### A.5 Wallet Routes (6 endpoints)

#### **wallet_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/wallet/qr` | get_payment_qr | Client | ✅ Active |
| POST | `/wallet/load-request` | create_wallet_load_request | Client | 🔒 CRITICAL |
| GET | `/wallet/load-status/{request_id}` | get_wallet_load_status | Client | ✅ Active |
| GET | `/wallet/load-history` | get_wallet_load_history | Client | ✅ Active |
| GET | `/wallet/balance` | get_wallet_balance | Client | ✅ Active |
| GET | `/wallet/ledger` | get_wallet_ledger | Client | ✅ Active |

**🔒 CRITICAL:** Wallet load request correctly implements idempotency and proof handling

### A.6 Game Routes (4 endpoints)

#### **game_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/games/available` | get_available_games | Client | ✅ Active |
| POST | `/games/load` | load_game_from_wallet | Client | 🔒 CRITICAL |
| GET | `/games/load-history` | get_game_load_history | Client | ✅ Active |
| GET | `/games/{game_id}` | get_game_details | Public | ✅ Active |

**🔒 CRITICAL:** Game load must use wallet balance ONLY (not Chatwoot deposits)

### A.7 Analytics Routes (6 endpoints)

#### **analytics_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/admin/analytics/risk-snapshot` | get_risk_snapshot | Admin | ✅ Active |
| GET | `/admin/analytics/platform-trends` | get_platform_trends | Admin | ✅ Active |
| GET | `/admin/analytics/risk-exposure` | get_risk_exposure | Admin | ✅ Active |
| GET | `/admin/analytics/client/{user_id}` | get_client_analytics | Admin | ✅ Active |
| GET | `/admin/analytics/game/{game_name}` | get_game_analytics | Admin | ✅ Active |
| GET | `/admin/analytics/advanced-metrics` | get_advanced_metrics | Admin | ✅ Active |

### A.8 Bot Routes (1 endpoint + auth/order endpoints)

#### **bot_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/bot/payment-methods` | get_bot_payment_methods | Bot Token | ✅ Active |
| POST | `/bot/auth/token` | get_bot_token | Bot Secret | ✅ Active |
| POST | `/bot/orders/validate` | validate_order_bot | Bot Token | ✅ Active |
| POST | `/bot/orders/create` | create_order_bot | Bot Token | 🔒 CRITICAL |
| POST | `/bot/orders/{order_id}/payment-proof` | upload_payment_proof_bot | Bot Token | ✅ Active |
| GET | `/bot/orders/{order_id}` | get_order | Bot Token | ✅ Active |
| GET | `/bot/balance/{user_id}` | get_balance | Bot Token | ✅ Active |
| GET | `/bot/games` | list_games | Public | ✅ Active |

**🔒 CRITICAL:** Bot order creation must implement Chatwoot idempotency

### A.9 Reward Routes (8 endpoints)

#### **reward_routes.py**
| Method | Endpoint | Function | Auth | Status |
|--------|----------|----------|------|--------|
| GET | `/admin/rewards` | list_rewards | Admin | ✅ Active |
| POST | `/admin/rewards` | create_reward | Admin | ✅ Active |
| GET | `/admin/rewards/{reward_id}` | get_reward | Admin | ✅ Active |
| PUT | `/admin/rewards/{reward_id}` | update_reward | Admin | ✅ Active |
| DELETE | `/admin/rewards/{reward_id}` | delete_reward | Admin | ✅ Active |
| POST | `/admin/rewards/grant` | grant_reward_manually | Admin | ✅ Active |
| GET | `/admin/rewards/grants/history` | get_grant_history | Admin | ✅ Active |
| POST | `/admin/rewards/trigger/{trigger_type}` | trigger_reward | Admin | ✅ Active |

---

## PART B: DATABASE SCHEMA

### B.1 Discovered Tables (28 total)

| Table | Purpose | Critical | Status |
|-------|---------|----------|--------|
| **users** | User accounts, balances, roles | YES | ✅ Active |
| **user_identities** | FB/Chatwoot identity linking | YES | ✅ Active |
| **magic_links** | Magic link auth tokens | NO | ✅ Active |
| **sessions** | User sessions | NO | ✅ Active |
| **games** | Game catalog | YES | ✅ Active |
| **rules** | Deposit/withdrawal rules | YES | ✅ Active |
| **referral_perks** | Referral bonus config | NO | ✅ Active |
| **promo_codes** | Promo code definitions | NO | ✅ Active |
| **promo_redemptions** | Redemption history | NO | ✅ Active |
| **admin_webhooks** | Webhook registrations | NO | ✅ Active |
| **api_keys** | API key management | NO | ✅ Active |
| **payment_methods** | Payment method config | YES | ✅ Active |
| **client_overrides** | Per-client rule overrides | NO | ✅ Active |
| **orders** | All order types | **CRITICAL** | ✅ Active |
| **webhooks** | Webhook config | NO | ✅ Active |
| **webhook_deliveries** | Webhook delivery logs | NO | ✅ Active |
| **system_settings** | Global settings | YES | ✅ Active |
| **audit_logs** | Audit trail | YES | ✅ Active |
| **reward_definitions** | Reward configs | NO | ✅ Active |
| **reward_grants** | Reward grant history | NO | ✅ Active |
| **portal_sessions** | Portal session tokens | YES | ✅ Active |
| **payment_qr** | QR code config | YES | ✅ Active |
| **wallet_load_requests** | Wallet load requests | **CRITICAL** | ✅ Active |
| **wallet_ledger** | Immutable wallet log | **CRITICAL** | ✅ Active |
| **game_loads** | Game load history | YES | ✅ Active |
| **telegram_bots** | Multi-bot config | **CRITICAL** | ✅ Active |
| **telegram_bot_event_permissions** | Bot event permissions | **CRITICAL** | ✅ Active |
| **notification_logs** | Notification delivery logs | YES | ✅ Active |

**✅ VERIFIED:** No `telegram_config` table found (legacy deleted)

---

## PART C: FRONTEND PAGE INVENTORY

### C.1 Admin Pages (23 pages)

| Page | Route | API Calls | Status |
|------|-------|-----------|--------|
| AdminDashboard.js | `/admin/dashboard` | `/admin/dashboard` | ✅ |
| AdminApprovals.js | `/admin/approvals` | `/admin/approvals/pending`, `/admin/approvals/{id}/action` | 🔒 CRITICAL |
| AdminClients.js | `/admin/clients` | `/admin/clients` | ✅ |
| AdminClientDetail.js | `/admin/clients/:id` | `/admin/clients/{id}`, `/admin/clients/{id}/overrides`, `/admin/clients/{id}/activity` | ✅ |
| AdminClientCreate.js | `/admin/clients/new` | `/admin/clients` POST | ✅ |
| AdminOrders.js | `/admin/orders` | `/admin/orders`, `/admin/orders/{id}` | ✅ |
| AdminGames.js | `/admin/games` | `/admin/games` | ✅ |
| AdminRulesEngine.js | `/admin/rules` | `/admin/rules` | ✅ |
| AdminReferrals.js | `/admin/referrals` | `/admin/referrals/dashboard`, `/admin/referrals/ledger` | ✅ |
| AdminPromoCodes.js | `/admin/promo-codes` | `/admin/promo-codes` | ✅ |
| AdminReports.js | `/admin/reports` | `/admin/reports/*` | ✅ |
| AdminSystem.js | `/admin/system` | `/admin/system` | ✅ |
| AdminAuditLogs.js | `/admin/audit-logs` | `/admin/audit-logs` | ✅ |
| AdminSettings.js | `/admin/settings` | `/admin/settings` | ✅ |
| TelegramBots.js | `/admin/system/telegram` | `/admin/telegram/bots` | 🔒 CRITICAL |
| SystemWebhooks.js | `/admin/system/webhooks` | `/admin/system/webhooks` | ✅ |
| SystemAPIAccess.js | `/admin/system/api-access` | `/admin/system/api-keys` | ✅ |
| AdminPaymentQR.js | `/admin/system/payment-qr` | `/admin/system/payment-qr` | ✅ |
| AdminWalletLoads.js | `/admin/system/wallet-loads` | `/admin/system/wallet-loads` | ✅ |
| AdminRewards.js | `/admin/system/rewards` | `/admin/rewards` | ✅ |
| SystemDocumentation.js | `/admin/system/docs` | Static | ✅ |
| AdminOperationsPanel.js | `/admin/operations` | Unknown | ⚠️ CHECK |
| AdminPaymentPanel.js | `/admin/payment-panel` | Unknown | ⚠️ CHECK |
| AdminPerksPage.js | `/admin/perks` | `/admin/perks` | ✅ |
| AdminAITestSpot.js | `/admin/ai-test` | Unknown | ⚠️ CHECK |

### C.2 Client Portal Pages (13 pages)

| Page | Route | API Calls | Status |
|------|-------|-----------|--------|
| ClientLogin.js | `/client-login` | `/auth/login` | ✅ |
| PortalDashboard.js | `/portal` | `/portal/wallet/breakdown` | ✅ |
| PortalWallet.js | `/portal/wallet` | `/portal/wallet/breakdown`, `/portal/wallet/bonus-progress`, `/portal/promo/redeem` | ✅ |
| PortalTransactions.js | `/portal/transactions` | `/portal/transactions/enhanced` | ✅ |
| PortalWithdrawals.js | `/portal/withdrawals` | `/portal/wallet/cashout-preview` | ✅ |
| PortalReferrals.js | `/portal/referrals` | `/portal/referrals/details` | ✅ |
| PortalRewards.js | `/portal/rewards` | `/portal/rewards` | ✅ |
| PortalCredentials.js | `/portal/credentials` | `/portal/credentials` | ✅ |
| PortalSecuritySettings.js | `/portal/security` | `/portal/security/set-password` | ✅ |
| PortalLoadGame.js | `/portal/load-game` | Unknown | ⚠️ CHECK |
| PortalLanding.js | `/portal/landing` | Unknown | ⚠️ CHECK |
| PortalBonusTasks.js | `/portal/bonus-tasks` | Unknown | ⚠️ CHECK |
| PortalWallets.js | `/portal/wallets` | Unknown | ⚠️ DUPLICATE? |

### C.3 Public Pages (3 pages)

| Page | Route | API Calls | Status |
|------|-------|-----------|--------|
| Login.js | `/login` | `/auth/login` | ✅ |
| Register.js | `/register` | `/auth/signup` | ✅ |
| PublicGames.js | `/games` | `/games/available` | ✅ |

---

## PART D: CRITICAL FLOW VERIFICATION

**Status: READY FOR EXECUTION**

Next step: Execute and verify each flow end-to-end.

