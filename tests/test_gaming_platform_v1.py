"""
Gaming Platform API v1 - Comprehensive Test Suite
Tests for:
- Admin login with username 'admin' and password 'admin123'
- Admin Dashboard stats (Total Users, Total Games, Total Orders)
- Rules Engine - Global Settings (Signup Bonus, Deposit Bonus, Referral Bonus, Cashout Multipliers, Deposit Block Balance)
- Rules Engine - Per-Game Rules (game list, deposit/withdrawal limits, bonus rules per game)
- Rules Engine - Per-Client Overrides (client search, bonus override, lock settings)
- Saving Global Settings via Save button
- Deposit validation API with rules engine: POST /api/v1/orders/deposit/validate
- Withdrawal validation API with rules engine: POST /api/v1/orders/withdrawal/validate
- Admin Settings API: GET /api/v1/admin/settings
- Admin Games API: GET /api/v1/admin/games
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://refactor-central.preview.emergentagent.com').rstrip('/')

# Module-level token cache
_admin_token_cache = None


def get_admin_token():
    """Get admin JWT token (cached)"""
    global _admin_token_cache
    if _admin_token_cache:
        return _admin_token_cache
        
    magic_response = requests.post(f"{BASE_URL}/api/v1/auth/magic-link/request", json={
        "username": "admin",
        "password": "admin123"
    })
    if magic_response.status_code != 200:
        return None
    magic_link = magic_response.json()["magic_link"]
    token = magic_link.split("token=")[1]
    
    consume_response = requests.get(f"{BASE_URL}/api/v1/auth/magic-link/consume?token={token}")
    if consume_response.status_code != 200:
        return None
    
    _admin_token_cache = consume_response.json().get("access_token")
    return _admin_token_cache


@pytest.fixture(scope="module")
def admin_token():
    """Module-scoped admin token fixture"""
    token = get_admin_token()
    if not token:
        pytest.skip("Could not obtain admin token")
    return token


class TestAdminAuthentication:
    """Test admin login with username 'admin' and password 'admin123'"""
    
    def test_admin_magic_link_request(self):
        """Test admin can request magic link with username/password"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/magic-link/request", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "magic_link" in data
        assert "token=" in data["magic_link"]
        
    def test_admin_magic_link_consume(self):
        """Test admin can consume magic link to get JWT"""
        # Request magic link
        magic_response = requests.post(f"{BASE_URL}/api/v1/auth/magic-link/request", json={
            "username": "admin",
            "password": "admin123"
        })
        assert magic_response.status_code == 200
        magic_link = magic_response.json()["magic_link"]
        token = magic_link.split("token=")[1]
        
        # Consume magic link
        consume_response = requests.get(f"{BASE_URL}/api/v1/auth/magic-link/consume?token={token}")
        assert consume_response.status_code == 200
        data = consume_response.json()
        assert data["success"] == True
        assert "access_token" in data
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"
        
    def test_admin_login_invalid_password(self):
        """Test admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/magic-link/request", json={
            "username": "admin",
            "password": "wrongpassword"
        })
        assert response.status_code == 401 or (response.status_code == 200 and response.json().get("success") == False)


class TestAdminDashboardStats:
    """Test Admin Dashboard showing correct stats"""
    
    def test_admin_stats_endpoint(self, admin_token):
        """Test GET /api/v1/admin/stats returns dashboard statistics"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify required stats fields
        assert "total_users" in data
        assert "total_orders" in data
        assert "pending_orders" in data
        assert "total_volume" in data
        assert "total_bonus_distributed" in data
        assert "recent_orders" in data
        
        # Verify data types
        assert isinstance(data["total_users"], int)
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["pending_orders"], int)
        
    def test_admin_stats_requires_auth(self):
        """Test admin stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/stats")
        assert response.status_code in [401, 403, 422]


class TestAdminGamesAPI:
    """Test Admin Games API: GET /api/v1/admin/games"""
    
    def test_admin_games_list(self, admin_token):
        """Test GET /api/v1/admin/games returns games with rules"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list of games
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify game structure
        game = data[0]
        assert "game_id" in game
        assert "game_name" in game
        assert "display_name" in game
        assert "min_deposit_amount" in game
        assert "max_deposit_amount" in game
        assert "min_withdrawal_amount" in game
        assert "max_withdrawal_amount" in game
        assert "bonus_rules" in game
        assert "is_active" in game
        
    def test_admin_games_requires_auth(self):
        """Test admin games endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/games")
        assert response.status_code in [401, 403, 422]


class TestAdminSettingsAPI:
    """Test Admin Settings API: GET /api/v1/admin/settings"""
    
    def test_admin_settings_get(self, admin_token):
        """Test GET /api/v1/admin/settings returns global settings"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify Rules Engine settings
        assert "signup_bonus" in data
        assert "default_deposit_bonus" in data
        assert "default_referral_bonus" in data
        assert "deposit_block_balance" in data
        assert "min_cashout_multiplier" in data
        assert "max_cashout_multiplier" in data
        
        # Verify approval settings
        assert "auto_approve_deposits" in data
        assert "auto_approve_withdrawals" in data
        assert "manual_verification" in data
        
        # Verify feature toggles
        assert "bonus_system_enabled" in data
        assert "referral_system_enabled" in data
        
    def test_admin_settings_update(self, admin_token):
        """Test PUT /api/v1/admin/settings updates global settings"""
        # Get current settings
        get_response = requests.get(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        original_settings = get_response.json()
        
        # Update settings
        update_response = requests.put(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "signup_bonus": 15.0,
                "default_deposit_bonus": 8.0,
                "default_referral_bonus": 6.0
            }
        )
        assert update_response.status_code == 200
        assert update_response.json()["success"] == True
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        updated_data = verify_response.json()
        assert updated_data["signup_bonus"] == 15.0
        assert updated_data["default_deposit_bonus"] == 8.0
        assert updated_data["default_referral_bonus"] == 6.0
        
        # Restore original settings
        requests.put(
            f"{BASE_URL}/api/v1/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "signup_bonus": original_settings.get("signup_bonus", 0),
                "default_deposit_bonus": original_settings.get("default_deposit_bonus", 0),
                "default_referral_bonus": original_settings.get("default_referral_bonus", 5)
            }
        )
        
    def test_admin_settings_requires_auth(self):
        """Test admin settings endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/settings")
        assert response.status_code in [401, 403, 422]


class TestRulesEnginePerGameRules:
    """Test Rules Engine - Per-Game Rules"""
    
    def test_update_game_rules(self, admin_token):
        """Test PUT /api/v1/admin/games/{game_id} updates game rules"""
        # Get games list
        games_response = requests.get(
            f"{BASE_URL}/api/v1/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        games = games_response.json()
        assert len(games) > 0
        
        game = games[0]
        game_id = game["game_id"]
        original_min_deposit = game["min_deposit_amount"]
        original_max_deposit = game["max_deposit_amount"]
        
        # Update game rules
        update_response = requests.put(
            f"{BASE_URL}/api/v1/admin/games/{game_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "min_deposit_amount": 25.0,
                "max_deposit_amount": 15000.0
            }
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        assert update_response.json()["success"] == True
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/v1/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        updated_games = verify_response.json()
        updated_game = next((g for g in updated_games if g["game_id"] == game_id), None)
        assert updated_game is not None
        assert updated_game["min_deposit_amount"] == 25.0
        assert updated_game["max_deposit_amount"] == 15000.0
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/v1/admin/games/{game_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "min_deposit_amount": original_min_deposit,
                "max_deposit_amount": original_max_deposit
            }
        )


class TestRulesEnginePerClientOverrides:
    """Test Rules Engine - Per-Client Overrides"""
    
    def test_list_clients(self, admin_token):
        """Test GET /api/v1/admin/clients lists clients"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            client = data[0]
            assert "user_id" in client
            assert "username" in client
            assert "bonus_percentage" in client
            assert "deposit_locked" in client
            assert "withdraw_locked" in client
            
    def test_search_clients(self, admin_token):
        """Test GET /api/v1/admin/clients?search= searches clients"""
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/clients?search=admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_update_client_bonus(self, admin_token):
        """Test PUT /api/v1/admin/clients/{user_id}/bonus updates client bonus"""
        # Get clients list
        clients_response = requests.get(
            f"{BASE_URL}/api/v1/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        clients = clients_response.json()
        
        # Find a non-admin client or use admin
        client = next((c for c in clients if c["username"] != "admin"), clients[0] if clients else None)
        if not client:
            pytest.skip("No clients found")
            
        user_id = client["user_id"]
        original_bonus = client.get("bonus_percentage", 0)
        
        # Update client bonus
        update_response = requests.put(
            f"{BASE_URL}/api/v1/admin/clients/{user_id}/bonus",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "bonus_percentage": 20.0,
                "deposit_locked": False,
                "withdraw_locked": False
            }
        )
        assert update_response.status_code == 200
        assert update_response.json()["success"] == True
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/v1/admin/clients/{user_id}/bonus",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "bonus_percentage": original_bonus
            }
        )


class TestDepositValidationAPI:
    """Test Deposit validation API with rules engine: POST /api/v1/orders/deposit/validate"""
    
    def test_deposit_validate_success(self, admin_token):
        """Test deposit validation with valid parameters"""
        # Get a game name
        games_response = requests.get(f"{BASE_URL}/api/v1/orders/games/list")
        games = games_response.json()["games"]
        game_name = games[0]["game_name"]
        
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/deposit/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": game_name,
                "amount": 100.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "success" in data
        assert "valid" in data
        
        if data["valid"]:
            assert "game_name" in data
            assert "deposit_amount" in data
            assert "bonus_amount" in data
            assert "total_amount" in data
            assert "bonus_calculation" in data
            
    def test_deposit_validate_with_referral(self, admin_token):
        """Test deposit validation with referral code"""
        games_response = requests.get(f"{BASE_URL}/api/v1/orders/games/list")
        games = games_response.json()["games"]
        game_name = games[0]["game_name"]
        
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/deposit/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": game_name,
                "amount": 100.0,
                "referral_code": "ADMIN001"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        
    def test_deposit_validate_invalid_game(self, admin_token):
        """Test deposit validation with invalid game name"""
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/deposit/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": "nonexistent_game",
                "amount": 100.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False or data["valid"] == False
        
    def test_deposit_validate_below_minimum(self, admin_token):
        """Test deposit validation with amount below minimum"""
        games_response = requests.get(f"{BASE_URL}/api/v1/orders/games/list")
        games = games_response.json()["games"]
        game_name = games[0]["game_name"]
        
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/deposit/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": game_name,
                "amount": 0.01  # Very small amount
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should fail validation due to minimum amount
        assert data["success"] == False or data["valid"] == False


class TestWithdrawalValidationAPI:
    """Test Withdrawal validation API with rules engine: POST /api/v1/orders/withdrawal/validate"""
    
    def test_withdrawal_validate(self, admin_token):
        """Test withdrawal validation endpoint"""
        games_response = requests.get(f"{BASE_URL}/api/v1/orders/games/list")
        games = games_response.json()["games"]
        game_name = games[0]["game_name"]
        
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/withdrawal/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": game_name
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "success" in data
        assert "valid" in data
        
        # If valid, should have cashout calculation
        if data["valid"]:
            assert "cashout_calculation" in data
            cashout = data["cashout_calculation"]
            assert "payout_amount" in cashout
            assert "void_amount" in cashout
            assert "cash_consumed" in cashout
            assert "bonus_consumed" in cashout
            
    def test_withdrawal_validate_invalid_game(self, admin_token):
        """Test withdrawal validation with invalid game"""
        response = requests.post(
            f"{BASE_URL}/api/v1/orders/withdrawal/validate",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "username": "admin",
                "password": "admin123",
                "game_name": "nonexistent_game"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False or data["valid"] == False


class TestPublicGamesAPI:
    """Test public games list API"""
    
    def test_public_games_list(self):
        """Test GET /api/v1/orders/games/list returns games without auth"""
        response = requests.get(f"{BASE_URL}/api/v1/orders/games/list")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "games" in data
        assert isinstance(data["games"], list)
        assert len(data["games"]) > 0
        
        game = data["games"][0]
        assert "game_id" in game
        assert "game_name" in game
        assert "display_name" in game
        assert "is_active" in game


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
