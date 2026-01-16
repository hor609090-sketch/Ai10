"""
Admin API Tests for Gaming Transaction Portal
Tests admin authentication, dashboard, games, clients, webhooks, and API keys endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["username"] == "admin"
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


class TestAdminDashboard:
    """Admin dashboard endpoint tests"""
    
    def test_dashboard_loads(self, admin_token):
        """Test admin dashboard returns data"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pending_approvals" in data
        assert "today" in data
        assert "net_profit" in data
        assert "active_clients" in data
        assert "system_status" in data
    
    def test_dashboard_unauthorized(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/dashboard")
        assert response.status_code in [401, 422]


class TestAdminGames:
    """Admin games management tests"""
    
    def test_list_games(self, admin_token):
        """Test listing all games"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "games" in data
        assert isinstance(data["games"], list)
        # Verify game structure
        if len(data["games"]) > 0:
            game = data["games"][0]
            assert "game_id" in game
            assert "game_name" in game
            assert "display_name" in game
            assert "is_active" in game


class TestAdminClients:
    """Admin clients management tests"""
    
    def test_list_clients(self, admin_token):
        """Test listing all clients"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "total" in data
        assert isinstance(data["clients"], list)


class TestAdminApprovals:
    """Admin approvals endpoint tests"""
    
    def test_pending_approvals(self, admin_token):
        """Test getting pending approvals"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/approvals/pending",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pending" in data
        assert "total" in data


class TestAdminSystemWebhooks:
    """Admin system webhooks tests"""
    
    def test_list_webhooks(self, admin_token):
        """Test listing webhooks"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/system/webhooks",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "webhooks" in data
        assert isinstance(data["webhooks"], list)
    
    def test_create_webhook(self, admin_token):
        """Test creating a webhook"""
        webhook_data = {
            "name": "TEST_webhook",
            "url": "https://example.com/webhook",
            "events": ["deposit.approved", "withdrawal.approved"],
            "enabled": True
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/admin/system/webhooks",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=webhook_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "webhook_id" in data
        
        # Cleanup - delete the test webhook
        webhook_id = data["webhook_id"]
        requests.delete(
            f"{BASE_URL}/api/v1/admin/system/webhooks/{webhook_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestAdminSystemAPIKeys:
    """Admin system API keys tests"""
    
    def test_list_api_keys(self, admin_token):
        """Test listing API keys"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/system/api-keys",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "api_keys" in data
        assert isinstance(data["api_keys"], list)
    
    def test_create_api_key(self, admin_token):
        """Test creating an API key"""
        key_data = {
            "name": "TEST_api_key",
            "scopes": ["read:orders", "read:users"]
        }
        response = requests.post(
            f"{BASE_URL}/api/v1/admin/system/api-keys",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Content-Type": "application/json"
            },
            json=key_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "key_id" in data
        assert "api_key" in data  # Key shown only once
        
        # Cleanup - revoke the test API key
        key_id = data["key_id"]
        requests.delete(
            f"{BASE_URL}/api/v1/admin/system/api-keys/{key_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestAdminSettings:
    """Admin settings and system config tests"""
    
    def test_get_settings(self, admin_token):
        """Test getting admin settings"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Settings should have various config options
        assert isinstance(data, dict)
    
    def test_get_system_config(self, admin_token):
        """Test getting system configuration"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/system",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "kill_switch" in data
        assert "integrations" in data
        assert "features" in data


class TestAdminRules:
    """Admin rules endpoint tests"""
    
    def test_get_rules(self, admin_token):
        """Test getting global rules"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/rules",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "global_defaults" in data


class TestAdminReferrals:
    """Admin referrals endpoint tests"""
    
    def test_referral_dashboard(self, admin_token):
        """Test referral dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/referrals/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        assert "top_referrers" in data


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
