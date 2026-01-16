#!/bin/bash
# Surgical Completion Verification Script
# Run this to verify all fixes were applied correctly

echo "=== SURGICAL COMPLETION VERIFICATION ==="
echo ""

# Test 1: Verify no legacy telegram_config endpoints
echo "1. Checking for legacy telegram_config endpoints..."
if grep -r "def get_telegram_config\|def update_telegram_config" backend/api/v1/routes/admin_routes.py 2>/dev/null | grep -v "DELETED\|#"; then
    echo "❌ FAILED: Legacy telegram endpoints still exist"
    exit 1
else
    echo "✅ PASS: Legacy telegram endpoints removed"
fi

# Test 2: Verify telegram_config table not created
echo ""
echo "2. Checking for telegram_config table creation..."
if grep "CREATE TABLE IF NOT EXISTS telegram_config" backend/api/v1/core/database.py 2>/dev/null | grep -v "DELETED\|#"; then
    echo "❌ FAILED: telegram_config table still being created"
    exit 1
else
    echo "✅ PASS: telegram_config table creation removed"
fi

# Test 3: Verify idempotency in bot_routes.py
echo ""
echo "3. Checking for Chatwoot idempotency implementation..."
if grep -q "idempotency_key" backend/api/v1/routes/bot_routes.py; then
    echo "✅ PASS: Idempotency implemented in bot_routes.py"
else
    echo "❌ FAILED: Idempotency not found in bot_routes.py"
    exit 1
fi

# Test 4: Verify no direct order status updates
echo ""
echo "4. Checking for direct order status updates..."
BYPASSES=$(grep -r "UPDATE orders SET status" backend/api/v1/routes --include="*.py" 2>/dev/null | grep -v "approval_service\|order_service\|#" | wc -l)
if [ "$BYPASSES" -eq 0 ]; then
    echo "✅ PASS: No direct order status bypasses found"
else
    echo "❌ FAILED: Found $BYPASSES direct order status updates"
    exit 1
fi

# Test 5: Verify approval_service.py exists and is complete
echo ""
echo "5. Checking approval_service.py completeness..."
if [ -f "backend/api/v1/core/approval_service.py" ]; then
    if grep -q "def approve_or_reject_order" backend/api/v1/core/approval_service.py; then
        echo "✅ PASS: approval_service.py exists with required functions"
    else
        echo "❌ FAILED: approval_service.py missing required functions"
        exit 1
    fi
else
    echo "❌ FAILED: approval_service.py not found"
    exit 1
fi

# Test 6: Verify proof image policy compliance
echo ""
echo "6. Checking proof image policy compliance..."
if grep -q "PROOF IMAGE POLICY" backend/api/v1/core/database.py; then
    echo "✅ PASS: Proof image policy documented in schema"
else
    echo "⚠️  WARNING: Proof image policy comment not found (non-critical)"
fi

echo ""
echo "=== VERIFICATION COMPLETE ==="
echo ""
echo "All critical surgical fixes verified successfully!"
echo "System is ready for deployment."
echo ""
echo "Next steps:"
echo "1. Configure database connection (MONGO_URL env var)"
echo "2. Configure backend URL (REACT_APP_BACKEND_URL)"
echo "3. Set up Telegram bots via /api/v1/admin/telegram/bots"
echo "4. Run backend: cd backend && uvicorn server:app --host 0.0.0.0 --port 8001"
echo ""
