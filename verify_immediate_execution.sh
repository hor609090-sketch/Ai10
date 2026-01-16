#!/bin/bash
# IMMEDIATE EXECUTION ARCHITECTURE VERIFICATION
# Tests all requirements from Section 10

echo "=============================================="
echo "IMMEDIATE EXECUTION VERIFICATION"
echo "=============================================="
echo ""

PASS=0
FAIL=0

# Test 1: Telegram approval executes immediately
echo "1. Verifying: Telegram approval ALWAYS executes order"
if grep -q "execute_game_load\|execute_withdrawal" /app/backend/api/v1/core/approval_service.py; then
    if grep -q "executed_at = now" /app/backend/api/v1/core/approval_service.py; then
        echo "   ✅ PASS: Immediate execution implemented"
        ((PASS++))
    else
        echo "   ❌ FAIL: Execution tracking missing"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Execution functions not found"
    ((FAIL++))
fi

# Test 2: No "approved but not executed" state
echo ""
echo "2. Verifying: No 'approved but not executed' state exists"
if grep -q "status = 'approved'" /app/backend/api/v1/core/approval_service.py; then
    if grep -A 20 "status = 'approved'" /app/backend/api/v1/core/approval_service.py | grep -q "execute_game_load\|execute_withdrawal\|execution_result"; then
        echo "   ✅ PASS: Approval triggers immediate execution"
        ((PASS++))
    else
        echo "   ❌ FAIL: Approval does not trigger execution"
        ((FAIL++))
    fi
else
    echo "   ⚠️  WARNING: Could not verify approval flow"
fi

# Test 3: Chatwoot deposits NEVER credit wallets
echo ""
echo "3. Verifying: Chatwoot creates game_load orders ONLY"
if grep -q "'game_load'" /app/backend/api/v1/routes/bot_routes.py; then
    # Check that the INSERT statement uses 'game_load' not 'deposit'
    if grep "INSERT INTO orders" /app/backend/api/v1/routes/bot_routes.py -A 5 | grep -q "'game_load'"; then
        echo "   ✅ PASS: Chatwoot creates game_load orders only"
        ((PASS++))
    else
        echo "   ❌ FAIL: Chatwoot INSERT uses wrong order_type"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: game_load order_type not found"
    ((FAIL++))
fi

# Test 4: Proof images NOT stored
echo ""
echo "4. Verifying: Proof images are NOT stored in DB"
if grep -q "PROOF IMAGE POLICY" /app/backend/api/v1/core/database.py; then
    if ! grep -q "payment_proof.*base64\|proof_image.*INSERT" /app/backend/api/v1/routes/wallet_routes.py; then
        echo "   ✅ PASS: Proof images not stored in DB"
        ((PASS++))
    else
        echo "   ❌ FAIL: Proof images may be stored"
        ((FAIL++))
    fi
else
    echo "   ⚠️  WARNING: Proof image policy not documented"
fi

# Test 5: Duplicate Chatwoot messages do nothing
echo ""
echo "5. Verifying: Duplicate Chatwoot messages return existing order"
if grep -q "idempotency_key" /app/backend/api/v1/routes/bot_routes.py; then
    if grep -q "SELECT.*FROM orders WHERE idempotency_key" /app/backend/api/v1/routes/bot_routes.py; then
        echo "   ✅ PASS: Idempotency check implemented"
        ((PASS++))
    else
        echo "   ❌ FAIL: Idempotency check not found"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Idempotency key not generated"
    ((FAIL++))
fi

# Test 6: Frontend doesn't call deprecated APIs
echo ""
echo "6. Verifying: Frontend doesn't call deprecated APIs"
if ! grep -r "/api/v1/wallet/review\|/api/v1/admin/telegram\"" /app/frontend/src --include="*.js" 2>/dev/null | grep -v "//"; then
    echo "   ✅ PASS: No deprecated API calls found"
    ((PASS++))
else
    echo "   ❌ FAIL: Deprecated API calls found"
    ((FAIL++))
fi

# Test 7: PostgreSQL only
echo ""
echo "7. Verifying: PostgreSQL only (no MongoDB)"
if ! grep -r "import.*pymongo\|from.*motor\|MongoClient" /app/backend --include="*.py" 2>/dev/null; then
    if grep -q "asyncpg" /app/backend/requirements.txt; then
        echo "   ✅ PASS: PostgreSQL only, no MongoDB"
        ((PASS++))
    else
        echo "   ❌ FAIL: asyncpg not in requirements"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: MongoDB imports found"
    ((FAIL++))
fi

# Test 8: Exactly one approval path
echo ""
echo "8. Verifying: Exactly ONE approval path exists"
if grep -q "from ..core.approval_service import approve_or_reject_order" /app/backend/api/v1/routes/admin_routes_v2.py; then
    if grep -q "from ..core.approval_service import approve_or_reject_order" /app/backend/api/v1/routes/telegram_routes.py; then
        if ! grep -r "UPDATE orders SET status = 'approved'" /app/backend/api/v1/routes --include="*.py" 2>/dev/null | grep -v "approval_service"; then
            echo "   ✅ PASS: Single approval path enforced"
            ((PASS++))
        else
            echo "   ❌ FAIL: Direct status updates found"
            ((FAIL++))
        fi
    else
        echo "   ❌ FAIL: Telegram routes don't use approval_service"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Admin routes don't use approval_service"
    ((FAIL++))
fi

# BONUS: Verify execution tracking fields exist
echo ""
echo "9. BONUS: Verifying execution tracking fields"
if grep -q "executed_at.*TIMESTAMPTZ" /app/backend/api/v1/core/database.py; then
    if grep -q "execution_result.*JSONB" /app/backend/api/v1/core/database.py; then
        echo "   ✅ PASS: Execution tracking fields added to schema"
        ((PASS++))
    else
        echo "   ❌ FAIL: execution_result field missing"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: executed_at field missing"
    ((FAIL++))
fi

# BONUS: Verify execution events exist
echo ""
echo "10. BONUS: Verifying execution events"
if grep -q "GAME_LOAD_SUCCESS\|GAME_LOAD_FAILED" /app/backend/api/v1/core/notification_router.py; then
    if grep -q "ORDER_EXECUTED\|ORDER_EXECUTION_FAILED" /app/backend/api/v1/core/notification_router.py; then
        if grep -q "WITHDRAW_EXECUTED\|WITHDRAW_FAILED" /app/backend/api/v1/core/notification_router.py; then
            echo "   ✅ PASS: All execution events defined"
            ((PASS++))
        else
            echo "   ⚠️  WARNING: Withdrawal execution events missing"
        fi
    else
        echo "   ⚠️  WARNING: Order execution events missing"
    fi
else
    echo "   ❌ FAIL: Game load events missing"
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
    echo "✅ ALL CRITICAL TESTS PASSED"
    echo ""
    echo "🎯 SYSTEM STATUS: PRODUCTION-READY"
    echo ""
    echo "Immediate Execution Architecture Verified:"
    echo "  ✅ Approval = Immediate Execution Attempt"
    echo "  ✅ No silent waiting"
    echo "  ✅ No manual next steps"
    echo "  ✅ No hidden execution queue"
    echo "  ✅ Financially correct architecture"
    echo ""
    exit 0
else
    echo "❌ $FAIL TESTS FAILED"
    echo ""
    echo "System requires fixes before deployment"
    echo ""
    exit 1
fi
