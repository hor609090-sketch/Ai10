"""
Phase 2 Testing: Admin Order Management & Telegram Confirmation Flow
Tests for:
- Admin login flow
- Admin Orders page endpoints
- Order detail, edit, confirm, reject functionality
- Telegram API endpoints with internal API key authentication
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
INTERNAL_API_KEY = "internal-api-secret-key"

# Test credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"

# Test order ID from previous testing
TEST_ORDER_ID = "1a80f34a-9daf-4637-bd91-2a73d119801a"


class TestAdminAuthentication:
    """Admin login and authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful - User: {data['user']['email']}, Role: {data['user']['role']}")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")


class TestAdminOrdersEndpoints:
    """Admin Orders management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_orders_list(self):
        """Test fetching orders list"""
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=self.headers)
        assert response.status_code == 200, f"Failed to get orders: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Orders response should be a list"
        print(f"✓ Orders list retrieved - {len(data)} orders found")
        return data
    
    def test_get_orders_with_status_filter(self):
        """Test fetching orders with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders?status_filter=pending_confirmation",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get filtered orders: {response.text}"
        
        data = response.json()
        # All returned orders should have pending_confirmation status
        for order in data:
            assert order["status"] == "pending_confirmation", f"Order {order['order_id']} has wrong status"
        print(f"✓ Filtered orders retrieved - {len(data)} pending orders")
    
    def test_get_orders_with_type_filter(self):
        """Test fetching orders with type filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders?type_filter=load",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get filtered orders: {response.text}"
        
        data = response.json()
        for order in data:
            assert order["order_type"] == "load", f"Order {order['order_id']} has wrong type"
        print(f"✓ Type-filtered orders retrieved - {len(data)} load orders")
    
    def test_get_order_detail(self):
        """Test fetching order detail"""
        # First get an order ID from the list
        orders_response = requests.get(f"{BASE_URL}/api/admin/orders", headers=self.headers)
        orders = orders_response.json()
        
        if not orders:
            pytest.skip("No orders available for testing")
        
        order_id = orders[0]["order_id"]
        response = requests.get(f"{BASE_URL}/api/admin/orders/{order_id}", headers=self.headers)
        assert response.status_code == 200, f"Failed to get order detail: {response.text}"
        
        data = response.json()
        assert "order" in data, "No order in response"
        assert "client" in data, "No client info in response"
        assert "transaction" in data, "No transaction info in response"
        assert data["order"]["order_id"] == order_id
        print(f"✓ Order detail retrieved - Order ID: {order_id[:8]}...")
        print(f"  - Client: {data['client']['display_name'] if data['client'] else 'N/A'}")
        print(f"  - Amount: ${data['order']['amount']}")
        print(f"  - Status: {data['order']['status']}")
    
    def test_get_nonexistent_order(self):
        """Test fetching non-existent order"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/admin/orders/{fake_id}", headers=self.headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent order correctly returns 404")


class TestOrderEditConfirmReject:
    """Tests for order edit, confirm, and reject functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token and find a pending order"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def _get_pending_order(self):
        """Helper to get a pending order"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders?status_filter=pending_confirmation",
            headers=self.headers
        )
        orders = response.json()
        return orders[0] if orders else None
    
    def _create_test_order(self):
        """Create a test order via Telegram API for testing"""
        # First get a client
        clients_response = requests.get(f"{BASE_URL}/api/admin/clients", headers=self.headers)
        clients = clients_response.json()
        if not clients:
            return None
        
        client_id = clients[0]["client_id"]
        
        # Create a cash-in order via Telegram API
        telegram_headers = {"X-Internal-API-Key": INTERNAL_API_KEY}
        response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in",
            json={
                "client_id": client_id,
                "amount": 50.00,
                "game": "Test Game",
                "payment_method": "Test Payment"
            },
            headers=telegram_headers
        )
        
        if response.status_code == 200:
            return response.json()["order_id"]
        return None
    
    def test_edit_order_amount(self):
        """Test editing order amount"""
        pending_order = self._get_pending_order()
        
        if not pending_order:
            # Create a test order
            order_id = self._create_test_order()
            if not order_id:
                pytest.skip("No pending orders and couldn't create test order")
            pending_order = {"order_id": order_id, "amount": 50.00}
        
        order_id = pending_order["order_id"]
        original_amount = pending_order["amount"]
        new_amount = original_amount + 10.00
        
        response = requests.put(
            f"{BASE_URL}/api/admin/orders/{order_id}/edit",
            json={
                "new_amount": new_amount,
                "reason": "Test edit - adjusting amount"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to edit order: {response.text}"
        
        data = response.json()
        assert "new_amount" in data or "message" in data
        print(f"✓ Order amount edited - Original: ${original_amount}, New: ${new_amount}")
        
        # Verify the change persisted
        detail_response = requests.get(f"{BASE_URL}/api/admin/orders/{order_id}", headers=self.headers)
        detail = detail_response.json()
        assert detail["order"]["amount"] == new_amount, "Amount not updated in database"
        assert detail["order"].get("original_amount") == original_amount, "Original amount not stored"
        print(f"✓ Amount change verified in database")
    
    def test_edit_order_invalid_amount(self):
        """Test editing order with invalid amount"""
        pending_order = self._get_pending_order()
        if not pending_order:
            pytest.skip("No pending orders available")
        
        # Try to edit with negative amount via Telegram API (which has validation)
        telegram_headers = {"X-Internal-API-Key": INTERNAL_API_KEY}
        response = requests.put(
            f"{BASE_URL}/api/telegram/order/{pending_order['order_id']}/edit",
            json={
                "new_amount": -10.00,
                "reason": "Invalid test"
            },
            headers=telegram_headers
        )
        assert response.status_code == 400, f"Expected 400 for negative amount, got {response.status_code}"
        print("✓ Invalid amount correctly rejected")


class TestTelegramAPIEndpoints:
    """Tests for Telegram API endpoints with internal API key authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup headers with internal API key"""
        self.telegram_headers = {"X-Internal-API-Key": INTERNAL_API_KEY}
        
        # Get admin token for client lookup
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.admin_token = response.json()["access_token"]
            self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_telegram_api_without_key(self):
        """Test Telegram API rejects requests without API key"""
        response = requests.get(f"{BASE_URL}/api/telegram/pending-orders")
        assert response.status_code == 401, f"Expected 401 without API key, got {response.status_code}"
        print("✓ Telegram API correctly rejects requests without API key")
    
    def test_telegram_api_with_invalid_key(self):
        """Test Telegram API rejects requests with invalid API key"""
        response = requests.get(
            f"{BASE_URL}/api/telegram/pending-orders",
            headers={"X-Internal-API-Key": "wrong-key"}
        )
        assert response.status_code == 401, f"Expected 401 with invalid key, got {response.status_code}"
        print("✓ Telegram API correctly rejects invalid API key")
    
    def test_get_pending_orders(self):
        """Test getting pending orders via Telegram API"""
        response = requests.get(
            f"{BASE_URL}/api/telegram/pending-orders",
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to get pending orders: {response.text}"
        
        data = response.json()
        assert "orders" in data, "No orders field in response"
        assert "count" in data, "No count field in response"
        print(f"✓ Telegram pending orders retrieved - {data['count']} pending orders")
        return data
    
    def test_get_pending_orders_with_type_filter(self):
        """Test getting pending orders with type filter"""
        response = requests.get(
            f"{BASE_URL}/api/telegram/pending-orders?order_type=load",
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to get filtered orders: {response.text}"
        
        data = response.json()
        for order in data["orders"]:
            assert order["order_type"] == "load"
        print(f"✓ Telegram filtered orders retrieved - {data['count']} load orders")
    
    def test_get_order_detail_telegram(self):
        """Test getting order detail via Telegram API"""
        # First get a pending order
        pending_response = requests.get(
            f"{BASE_URL}/api/telegram/pending-orders",
            headers=self.telegram_headers
        )
        pending_data = pending_response.json()
        
        if not pending_data["orders"]:
            pytest.skip("No pending orders for testing")
        
        order_id = pending_data["orders"][0]["order_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/telegram/order/{order_id}",
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to get order detail: {response.text}"
        
        data = response.json()
        assert "order" in data
        assert "client" in data
        assert "transaction" in data
        print(f"✓ Telegram order detail retrieved - Order: {order_id[:8]}...")
    
    def test_edit_order_via_telegram(self):
        """Test editing order amount via Telegram API"""
        # Get a pending order
        pending_response = requests.get(
            f"{BASE_URL}/api/telegram/pending-orders",
            headers=self.telegram_headers
        )
        pending_data = pending_response.json()
        
        if not pending_data["orders"]:
            pytest.skip("No pending orders for testing")
        
        order = pending_data["orders"][0]
        order_id = order["order_id"]
        original_amount = order["amount"]
        new_amount = original_amount + 5.00
        
        response = requests.put(
            f"{BASE_URL}/api/telegram/order/{order_id}/edit",
            json={
                "new_amount": new_amount,
                "reason": "Telegram edit test",
                "edited_by": "test_telegram_admin"
            },
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to edit order: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["new_amount"] == new_amount
        assert data["original_amount"] == original_amount
        print(f"✓ Telegram order edit successful - ${original_amount} → ${new_amount}")
    
    def test_reject_order_via_telegram(self):
        """Test rejecting order via Telegram API"""
        # First create a new order to reject
        clients_response = requests.get(f"{BASE_URL}/api/admin/clients", headers=self.admin_headers)
        clients = clients_response.json()
        
        if not clients:
            pytest.skip("No clients available for testing")
        
        client_id = clients[0]["client_id"]
        
        # Create a cash-in order
        create_response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in",
            json={
                "client_id": client_id,
                "amount": 25.00,
                "game": "Test Game",
                "payment_method": "Test"
            },
            headers=self.telegram_headers
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test order")
        
        order_id = create_response.json()["order_id"]
        
        # Now reject it
        response = requests.post(
            f"{BASE_URL}/api/telegram/order/{order_id}/reject",
            json={
                "reason": "Test rejection via Telegram API",
                "rejected_by": "test_telegram_admin"
            },
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to reject order: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ Telegram order rejection successful - Order: {order_id[:8]}...")
        
        # Verify the order is now rejected
        detail_response = requests.get(
            f"{BASE_URL}/api/telegram/order/{order_id}",
            headers=self.telegram_headers
        )
        detail = detail_response.json()
        assert detail["order"]["status"] == "rejected"
        assert detail["transaction"]["status"] == "rejected"
        print("✓ Order and transaction status verified as rejected")


class TestCashInCashOutFlow:
    """Tests for cash-in and cash-out flows via Telegram API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup headers"""
        self.telegram_headers = {"X-Internal-API-Key": INTERNAL_API_KEY}
        
        # Get admin token for client lookup
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.admin_token = response.json()["access_token"]
            self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def _get_client_id(self):
        """Get a client ID for testing"""
        response = requests.get(f"{BASE_URL}/api/admin/clients", headers=self.admin_headers)
        clients = response.json()
        return clients[0]["client_id"] if clients else None
    
    def test_create_cash_in_order(self):
        """Test creating a cash-in (deposit) order"""
        client_id = self._get_client_id()
        if not client_id:
            pytest.skip("No clients available")
        
        response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in",
            json={
                "client_id": client_id,
                "amount": 100.00,
                "game": "Test Casino",
                "payment_method": "GCash",
                "screenshot_url": "https://example.com/screenshot.jpg"
            },
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to create cash-in: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "order_id" in data
        assert data["amount"] == 100.00
        assert data["status"] == "pending_confirmation"
        print(f"✓ Cash-in order created - Order: {data['order_id'][:8]}..., Amount: ${data['amount']}")
        return data["order_id"]
    
    def test_confirm_cash_in_order(self):
        """Test confirming a cash-in order"""
        client_id = self._get_client_id()
        if not client_id:
            pytest.skip("No clients available")
        
        # Create order first
        create_response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in",
            json={
                "client_id": client_id,
                "amount": 75.00,
                "game": "Test Game"
            },
            headers=self.telegram_headers
        )
        order_id = create_response.json()["order_id"]
        
        # Confirm it
        response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in/{order_id}/confirm",
            json={"confirmed_by": "test_admin"},
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to confirm cash-in: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["amount_credited"] == 75.00
        print(f"✓ Cash-in confirmed - Amount credited: ${data['amount_credited']}")
    
    def test_create_cash_out_order(self):
        """Test creating a cash-out (withdrawal) order"""
        client_id = self._get_client_id()
        if not client_id:
            pytest.skip("No clients available")
        
        # First add some balance via cash-in
        cashin_response = requests.post(
            f"{BASE_URL}/api/telegram/cash-in",
            json={
                "client_id": client_id,
                "amount": 200.00,
                "game": "Test"
            },
            headers=self.telegram_headers
        )
        cashin_order_id = cashin_response.json()["order_id"]
        
        # Confirm the cash-in
        requests.post(
            f"{BASE_URL}/api/telegram/cash-in/{cashin_order_id}/confirm",
            json={"confirmed_by": "test"},
            headers=self.telegram_headers
        )
        
        # Now try cash-out
        response = requests.post(
            f"{BASE_URL}/api/telegram/cash-out",
            json={
                "client_id": client_id,
                "amount": 50.00,
                "game": "Test",
                "payout_tag": "@testuser"
            },
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to create cash-out: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["amount"] == 50.00
        print(f"✓ Cash-out order created - Amount: ${data['amount']}, Payout: {data['payout_tag']}")
    
    def test_get_client_balance(self):
        """Test getting client balance via Telegram API"""
        client_id = self._get_client_id()
        if not client_id:
            pytest.skip("No clients available")
        
        response = requests.get(
            f"{BASE_URL}/api/telegram/client/{client_id}/balance",
            headers=self.telegram_headers
        )
        assert response.status_code == 200, f"Failed to get balance: {response.text}"
        
        data = response.json()
        assert "real_balance" in data
        assert "bonus_balance" in data
        assert "pending_in" in data
        assert "pending_out" in data
        print(f"✓ Client balance retrieved - Real: ${data['real_balance']}, Bonus: ${data['bonus_balance']}")


class TestAdminDashboardStats:
    """Test admin dashboard stats include order counts"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_dashboard_stats_include_orders(self):
        """Test dashboard stats include pending orders count"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats", headers=self.headers)
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "pending_orders" in data
        assert "pending_withdrawals" in data
        assert "pending_loads" in data
        print(f"✓ Dashboard stats retrieved:")
        print(f"  - Pending Orders: {data['pending_orders']}")
        print(f"  - Pending Withdrawals: {data['pending_withdrawals']}")
        print(f"  - Pending Loads: {data['pending_loads']}")
    
    def test_attention_required_items(self):
        """Test attention required endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/attention-required", headers=self.headers)
        assert response.status_code == 200, f"Failed to get attention items: {response.text}"
        
        data = response.json()
        assert "items" in data
        print(f"✓ Attention items retrieved - {len(data['items'])} items requiring attention")
        for item in data["items"]:
            print(f"  - {item['title']} ({item['priority']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
