"""
Phase 4: Admin Settings API Tests
Tests for referral tiers, bonus milestones, and anti-fraud settings management
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"


class TestAdminAuth:
    """Test admin authentication for settings access"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful, role: {data['user']['role']}")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture
def auth_headers(admin_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestGetSettings:
    """Test GET endpoints for settings"""
    
    def test_get_all_settings(self, auth_headers):
        """GET /api/admin/settings - fetch all settings"""
        response = requests.get(f"{API_URL}/admin/settings", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "referral_tier_config" in data
        assert "bonus_rules" in data
        assert "anti_fraud" in data
        assert "withdrawals_enabled" in data
        assert "bonus_system_enabled" in data
        assert "referral_system_enabled" in data
        
        print(f"✓ GET all settings successful")
        print(f"  - Withdrawals enabled: {data.get('withdrawals_enabled')}")
        print(f"  - Bonus system enabled: {data.get('bonus_system_enabled')}")
        print(f"  - Referral system enabled: {data.get('referral_system_enabled')}")
    
    def test_get_referral_tiers(self, auth_headers):
        """GET /api/admin/settings/referral-tiers - fetch tier configuration"""
        response = requests.get(f"{API_URL}/admin/settings/referral-tiers", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "tiers" in data
        assert "base_percentage" in data
        assert len(data["tiers"]) >= 1, "Should have at least one tier"
        
        # Verify tier structure
        for tier in data["tiers"]:
            assert "tier_number" in tier
            assert "name" in tier
            assert "min_referrals" in tier
            assert "commission_percentage" in tier
        
        print(f"✓ GET referral tiers successful - {len(data['tiers'])} tiers found")
        for tier in data["tiers"]:
            print(f"  - Tier {tier['tier_number']}: {tier['name']} ({tier['commission_percentage']}% at {tier['min_referrals']} referrals)")
    
    def test_get_bonus_milestones(self, auth_headers):
        """GET /api/admin/settings/bonus-milestones - fetch bonus milestones"""
        response = requests.get(f"{API_URL}/admin/settings/bonus-milestones", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "milestones" in data
        assert "enabled" in data
        
        # Verify milestone structure
        for milestone in data.get("milestones", []):
            assert "milestone_number" in milestone
            assert "referrals_required" in milestone
            assert "bonus_amount" in milestone
        
        print(f"✓ GET bonus milestones successful - {len(data.get('milestones', []))} milestones found")
        print(f"  - Bonus system enabled: {data.get('enabled')}")
    
    def test_get_anti_fraud_settings(self, auth_headers):
        """GET /api/admin/settings/anti-fraud - fetch anti-fraud settings"""
        response = requests.get(f"{API_URL}/admin/settings/anti-fraud", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "enabled" in data
        assert "max_referrals_per_ip" in data
        assert "ip_cooldown_hours" in data
        assert "min_account_age_hours" in data
        assert "flag_same_ip_referrals" in data
        assert "auto_flag_suspicious" in data
        
        print(f"✓ GET anti-fraud settings successful")
        print(f"  - Anti-fraud enabled: {data.get('enabled')}")
        print(f"  - Max referrals per IP: {data.get('max_referrals_per_ip')}")
    
    def test_get_settings_unauthorized(self):
        """Test that settings require authentication"""
        response = requests.get(f"{API_URL}/admin/settings")
        assert response.status_code == 401, "Should require authentication"
        print("✓ Settings correctly require authentication")


class TestUpdateGlobalSettings:
    """Test PUT /api/admin/settings - update global settings"""
    
    def test_update_feature_toggles(self, auth_headers):
        """Update feature toggles"""
        # First get current settings
        get_response = requests.get(f"{API_URL}/admin/settings", headers=auth_headers)
        original = get_response.json()
        
        # Update settings
        updates = {
            "withdrawals_enabled": True,
            "bonus_system_enabled": True,
            "referral_system_enabled": True,
            "min_withdrawal_amount": 25.0,
            "max_withdrawal_amount": 9000.0
        }
        
        response = requests.put(f"{API_URL}/admin/settings", json=updates, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "updated_fields" in data
        
        # Verify changes persisted
        verify_response = requests.get(f"{API_URL}/admin/settings", headers=auth_headers)
        verify_data = verify_response.json()
        assert verify_data["min_withdrawal_amount"] == 25.0
        assert verify_data["max_withdrawal_amount"] == 9000.0
        
        print(f"✓ Global settings updated successfully")
        print(f"  - Updated fields: {data['updated_fields']}")
    
    def test_update_invalid_field(self, auth_headers):
        """Test that invalid fields are ignored"""
        updates = {
            "invalid_field": "should_be_ignored",
            "another_invalid": 123
        }
        
        response = requests.put(f"{API_URL}/admin/settings", json=updates, headers=auth_headers)
        assert response.status_code == 400, "Should reject when no valid fields"
        print("✓ Invalid fields correctly rejected")


class TestReferralTiers:
    """Test referral tier CRUD operations"""
    
    def test_update_all_tiers(self, auth_headers):
        """PUT /api/admin/settings/referral-tiers - update all tiers"""
        tiers = [
            {"name": "Starter", "min_referrals": 0, "commission_percentage": 5.0},
            {"name": "Bronze", "min_referrals": 5, "commission_percentage": 6.0},
            {"name": "Silver", "min_referrals": 10, "commission_percentage": 7.0},
            {"name": "Gold", "min_referrals": 20, "commission_percentage": 8.0},
            {"name": "Platinum", "min_referrals": 50, "commission_percentage": 10.0}
        ]
        
        response = requests.put(f"{API_URL}/admin/settings/referral-tiers", json=tiers, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tiers" in data
        assert len(data["tiers"]) == 5
        
        # Verify tier numbers are assigned correctly
        for i, tier in enumerate(data["tiers"]):
            assert tier["tier_number"] == i
        
        print(f"✓ All tiers updated successfully - {len(data['tiers'])} tiers")
    
    def test_add_new_tier(self, auth_headers):
        """POST /api/admin/settings/referral-tiers/add - add a new tier"""
        new_tier = {
            "name": "Diamond",
            "min_referrals": 100,
            "commission_percentage": 12.0
        }
        
        response = requests.post(f"{API_URL}/admin/settings/referral-tiers/add", json=new_tier, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tiers" in data
        
        # Verify new tier was added
        diamond_tier = next((t for t in data["tiers"] if t["name"] == "Diamond"), None)
        assert diamond_tier is not None, "Diamond tier should exist"
        assert diamond_tier["commission_percentage"] == 12.0
        
        print(f"✓ New tier 'Diamond' added successfully")
        print(f"  - Total tiers now: {len(data['tiers'])}")
    
    def test_add_duplicate_tier(self, auth_headers):
        """Test adding tier with duplicate min_referrals"""
        duplicate_tier = {
            "name": "Duplicate",
            "min_referrals": 0,  # Already exists
            "commission_percentage": 5.0
        }
        
        response = requests.post(f"{API_URL}/admin/settings/referral-tiers/add", json=duplicate_tier, headers=auth_headers)
        assert response.status_code == 400, "Should reject duplicate min_referrals"
        print("✓ Duplicate tier correctly rejected")
    
    def test_delete_tier(self, auth_headers):
        """DELETE /api/admin/settings/referral-tiers/{tier_number} - delete a tier"""
        # First get current tiers to find the Diamond tier
        get_response = requests.get(f"{API_URL}/admin/settings/referral-tiers", headers=auth_headers)
        tiers = get_response.json().get("tiers", [])
        
        # Find Diamond tier (the one we added)
        diamond_tier = next((t for t in tiers if t["name"] == "Diamond"), None)
        if diamond_tier:
            tier_number = diamond_tier["tier_number"]
            
            response = requests.delete(f"{API_URL}/admin/settings/referral-tiers/{tier_number}", headers=auth_headers)
            assert response.status_code == 200, f"Failed: {response.text}"
            
            # Verify deletion
            verify_response = requests.get(f"{API_URL}/admin/settings/referral-tiers", headers=auth_headers)
            verify_tiers = verify_response.json().get("tiers", [])
            diamond_exists = any(t["name"] == "Diamond" for t in verify_tiers)
            assert not diamond_exists, "Diamond tier should be deleted"
            
            print(f"✓ Tier deleted successfully")
        else:
            print("⚠ Diamond tier not found, skipping delete test")
    
    def test_cannot_delete_base_tier(self, auth_headers):
        """Test that base tier (tier 0) cannot be deleted"""
        response = requests.delete(f"{API_URL}/admin/settings/referral-tiers/0", headers=auth_headers)
        assert response.status_code == 400, "Should not allow deleting base tier"
        print("✓ Base tier deletion correctly prevented")
    
    def test_tier_validation(self, auth_headers):
        """Test tier validation rules"""
        # Test missing base tier
        invalid_tiers = [
            {"name": "Bronze", "min_referrals": 5, "commission_percentage": 6.0}
        ]
        
        response = requests.put(f"{API_URL}/admin/settings/referral-tiers", json=invalid_tiers, headers=auth_headers)
        assert response.status_code == 400, "Should require base tier with min_referrals=0"
        print("✓ Tier validation correctly enforced")


class TestBonusMilestones:
    """Test bonus milestone CRUD operations"""
    
    def test_update_all_milestones(self, auth_headers):
        """PUT /api/admin/settings/bonus-milestones - update all milestones"""
        milestones = [
            {"referrals_required": 5, "bonus_amount": 5.0, "bonus_type": "bonus", "description": "First milestone"},
            {"referrals_required": 10, "bonus_amount": 2.0, "bonus_type": "bonus", "description": "10 referrals"},
            {"referrals_required": 15, "bonus_amount": 2.0, "bonus_type": "bonus", "description": "15 referrals"},
            {"referrals_required": 20, "bonus_amount": 3.0, "bonus_type": "bonus", "description": "20 referrals"},
            {"referrals_required": 30, "bonus_amount": 5.0, "bonus_type": "bonus", "description": "30 referrals"},
            {"referrals_required": 50, "bonus_amount": 10.0, "bonus_type": "bonus", "description": "50 referrals"}
        ]
        
        response = requests.put(f"{API_URL}/admin/settings/bonus-milestones", json=milestones, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "milestones" in data
        assert len(data["milestones"]) == 6
        
        # Verify milestone numbers are assigned correctly
        for i, milestone in enumerate(data["milestones"]):
            assert milestone["milestone_number"] == i + 1
        
        print(f"✓ All milestones updated successfully - {len(data['milestones'])} milestones")
    
    def test_add_new_milestone(self, auth_headers):
        """POST /api/admin/settings/bonus-milestones/add - add a new milestone"""
        new_milestone = {
            "referrals_required": 75,
            "bonus_amount": 15.0,
            "bonus_type": "bonus",
            "description": "75 referrals super bonus"
        }
        
        response = requests.post(f"{API_URL}/admin/settings/bonus-milestones/add", json=new_milestone, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "milestones" in data
        
        # Verify new milestone was added
        new_ms = next((m for m in data["milestones"] if m["referrals_required"] == 75), None)
        assert new_ms is not None, "75 referrals milestone should exist"
        assert new_ms["bonus_amount"] == 15.0
        
        print(f"✓ New milestone added successfully")
        print(f"  - Total milestones now: {len(data['milestones'])}")
    
    def test_add_duplicate_milestone(self, auth_headers):
        """Test adding milestone with duplicate referrals_required"""
        duplicate_milestone = {
            "referrals_required": 5,  # Already exists
            "bonus_amount": 10.0,
            "bonus_type": "bonus"
        }
        
        response = requests.post(f"{API_URL}/admin/settings/bonus-milestones/add", json=duplicate_milestone, headers=auth_headers)
        assert response.status_code == 400, "Should reject duplicate referrals_required"
        print("✓ Duplicate milestone correctly rejected")
    
    def test_delete_milestone(self, auth_headers):
        """DELETE /api/admin/settings/bonus-milestones/{milestone_number} - delete a milestone"""
        # First get current milestones
        get_response = requests.get(f"{API_URL}/admin/settings/bonus-milestones", headers=auth_headers)
        milestones = get_response.json().get("milestones", [])
        
        # Find the 75 referrals milestone we added
        target_milestone = next((m for m in milestones if m["referrals_required"] == 75), None)
        if target_milestone:
            milestone_number = target_milestone["milestone_number"]
            
            response = requests.delete(f"{API_URL}/admin/settings/bonus-milestones/{milestone_number}", headers=auth_headers)
            assert response.status_code == 200, f"Failed: {response.text}"
            
            # Verify deletion
            verify_response = requests.get(f"{API_URL}/admin/settings/bonus-milestones", headers=auth_headers)
            verify_milestones = verify_response.json().get("milestones", [])
            exists = any(m["referrals_required"] == 75 for m in verify_milestones)
            assert not exists, "75 referrals milestone should be deleted"
            
            print(f"✓ Milestone deleted successfully")
        else:
            print("⚠ 75 referrals milestone not found, skipping delete test")
    
    def test_milestone_validation(self, auth_headers):
        """Test milestone validation rules"""
        # Test invalid referrals_required
        invalid_milestone = {
            "referrals_required": 0,  # Must be >= 1
            "bonus_amount": 5.0
        }
        
        response = requests.put(f"{API_URL}/admin/settings/bonus-milestones", json=[invalid_milestone], headers=auth_headers)
        assert response.status_code == 400, "Should require referrals_required >= 1"
        print("✓ Milestone validation correctly enforced")


class TestAntiFraudSettings:
    """Test anti-fraud settings update"""
    
    def test_update_anti_fraud_settings(self, auth_headers):
        """PUT /api/admin/settings/anti-fraud - update anti-fraud settings"""
        updates = {
            "enabled": True,
            "max_referrals_per_ip": 5,
            "ip_cooldown_hours": 48,
            "min_account_age_hours": 2,
            "min_deposit_for_valid_referral": 15.0,
            "flag_same_ip_referrals": True,
            "flag_rapid_signups": True,
            "rapid_signup_threshold_minutes": 10,
            "auto_flag_suspicious": True,
            "auto_reject_fraud": False
        }
        
        response = requests.put(f"{API_URL}/admin/settings/anti-fraud", json=updates, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "anti_fraud" in data
        
        # Verify changes
        assert data["anti_fraud"]["max_referrals_per_ip"] == 5
        assert data["anti_fraud"]["ip_cooldown_hours"] == 48
        assert data["anti_fraud"]["min_deposit_for_valid_referral"] == 15.0
        
        print(f"✓ Anti-fraud settings updated successfully")
        print(f"  - Max referrals per IP: {data['anti_fraud']['max_referrals_per_ip']}")
        print(f"  - IP cooldown hours: {data['anti_fraud']['ip_cooldown_hours']}")
    
    def test_disable_anti_fraud(self, auth_headers):
        """Test disabling anti-fraud system"""
        updates = {"enabled": False}
        
        response = requests.put(f"{API_URL}/admin/settings/anti-fraud", json=updates, headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify
        verify_response = requests.get(f"{API_URL}/admin/settings/anti-fraud", headers=auth_headers)
        verify_data = verify_response.json()
        assert verify_data["enabled"] == False
        
        # Re-enable for other tests
        requests.put(f"{API_URL}/admin/settings/anti-fraud", json={"enabled": True}, headers=auth_headers)
        
        print("✓ Anti-fraud system can be disabled/enabled")


class TestResetDefaults:
    """Test reset to defaults functionality"""
    
    def test_reset_tiers_to_defaults(self, auth_headers):
        """POST /api/admin/settings/reset-defaults?section=tiers"""
        response = requests.post(f"{API_URL}/admin/settings/reset-defaults?section=tiers", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "settings" in data
        
        # Verify default tiers restored
        verify_response = requests.get(f"{API_URL}/admin/settings/referral-tiers", headers=auth_headers)
        tiers = verify_response.json().get("tiers", [])
        assert len(tiers) == 5, "Should have 5 default tiers"
        
        tier_names = [t["name"] for t in tiers]
        assert "Starter" in tier_names
        assert "Platinum" in tier_names
        
        print("✓ Tiers reset to defaults successfully")
    
    def test_reset_milestones_to_defaults(self, auth_headers):
        """POST /api/admin/settings/reset-defaults?section=milestones"""
        response = requests.post(f"{API_URL}/admin/settings/reset-defaults?section=milestones", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify default milestones restored
        verify_response = requests.get(f"{API_URL}/admin/settings/bonus-milestones", headers=auth_headers)
        milestones = verify_response.json().get("milestones", [])
        assert len(milestones) == 6, "Should have 6 default milestones"
        
        print("✓ Milestones reset to defaults successfully")
    
    def test_reset_antifraud_to_defaults(self, auth_headers):
        """POST /api/admin/settings/reset-defaults?section=antifraud"""
        response = requests.post(f"{API_URL}/admin/settings/reset-defaults?section=antifraud", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify default anti-fraud settings restored
        verify_response = requests.get(f"{API_URL}/admin/settings/anti-fraud", headers=auth_headers)
        data = verify_response.json()
        assert data["max_referrals_per_ip"] == 3, "Should be default value"
        assert data["ip_cooldown_hours"] == 24, "Should be default value"
        
        print("✓ Anti-fraud settings reset to defaults successfully")
    
    def test_reset_all_to_defaults(self, auth_headers):
        """POST /api/admin/settings/reset-defaults?section=all"""
        response = requests.post(f"{API_URL}/admin/settings/reset-defaults?section=all", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Verify all settings restored
        verify_response = requests.get(f"{API_URL}/admin/settings", headers=auth_headers)
        data = verify_response.json()
        
        assert data["min_withdrawal_amount"] == 20.0, "Should be default"
        assert data["max_withdrawal_amount"] == 10000.0, "Should be default"
        
        print("✓ All settings reset to defaults successfully")
    
    def test_reset_invalid_section(self, auth_headers):
        """Test reset with invalid section"""
        response = requests.post(f"{API_URL}/admin/settings/reset-defaults?section=invalid", headers=auth_headers)
        assert response.status_code == 400, "Should reject invalid section"
        print("✓ Invalid section correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
