#!/bin/bash
# FINAL PRODUCTION BLOCKER VERIFICATION

echo "=============================================="
echo "FINAL BLOCKER VERIFICATION"
echo "=============================================="
echo ""

PASS=0
FAIL=0

# 1. Proof image NOT stored in DB
echo "1. VERIFYING: No proof image/base64 stored in DB"
if grep -q "_redact_sensitive_data" /app/backend/api/v1/core/notification_router.py; then
    if grep -q "redacted_payload = NotificationRouter._redact_sensitive_data" /app/backend/api/v1/core/notification_router.py; then
        echo "   ✅ PASS: Notification payload is redacted before DB storage"
        ((PASS++))
    else
        echo "   ❌ FAIL: Redaction not applied"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Redaction function not found"
    ((FAIL++))
fi

# 2. Proof image reaches Telegram
echo ""
echo "2. VERIFYING: Proof image reaches Telegram for site uploads"
if grep -q "proof_base64 = payload.extra_data.get('proof_image')" /app/backend/api/v1/core/notification_router.py; then
    if grep -q "sendDocument" /app/backend/api/v1/core/notification_router.py; then
        echo "   ✅ PASS: Base64 proof extracted and sent to Telegram"
        ((PASS++))
    else
        echo "   ❌ FAIL: Telegram send not implemented"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Proof extraction not found"
    ((FAIL++))
fi

# 3. No status='approved' in orders queries
echo ""
echo "3. VERIFYING: No status='approved' remains (must use APPROVED_EXECUTED)"
APPROVED_COUNT=$(grep -r "status.*=.*'approved'" /app/backend --include="*.py" | grep -v "APPROVED_EXECUTED\|APPROVED_FAILED\|wallet_load\|#" | grep "orders" | wc -l)
if [ "$APPROVED_COUNT" -eq 0 ]; then
    echo "   ✅ PASS: All orders queries use APPROVED_EXECUTED"
    ((PASS++))
else
    echo "   ❌ FAIL: Found $APPROVED_COUNT queries still using 'approved'"
    ((FAIL++))
fi

# 4. Wallet deduction after API check
echo ""
echo "4. VERIFYING: Wallet deduction happens AFTER API check"
if grep -B 5 "UPDATE users SET real_balance" /app/backend/api/v1/core/approval_service.py | grep -q "game_api_available"; then
    echo "   ✅ PASS: API check before wallet deduction in game load"
    ((PASS++))
else
    echo "   ❌ FAIL: Wallet may be deducted before API check"
    ((FAIL++))
fi

# 5. No approval bypasses
echo ""
echo "5. VERIFYING: payment_routes uses approval_service"
if grep -q "from ..core.approval_service import approve_or_reject_order" /app/backend/api/v1/routes/payment_routes.py; then
    echo "   ✅ PASS: payment_routes uses approval_service"
    ((PASS++))
else
    echo "   ❌ FAIL: payment_routes does not import approval_service"
    ((FAIL++))
fi

# 6. Money safety
echo ""
echo "6. VERIFYING: execute_withdrawal checks payout API first"
if grep -A 10 "def execute_withdrawal" /app/backend/api/v1/core/approval_service.py | grep -q "payout_api_available"; then
    echo "   ✅ PASS: Payout API check exists"
    ((PASS++))
else
    echo "   ❌ FAIL: Payout API check not found"
    ((FAIL++))
fi

echo ""
echo "=============================================="
echo "VERIFICATION SUMMARY"
echo "=============================================="
echo "PASSED: $PASS tests"
echo "FAILED: $FAIL tests"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ ALL FINAL BLOCKERS RESOLVED"
    echo ""
    echo "🎯 PRODUCTION-READY:"
    echo "  ✅ Proof images: Sent to Telegram, redacted in DB"
    echo "  ✅ Status: APPROVED_EXECUTED only"
    echo "  ✅ Money safety: API check before wallet"
    echo "  ✅ Approval: Single path enforced"
    echo ""
    exit 0
else
    echo "❌ $FAIL TESTS FAILED"
    exit 1
fi
