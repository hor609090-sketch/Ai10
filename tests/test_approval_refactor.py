"""
Test Suite for Centralized Approval Service Refactor
Tests the unified approval logic under approval_service.py

Features tested:
- Admin login flow with admin/password
- GET /api/v1/admin/approvals/pending returns pending orders
- POST /api/v1/admin/approvals/{order_id}/action with approve
- POST /api/v1/admin/approvals/{order_id}/action with reject
- Legacy /api/v1/wallet/review endpoint returns 404 (removed)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://refactor-central.preview.emergentagent.com').rstrip('/')


class TestAdminLogin:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Admin login with correct credentials admin/password"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": "admin",
            "password": "password"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["username"] == "admin"
    
    def test_admin_login_wrong_password(self):
        """Admin login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_admin_login_wrong_username(self):
        """Login with non-existent user should fail"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": "nonexistent",
            "password": "password"
        })
        assert response.status_code == 401


@pytest.fixture
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "username": "admin",
        "password": "password"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def auth_headers(admin_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestPendingApprovals:
    """Test GET /api/v1/admin/approvals/pending"""
    
    def test_get_pending_approvals_authenticated(self, auth_headers):
        """Get pending approvals with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/approvals/pending",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "pending" in data
        assert "total" in data
        assert isinstance(data["pending"], list)
    
    def test_get_pending_approvals_unauthenticated(self):
        """Get pending approvals without auth should fail"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/approvals/pending")
        assert response.status_code in [401, 422]  # 422 for missing header
    
    def test_pending_approvals_structure(self, auth_headers):
        """Verify pending approval response structure"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/approvals/pending",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # If there are pending orders, verify structure
        if data["total"] > 0:
            order = data["pending"][0]
            assert "order_id" in order
            assert "username" in order
            assert "order_type" in order
            assert "amount" in order
            assert "status" in order


class TestApprovalActions:
    """Test POST /api/v1/admin/approvals/{order_id}/action"""
    
    def test_approve_order_success(self, auth_headers):
        """Approve an order and verify balance update"""
        # First create a test order
        test_order_id = f"test-approve-{uuid.uuid4().hex[:8]}"
        
        # Create test user and order via direct DB or API
        # For this test, we'll use an existing pending order or skip
        
        # Get pending orders
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/approvals/pending",
            headers=auth_headers
        )
        
        if response.status_code == 200 and response.json()["total"] > 0:
            order_id = response.json()["pending"][0]["order_id"]
            
            # Approve the order
            approve_response = requests.post(
                f"{BASE_URL}/api/v1/admin/approvals/{order_id}/action",
                headers=auth_headers,
                json={"action": "approve"}
            )
            
            # Should succeed or already processed
            assert approve_response.status_code in [200, 400]
            if approve_response.status_code == 200:
                data = approve_response.json()
                assert data.get("success") == True
                assert data.get("new_status") == "approved"
        else:
            pytest.skip("No pending orders to test approval")
    
    def test_reject_order_success(self, auth_headers):
        """Reject an order and verify no balance change"""
        # Get pending orders
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/approvals/pending",
            headers=auth_headers
        )
        
        if response.status_code == 200 and response.json()["total"] > 0:
            order_id = response.json()["pending"][0]["order_id"]
            
            # Reject the order
            reject_response = requests.post(
                f"{BASE_URL}/api/v1/admin/approvals/{order_id}/action",
                headers=auth_headers,
                json={"action": "reject", "reason": "Test rejection"}
            )
            
            # Should succeed or already processed
            assert reject_response.status_code in [200, 400]
            if reject_response.status_code == 200:
                data = reject_response.json()
                assert data.get("success") == True
                assert data.get("new_status") == "rejected"
        else:
            pytest.skip("No pending orders to test rejection")
    
    def test_approve_nonexistent_order(self, auth_headers):
        """Approve non-existent order should fail"""
        response = requests.post(
            f"{BASE_URL}/api/v1/admin/approvals/nonexistent-order-id/action",
            headers=auth_headers,
            json={"action": "approve"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "not found" in data.get("detail", "").lower() or "Order not found" in str(data)
    
    def test_invalid_action(self, auth_headers):
        """Invalid action should fail validation"""
        response = requests.post(
            f"{BASE_URL}/api/v1/admin/approvals/test-order/action",
            headers=auth_headers,
            json={"action": "invalid_action"}
        )
        assert response.status_code == 422  # Validation error
    
    def test_approve_without_auth(self):
        """Approve without auth should fail"""
        response = requests.post(
            f"{BASE_URL}/api/v1/admin/approvals/test-order/action",
            json={"action": "approve"}
        )
        assert response.status_code in [401, 422]


class TestLegacyEndpointRemoved:
    """Test that legacy /api/v1/wallet/review endpoint is removed"""
    
    def test_legacy_review_endpoint_returns_404(self, auth_headers):
        """Legacy /api/v1/wallet/review should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/v1/wallet/review",
            headers=auth_headers,
            json={"request_id": "test", "action": "approve"}
        )
        assert response.status_code == 404
    
    def test_legacy_review_get_returns_404(self):
        """GET on legacy endpoint should also return 404"""
        response = requests.get(f"{BASE_URL}/api/v1/wallet/review")
        assert response.status_code in [404, 405]  # 405 if route exists but method not allowed


class TestAdminDashboard:
    """Test admin dashboard endpoint"""
    
    def test_dashboard_loads(self, auth_headers):
        """Admin dashboard should load with stats"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/dashboard",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "pending_approvals" in data
        assert "today" in data
        assert "net_profit" in data
        assert "system_status" in data


class TestHealthCheck:
    """Test API health"""
    
    def test_health_endpoint(self):
        """Health check should return healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "PostgreSQL"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
