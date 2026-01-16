"""
Public Games List Feature Tests
Tests:
- GET /api/public/games - public games list (no auth required)
- GET /api/public/games/{id} - single game detail (no auth)
- GET /api/public/games/categories/list - game categories
- GET /api/public/site-info - site contact info
- Admin: Create game with new fields
- Admin: Update game availability status
- Admin: Toggle featured status
- Admin: Set download URL
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_GAME_ID = None  # Will be set during test


class TestPublicGamesNoAuth:
    """Public games API tests - no authentication required"""
    
    def test_get_public_games_list(self):
        """Test GET /api/public/games returns games list without auth"""
        response = requests.get(f"{BASE_URL}/api/public/games")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least one game (Lucky Slots)
        assert len(data) >= 1
        
        # Verify response structure
        if len(data) > 0:
            game = data[0]
            assert "id" in game
            assert "name" in game
            assert "description" in game
            assert "availability_status" in game
            assert "platforms" in game
            
    def test_get_public_games_with_search(self):
        """Test search filter on public games"""
        response = requests.get(f"{BASE_URL}/api/public/games?search=Lucky")
        assert response.status_code == 200
        data = response.json()
        # Should find Lucky Slots
        assert any("Lucky" in g["name"] for g in data)
        
    def test_get_public_games_with_availability_filter(self):
        """Test availability filter on public games"""
        response = requests.get(f"{BASE_URL}/api/public/games?availability=available")
        assert response.status_code == 200
        data = response.json()
        # All returned games should be available
        for game in data:
            assert game["availability_status"] == "available"
            
    def test_get_public_games_featured_only(self):
        """Test featured_only filter on public games"""
        response = requests.get(f"{BASE_URL}/api/public/games?featured_only=true")
        assert response.status_code == 200
        data = response.json()
        # All returned games should be featured
        for game in data:
            assert game["is_featured"] == True
            
    def test_get_public_games_with_category(self):
        """Test category filter on public games"""
        response = requests.get(f"{BASE_URL}/api/public/games?category=Slots")
        assert response.status_code == 200
        data = response.json()
        # All returned games should be in Slots category
        for game in data:
            assert game["category"] == "Slots"
            
    def test_get_public_games_pagination(self):
        """Test pagination on public games"""
        response = requests.get(f"{BASE_URL}/api/public/games?limit=1&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 1


class TestPublicGameDetail:
    """Public game detail API tests"""
    
    def test_get_public_game_detail(self):
        """Test GET /api/public/games/{id} returns game detail"""
        # First get a game ID
        list_response = requests.get(f"{BASE_URL}/api/public/games")
        games = list_response.json()
        if len(games) == 0:
            pytest.skip("No games available")
            
        game_id = games[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/public/games/{game_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["id"] == game_id
        assert "name" in data
        assert "description" in data
        assert "availability_status" in data
        assert "platforms" in data
        assert "download_url" in data
        
    def test_get_public_game_not_found(self):
        """Test GET /api/public/games/{id} returns 404 for non-existent game"""
        response = requests.get(f"{BASE_URL}/api/public/games/nonexistent-game-id")
        assert response.status_code == 404


class TestPublicCategories:
    """Public categories API tests"""
    
    def test_get_categories_list(self):
        """Test GET /api/public/games/categories/list returns categories"""
        response = requests.get(f"{BASE_URL}/api/public/games/categories/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert isinstance(data["categories"], list)
        # Should have at least Slots category
        assert "Slots" in data["categories"]


class TestPublicSiteInfo:
    """Public site info API tests"""
    
    def test_get_site_info(self):
        """Test GET /api/public/site-info returns site information"""
        response = requests.get(f"{BASE_URL}/api/public/site-info")
        assert response.status_code == 200
        data = response.json()
        
        assert "name" in data
        assert "tagline" in data
        assert "contact" in data
        assert "support_text" in data
        
        # Verify contact structure
        contact = data["contact"]
        assert "facebook" in contact
        assert "messenger" in contact


class TestAdminGameManagement:
    """Admin game management tests"""
    
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
        
    def test_admin_get_games(self, admin_token):
        """Test admin can get all games including inactive"""
        response = requests.get(
            f"{BASE_URL}/api/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Admin response should include additional fields
        if len(data) > 0:
            game = data[0]
            assert "show_credentials" in game
            assert "allow_recharge" in game
            assert "display_order" in game
            assert "created_by" in game
            
    def test_admin_create_game_with_new_fields(self, admin_token):
        """Test admin can create game with all new fields"""
        global TEST_GAME_ID
        
        game_data = {
            "name": f"TEST_Game_{int(time.time())}",
            "description": "Test game description",
            "tagline": "Test tagline",
            "category": "Test Category",
            "download_url": "https://example.com/download",
            "platforms": ["android", "ios", "web"],
            "availability_status": "available",
            "show_credentials": True,
            "allow_recharge": True,
            "is_featured": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/games",
            json=game_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        TEST_GAME_ID = data["id"]
        
        # Verify all fields
        assert data["name"] == game_data["name"]
        assert data["tagline"] == game_data["tagline"]
        assert data["download_url"] == game_data["download_url"]
        assert data["platforms"] == game_data["platforms"]
        assert data["availability_status"] == game_data["availability_status"]
        assert data["show_credentials"] == game_data["show_credentials"]
        assert data["allow_recharge"] == game_data["allow_recharge"]
        assert data["is_featured"] == game_data["is_featured"]
        
    def test_admin_update_availability_status(self, admin_token):
        """Test admin can update game availability status"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        # Update to maintenance
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"availability_status": "maintenance"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["availability_status"] == "maintenance"
        
        # Update to unavailable
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"availability_status": "unavailable"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["availability_status"] == "unavailable"
        
        # Update back to available
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"availability_status": "available"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["availability_status"] == "available"
        
    def test_admin_toggle_featured_status(self, admin_token):
        """Test admin can toggle featured status"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        # Toggle off
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"is_featured": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["is_featured"] == False
        
        # Toggle on
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"is_featured": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["is_featured"] == True
        
    def test_admin_update_download_url(self, admin_token):
        """Test admin can update download URL"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        new_url = "https://play.google.com/store/apps/details?id=test.game"
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"download_url": new_url},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["download_url"] == new_url
        
    def test_admin_update_platforms(self, admin_token):
        """Test admin can update platforms"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"platforms": ["android"]},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["platforms"] == ["android"]
        
    def test_admin_update_show_credentials(self, admin_token):
        """Test admin can toggle show_credentials"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"show_credentials": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["show_credentials"] == False
        
    def test_admin_update_allow_recharge(self, admin_token):
        """Test admin can toggle allow_recharge"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"allow_recharge": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["allow_recharge"] == False
        
    def test_admin_deactivate_game(self, admin_token):
        """Test admin can deactivate game"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == False
        
        # Verify game is not in public list
        public_response = requests.get(f"{BASE_URL}/api/public/games")
        public_games = public_response.json()
        assert not any(g["id"] == TEST_GAME_ID for g in public_games)
        
    def test_admin_reactivate_game(self, admin_token):
        """Test admin can reactivate game"""
        global TEST_GAME_ID
        if not TEST_GAME_ID:
            pytest.skip("No test game created")
            
        response = requests.put(
            f"{BASE_URL}/api/admin/games/{TEST_GAME_ID}",
            json={"is_active": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert response.json()["is_active"] == True


class TestPublicGamesVerification:
    """Verify public games reflect admin changes"""
    
    def test_public_games_shows_featured_badge(self):
        """Test public games shows featured games correctly"""
        # Get featured games
        response = requests.get(f"{BASE_URL}/api/public/games?featured_only=true")
        assert response.status_code == 200
        data = response.json()
        
        # All should be featured
        for game in data:
            assert game["is_featured"] == True
            
    def test_public_games_shows_availability_status(self):
        """Test public games shows availability status"""
        response = requests.get(f"{BASE_URL}/api/public/games")
        assert response.status_code == 200
        data = response.json()
        
        for game in data:
            assert game["availability_status"] in ["available", "maintenance", "unavailable"]
            
    def test_public_games_shows_download_url(self):
        """Test public games shows download URL"""
        response = requests.get(f"{BASE_URL}/api/public/games")
        assert response.status_code == 200
        data = response.json()
        
        for game in data:
            assert "download_url" in game
            
    def test_public_games_shows_platforms(self):
        """Test public games shows platforms"""
        response = requests.get(f"{BASE_URL}/api/public/games")
        assert response.status_code == 200
        data = response.json()
        
        for game in data:
            assert "platforms" in game
            assert isinstance(game["platforms"], list)


class TestCleanup:
    """Cleanup test data"""
    
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
        
    def test_cleanup_test_games(self, admin_token):
        """Delete test games created during testing"""
        # Get all games
        response = requests.get(
            f"{BASE_URL}/api/admin/games",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        games = response.json()
        
        # Delete games with TEST_ prefix
        for game in games:
            if game["name"].startswith("TEST_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/games/{game['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert delete_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
