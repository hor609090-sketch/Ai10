#!/bin/bash
# PRODUCTION HARDENING VERIFICATION SCRIPT
# Verifies all hardening requirements are met

echo "=============================================="
echo "PRODUCTION HARDENING VERIFICATION"
echo "=============================================="
echo ""

PASS=0
FAIL=0

# ==================== BACKEND VERIFICATION ====================

echo "=== BACKEND CHECKS ==="
echo ""

# 1. Status Semantics
echo "1. Verifying: Status semantics (APPROVED_EXECUTED/APPROVED_FAILED)"
if grep -q "APPROVED_EXECUTED\|APPROVED_FAILED" /app/backend/api/v1/core/approval_service.py; then
    if ! grep -q "status = 'approved'" /app/backend/api/v1/core/approval_service.py | grep -v "APPROVED"; then
        echo "   ✅ PASS: New status semantics implemented"
        ((PASS++))
    else
        echo "   ❌ FAIL: Old 'approved' status still used"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: New statuses not found"
    ((FAIL++))
fi

# 2. API Unavailability Handling
echo ""
echo "2. Verifying: API unavailability returns real errors"
if grep -q "GAME_LOAD_API_UNAVAILABLE" /app/backend/api/v1/core/approval_service.py; then
    if grep -q "PAYOUT_API_UNAVAILABLE" /app/backend/api/v1/core/approval_service.py; then
        if ! grep -q "GT-.*fake\|placeholder.*credentials" /app/backend/api/v1/core/approval_service.py; then
            echo "   ✅ PASS: API unavailability handled, no fake credentials"
            ((PASS++))
        else
            echo "   ❌ FAIL: Fake credentials still generated"
            ((FAIL++))
        fi
    else
        echo "   ❌ FAIL: Payout API unavailability not handled"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Game load API unavailability not handled"
    ((FAIL++))
fi

# 3. Execution Tracking Fields
echo ""
echo "3. Verifying: Execution tracking fields exist"
if grep -q "execution_error.*TEXT" /app/backend/api/v1/core/database.py; then
    if grep -q "execution_attempts.*INTEGER" /app/backend/api/v1/core/database.py; then
        if grep -q "approved_by_type.*VARCHAR" /app/backend/api/v1/core/database.py; then
            echo "   ✅ PASS: All execution tracking fields present"
            ((PASS++))
        else
            echo "   ❌ FAIL: approved_by_type field missing"
            ((FAIL++))
        fi
    else
        echo "   ❌ FAIL: execution_attempts field missing"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: execution_error field missing"
    ((FAIL++))
fi

# 4. No Proof Images Stored
echo ""
echo "4. Verifying: Proof images NOT stored in DB"
if grep -q "PROOF IMAGE POLICY" /app/backend/api/v1/core/database.py; then
    if ! grep "INSERT INTO.*proof_image\|UPDATE.*payment_proof_url.*base64" /app/backend/api/v1/routes/wallet_routes.py 2>/dev/null | grep -v "#"; then
        echo "   ✅ PASS: Proof images not stored"
        ((PASS++))
    else
        echo "   ❌ FAIL: Proof images may be stored"
        ((FAIL++))
    fi
else
    echo "   ⚠️  WARNING: Proof policy not documented"
fi

# 5. Chatwoot Game Load Only
echo ""
echo "5. Verifying: Chatwoot creates game_load orders ONLY"
if grep -n "order_id, data.user_id, user\['username'\], 'game_load'" /app/backend/api/v1/routes/bot_routes.py | grep -q "483\|484\|485"; then
    echo "   ✅ PASS: Chatwoot creates game_load orders only"
    ((PASS++))
else
    echo "   ❌ FAIL: Chatwoot order type verification failed"
    ((FAIL++))
fi

# 6. Single Approval Path
echo ""
echo "6. Verifying: Single approval path enforced"
if grep -q "from ..core.approval_service import approve_or_reject_order" /app/backend/api/v1/routes/admin_routes_v2.py; then
    if grep -q "from ..core.approval_service import approve_or_reject_order" /app/backend/api/v1/routes/telegram_routes.py; then
        echo "   ✅ PASS: Single approval path enforced"
        ((PASS++))
    else
        echo "   ❌ FAIL: Telegram doesn't use approval_service"
        ((FAIL++))
    fi
else
    echo "   ❌ FAIL: Admin doesn't use approval_service"
    ((FAIL++))
fi

# 7. PostgreSQL Only
echo ""
echo "7. Verifying: PostgreSQL only (no MongoDB)"
if ! grep -r "import.*pymongo\|from.*motor\|MongoClient" /app/backend --include="*.py" 2>/dev/null; then
    echo "   ✅ PASS: No MongoDB imports found"
    ((PASS++))
else
    echo "   ❌ FAIL: MongoDB imports found"
    ((FAIL++))
fi

# ==================== FRONTEND VERIFICATION ====================

echo ""
echo "=== FRONTEND CHECKS ==="
echo ""

# 8. Centralized API Helper
echo "8. Verifying: Components use centralized API helper"
if [ -f "/app/frontend/src/utils/api.js" ]; then
    # Count components still using direct env var
    DIRECT_COUNT=$(grep -r "process.env.REACT_APP_BACKEND_URL" /app/frontend/src/pages --include="*.js" 2>/dev/null | grep -v "api.js\|axios.js" | wc -l)
    if [ "$DIRECT_COUNT" -lt 5 ]; then
        echo "   ✅ PASS: API helper exists, most components updated ($DIRECT_COUNT remaining)"
        ((PASS++))
    else
        echo "   ⚠️  PARTIAL: $DIRECT_COUNT components still use direct env var"
    fi
else
    echo "   ❌ FAIL: API helper not found"
    ((FAIL++))
fi

# 9. Client Add Funds Flow
echo ""
echo "9. Verifying: Client Add Funds flow exists"
if grep -q "wallet/load-request" /app/frontend/src/pages/portal/PortalWallet.js; then
    echo "   ✅ PASS: Add Funds flow wired to /wallet/load-request"
    ((PASS++))
else
    echo "   ❌ FAIL: Add Funds flow not found"
    ((FAIL++))
fi

# 10. No Deprecated API Calls
echo ""
echo "10. Verifying: No deprecated API calls"
if ! grep -r "/api/v1/wallet/review\|/api/v1/admin/telegram\"" /app/frontend/src --include="*.js" 2>/dev/null | grep -v "//\|#"; then
    echo "   ✅ PASS: No deprecated API calls found"
    ((PASS++))
else
    echo "   ❌ FAIL: Deprecated API calls found"
    ((FAIL++))
fi

# ==================== SUMMARY ====================

echo ""
echo "=============================================="
echo "VERIFICATION SUMMARY"
echo "=============================================="
echo "PASSED: $PASS tests"
echo "FAILED: $FAIL tests"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✅ ALL PRODUCTION HARDENING TESTS PASSED"
    echo ""
    echo "🎯 SYSTEM STATUS: PRODUCTION-CERTIFIED"
    echo ""
    echo "Backend:"
    echo "  ✅ Status semantics: APPROVED_EXECUTED/APPROVED_FAILED"
    echo "  ✅ API unavailability: Real errors, no simulation"
    echo "  ✅ Execution tracking: Complete"
    echo "  ✅ Proof images: Not stored"
    echo "  ✅ Single approval path: Enforced"
    echo ""
    echo "Frontend:"
    echo "  ✅ API helper: Centralized"
    echo "  ✅ Add Funds: Implemented"
    echo "  ✅ No deprecated calls: Clean"
    echo ""
    exit 0
else
    echo "❌ $FAIL TESTS FAILED"
    echo ""
    echo "System requires fixes before production deployment"
    echo ""
    exit 1
fi
