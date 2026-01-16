"""
Phase 5: Client-specific visibility settings and optional password authentication tests
Tests:
- Admin can update client visibility level via PUT /api/clients/{id}
- POST /api/portal/auth/login - client password login
- POST /api/portal/auth/setup-password - set up username/password
- GET /api/portal/auth/status - check if password auth is enabled
- Visibility level 'full' shows all data
- Visibility level 'summary' hides transaction details
- Visibility level 'hidden' shows minimal data
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_CLIENT_ID = "55532916-671e-4c0c-940b-50d848352870"

class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        
    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestClientVisibilityAdmin:
    """Admin client visibility update tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_update_visibility_to_full(self, admin_token):
        """Test updating client visibility to 'full'"""
        response = requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "full"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility_level"] == "full"
        
    def test_update_visibility_to_summary(self, admin_token):
        """Test updating client visibility to 'summary'"""
        response = requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "summary"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility_level"] == "summary"
        
    def test_update_visibility_to_hidden(self, admin_token):
        """Test updating client visibility to 'hidden'"""
        response = requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "hidden"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility_level"] == "hidden"
        
    def test_get_client_shows_visibility(self, admin_token):
        """Test that GET client returns visibility_level"""
        response = requests.get(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "visibility_level" in data
        assert data["visibility_level"] in ["full", "summary", "hidden"]


class TestClientPasswordAuth:
    """Client password authentication tests"""
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent username returns error"""
        response = requests.post(f"{BASE_URL}/api/portal/auth/login", json={
            "username": "nonexistent_user_xyz",
            "password": "somepassword"
        })
        assert response.status_code == 200  # Returns 200 with success=false
        data = response.json()
        assert data["success"] == False
        assert "Invalid" in data["message"] or "invalid" in data["message"].lower()
        
    def test_login_wrong_password(self):
        """Test login with wrong password returns error"""
        response = requests.post(f"{BASE_URL}/api/portal/auth/login", json={
            "username": "testuser",
            "password": "wrongpassword"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False


class TestPasswordSetupAndLogin:
    """Test password setup and login flow (requires portal token)"""
    
    @pytest.fixture
    def portal_token(self):
        """Get a portal token for the test client"""
        # Use internal API to create portal session
        response = requests.post(
            f"{BASE_URL}/api/clients/portal-session",
            json={"client_id": TEST_CLIENT_ID},
            headers={"X-Internal-Api-Key": "internal-api-secret-key"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create portal session")
    
    def test_auth_status_without_password(self, portal_token):
        """Test auth status endpoint returns password_auth_enabled status"""
        response = requests.get(
            f"{BASE_URL}/api/portal/auth/status",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "password_auth_enabled" in data
        assert isinstance(data["password_auth_enabled"], bool)
        
    def test_setup_password_success(self, portal_token):
        """Test setting up password for client"""
        test_username = f"testclient_{int(time.time())}"
        response = requests.post(
            f"{BASE_URL}/api/portal/auth/setup-password",
            json={
                "username": test_username,
                "password": "testpass123"
            },
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["username"] == test_username.lower()
        
        # Verify we can now login with password
        login_response = requests.post(f"{BASE_URL}/api/portal/auth/login", json={
            "username": test_username,
            "password": "testpass123"
        })
        assert login_response.status_code == 200
        login_data = login_response.json()
        assert login_data["success"] == True
        assert "access_token" in login_data
        assert login_data["client_id"] == TEST_CLIENT_ID
        
    def test_setup_password_short_username(self, portal_token):
        """Test that short username is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/portal/auth/setup-password",
            json={
                "username": "ab",  # Too short
                "password": "testpass123"
            },
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 422  # Validation error
        
    def test_setup_password_short_password(self, portal_token):
        """Test that short password is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/portal/auth/setup-password",
            json={
                "username": "validusername",
                "password": "12345"  # Too short
            },
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 422  # Validation error


class TestVisibilityLevelEffects:
    """Test that visibility levels affect portal data correctly"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    @pytest.fixture
    def portal_token(self):
        """Get a portal token for the test client"""
        response = requests.post(
            f"{BASE_URL}/api/clients/portal-session",
            json={"client_id": TEST_CLIENT_ID},
            headers={"X-Internal-Api-Key": "internal-api-secret-key"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create portal session")
    
    def test_full_visibility_shows_all_data(self, admin_token, portal_token):
        """Test that 'full' visibility shows all dashboard data"""
        # Set visibility to full
        requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "full"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get dashboard
        response = requests.get(
            f"{BASE_URL}/api/portal/dashboard",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Full visibility should show all data
        assert "wallet" in data
        assert "overview" in data
        assert data.get("visibility_level") == "full"
        # Should have detailed wallet info
        wallet = data.get("wallet", {})
        assert "real_balance" in wallet
        assert "total_in" in wallet or wallet.get("total_in") is not None
        
    def test_summary_visibility_hides_transactions(self, admin_token, portal_token):
        """Test that 'summary' visibility hides transaction details"""
        # Set visibility to summary
        requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "summary"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get dashboard
        response = requests.get(
            f"{BASE_URL}/api/portal/dashboard",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Summary visibility should hide recent_transactions
        assert data.get("visibility_level") == "summary"
        assert data.get("recent_transactions") == []  # Empty in summary mode
        
        # Get transactions endpoint - should return empty
        tx_response = requests.get(
            f"{BASE_URL}/api/portal/transactions",
            headers={"X-Portal-Token": portal_token}
        )
        assert tx_response.status_code == 200
        assert tx_response.json() == []  # Empty for summary visibility
        
    def test_hidden_visibility_shows_minimal(self, admin_token, portal_token):
        """Test that 'hidden' visibility shows minimal data"""
        # Set visibility to hidden
        requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "hidden"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get dashboard
        response = requests.get(
            f"{BASE_URL}/api/portal/dashboard",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Hidden visibility should show restricted message
        assert data.get("visibility_restricted") == True
        assert "message" in data
        
    def test_credentials_hidden_for_non_full(self, admin_token, portal_token):
        """Test that credentials are hidden for non-full visibility"""
        # Set visibility to summary
        requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "summary"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get credentials
        response = requests.get(
            f"{BASE_URL}/api/portal/credentials",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 200
        assert response.json() == []  # Empty for non-full visibility
        
    def test_wallets_forbidden_for_hidden(self, admin_token, portal_token):
        """Test that wallet details are forbidden for hidden visibility"""
        # Set visibility to hidden
        requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "hidden"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Get wallets
        response = requests.get(
            f"{BASE_URL}/api/portal/wallets",
            headers={"X-Portal-Token": portal_token}
        )
        assert response.status_code == 403  # Forbidden for hidden visibility


class TestJWTClientAuth:
    """Test JWT-based client authentication (after password setup)"""
    
    @pytest.fixture
    def client_jwt(self):
        """Get client JWT token via password login"""
        # First ensure we have a password set up
        portal_response = requests.post(
            f"{BASE_URL}/api/clients/portal-session",
            json={"client_id": TEST_CLIENT_ID},
            headers={"X-Internal-Api-Key": "internal-api-secret-key"}
        )
        if portal_response.status_code != 200:
            pytest.skip("Could not create portal session")
            
        portal_token = portal_response.json()["token"]
        
        # Set up password
        test_username = f"jwttest_{int(time.time())}"
        setup_response = requests.post(
            f"{BASE_URL}/api/portal/auth/setup-password",
            json={
                "username": test_username,
                "password": "jwtpass123"
            },
            headers={"X-Portal-Token": portal_token}
        )
        
        if setup_response.status_code != 200:
            pytest.skip("Could not set up password")
            
        # Login with password
        login_response = requests.post(f"{BASE_URL}/api/portal/auth/login", json={
            "username": test_username,
            "password": "jwtpass123"
        })
        
        if login_response.status_code == 200 and login_response.json().get("success"):
            return login_response.json()["access_token"]
        pytest.skip("Could not login with password")
    
    def test_jwt_auth_for_dashboard(self, client_jwt):
        """Test that JWT auth works for dashboard endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/portal/dashboard",
            headers={"Authorization": f"Bearer {client_jwt}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "wallet" in data
        
    def test_jwt_auth_for_profile(self, client_jwt):
        """Test that JWT auth works for profile endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/portal/me",
            headers={"Authorization": f"Bearer {client_jwt}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["client_id"] == TEST_CLIENT_ID
        
    def test_jwt_auth_for_auth_status(self, client_jwt):
        """Test that JWT auth works for auth status endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/portal/auth/status",
            headers={"Authorization": f"Bearer {client_jwt}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["password_auth_enabled"] == True


class TestCleanup:
    """Cleanup tests - reset visibility to full"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")
    
    def test_reset_visibility_to_full(self, admin_token):
        """Reset client visibility to full after tests"""
        response = requests.put(
            f"{BASE_URL}/api/clients/{TEST_CLIENT_ID}",
            json={"visibility_level": "full"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["visibility_level"] == "full"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
