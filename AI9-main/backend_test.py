import requests
import sys
from datetime import datetime
import json

class AdminClientPortalTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api = f"{base_url}/api/v1"
        self.admin_token = None
        self.client_token = None
        self.test_reward_id = None
        self.test_webhook_id = None
        self.test_api_key_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   🔑 Admin token obtained")
            return True
        return False

    def test_client_login(self):
        """Test client login and get token"""
        success, response = self.run_test(
            "Client Login",
            "POST",
            "auth/login",
            200,
            data={"username": "testclient", "password": "test12345"}
        )
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            print(f"   🔑 Client token obtained")
            return True
        return False

    # ==================== ADMIN REWARDS TESTS ====================

    def test_list_rewards(self):
        """Test listing reward definitions"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "List Rewards",
            "GET",
            "admin/rewards",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            rewards = response.get('rewards', [])
            print(f"   🎁 Found {len(rewards)} reward definitions")
            if rewards:
                print(f"   📊 First reward: {rewards[0].get('name')}")
        
        return success

    def test_create_reward(self):
        """Test creating a new reward definition"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "Create Reward",
            "POST",
            "admin/rewards",
            200,
            data={
                "name": "Test Welcome Bonus",
                "description": "Test reward for account setup",
                "trigger_type": "account_setup",
                "reward_type": "play_credits",
                "value": 25.0,
                "value_type": "fixed",
                "enabled": True,
                "is_one_time": True,
                "visible_to_client": True
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            self.test_reward_id = response.get('reward_id')
            print(f"   🎁 Created reward: {self.test_reward_id}")
        
        return success

    def test_get_reward_detail(self):
        """Test getting reward detail"""
        if not self.admin_token or not self.test_reward_id:
            return False
            
        success, response = self.run_test(
            "Get Reward Detail",
            "GET",
            f"admin/rewards/{self.test_reward_id}",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            reward = response.get('reward', {})
            grants = response.get('recent_grants', [])
            print(f"   🎁 Reward: {reward.get('name')}")
            print(f"   📊 Recent grants: {len(grants)}")
        
        return success

    def test_grant_history(self):
        """Test getting grant history"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "Grant History",
            "GET",
            "admin/rewards/grants/history",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            grants = response.get('grants', [])
            print(f"   📊 Total grants in history: {len(grants)}")
        
        return success

    # ==================== ADMIN SYSTEM TESTS ====================

    def test_system_webhooks_list(self):
        """Test listing system webhooks"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "System Webhooks List",
            "GET",
            "admin/system/webhooks",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            webhooks = response.get('webhooks', [])
            print(f"   🔗 Found {len(webhooks)} webhooks")
        
        return success

    def test_system_webhooks_create(self):
        """Test creating a system webhook"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "System Webhooks Create",
            "POST",
            "admin/system/webhooks",
            200,
            data={
                "name": "Test Webhook",
                "url": "https://example.com/webhook",
                "events": ["deposit.approved", "withdrawal.approved"],
                "enabled": True
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            self.test_webhook_id = response.get('webhook_id')
            print(f"   🔗 Created webhook: {self.test_webhook_id}")
        
        return success

    def test_system_api_keys_list(self):
        """Test listing system API keys"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "System API Keys List",
            "GET",
            "admin/system/api-keys",
            200,
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            api_keys = response.get('api_keys', [])
            print(f"   🔑 Found {len(api_keys)} API keys")
        
        return success

    def test_system_api_keys_create(self):
        """Test creating a system API key"""
        if not self.admin_token:
            return False
            
        success, response = self.run_test(
            "System API Keys Create",
            "POST",
            "admin/system/api-keys",
            200,
            data={
                "name": "Test API Key",
                "scopes": ["read:orders", "read:users"]
            },
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        
        if success:
            self.test_api_key_id = response.get('key_id')
            api_key = response.get('api_key')
            print(f"   🔑 Created API key: {self.test_api_key_id}")
            print(f"   🔐 Key: {api_key[:16]}...")
        
        return success

    # ==================== PORTAL WALLET TESTS ====================

    def test_wallet_breakdown(self):
        """Test wallet breakdown API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Wallet Breakdown",
            "GET",
            "portal/wallet/breakdown",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            overview = response.get('overview', {})
            totals = response.get('totals', {})
            print(f"   💰 Total Balance: ${overview.get('total_balance', 0):.2f}")
            print(f"   💵 Cash Balance: ${overview.get('cash_balance', 0):.2f}")
            print(f"   🎁 Bonus Balance: ${overview.get('bonus_balance', 0):.2f}")
            print(f"   🔒 Locked Amount: ${overview.get('locked_amount', 0):.2f}")
            print(f"   ✅ Withdrawable: ${overview.get('withdrawable_amount', 0):.2f}")
        
        return success

    def test_bonus_progress(self):
        """Test bonus progress tracker API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Bonus Progress",
            "GET",
            "portal/wallet/bonus-progress",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            progress = response.get('progress_tracker', {})
            sources = response.get('bonus_sources', {})
            print(f"   📊 Progress: {progress.get('progress_percentage', 0):.1f}%")
            print(f"   🎯 Required Playthrough: ${progress.get('required_playthrough', 0):.2f}")
            print(f"   💰 Current Playthrough: ${progress.get('current_playthrough', 0):.2f}")
            print(f"   🎁 Total Bonus Received: ${sources.get('total_bonus_received', 0):.2f}")
        
        return success

    def test_cashout_preview(self):
        """Test cashout preview API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Cashout Preview",
            "GET",
            "portal/wallet/cashout-preview",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            can_withdraw = response.get('can_withdraw', False)
            preview = response.get('preview', {})
            print(f"   ✅ Can Withdraw: {can_withdraw}")
            if can_withdraw and preview:
                print(f"   💰 Eligible Payout: ${preview.get('eligible_payout', 0):.2f}")
                print(f"   🗑️ Void Amount: ${preview.get('void_amount', 0):.2f}")
            else:
                print(f"   🚫 Block Reason: {response.get('block_reason', 'N/A')}")
        
        return success

    def test_promo_redemption(self):
        """Test promo code redemption"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Promo Redemption",
            "POST",
            "portal/promo/redeem",
            200,
            data={"code": "WELCOME10"},
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            print(f"   ✅ Promo Success: {response.get('success', False)}")
            print(f"   💬 Message: {response.get('message', 'N/A')}")
            if response.get('success'):
                print(f"   💰 Credit Amount: ${response.get('credit_amount', 0):.2f}")
                print(f"   🎁 Credit Type: {response.get('credit_type', 'N/A')}")
        
        return success

    def test_client_rewards(self):
        """Test client rewards API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Client Rewards",
            "GET",
            "portal/rewards",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            rewards = response.get('rewards', [])
            total_earned = response.get('total_rewards_earned', 0)
            print(f"   🎁 Total Rewards: {len(rewards)}")
            print(f"   💰 Total Earned: ${total_earned:.2f}")
        
        return success

    def test_portal_referrals_details(self):
        """Test portal referrals details API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Portal Referrals Details",
            "GET",
            "portal/referrals/details",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            referral_code = response.get('referral_code', 'N/A')
            total_referrals = response.get('total_referrals', 0)
            active_referrals = response.get('active_referrals', 0)
            total_earnings = response.get('total_earnings', 0)
            print(f"   🔗 Referral Code: {referral_code}")
            print(f"   👥 Total Referrals: {total_referrals}")
            print(f"   ✅ Active Referrals: {active_referrals}")
            print(f"   💰 Total Earnings: ${total_earnings:.2f}")
        
        return success

    def test_portal_withdrawals_cashout_preview(self):
        """Test portal withdrawals cashout preview API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Portal Withdrawals Cashout Preview",
            "GET",
            "portal/wallet/cashout-preview",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            can_withdraw = response.get('can_withdraw', False)
            preview = response.get('preview', {})
            print(f"   ✅ Can Withdraw: {can_withdraw}")
            if can_withdraw and preview:
                print(f"   💰 Payout Amount: ${preview.get('payout_amount', 0):.2f}")
                print(f"   🗑️ Void Amount: ${preview.get('void_amount', 0):.2f}")
            else:
                print(f"   🚫 Reason: {response.get('reason', 'N/A')}")
        
        return success

    def test_enhanced_transactions(self):
        """Test enhanced transactions API"""
        if not self.client_token:
            return False
            
        success, response = self.run_test(
            "Enhanced Transactions",
            "GET",
            "portal/transactions/enhanced",
            200,
            headers={'Authorization': f'Bearer {self.client_token}'}
        )
        
        if success:
            transactions = response.get('transactions', [])
            total = response.get('total', 0)
            print(f"   📊 Total Transactions: {total}")
            if transactions:
                print(f"   💳 First Transaction: {transactions[0].get('type')} - ${transactions[0].get('amount', 0):.2f}")
        
        return success

def main():
    print("🚀 Starting Admin + Client Portal Testing - Production Fixes...")
    print("=" * 60)
    
    tester = AdminClientPortalTester()
    
    # Test sequence for Admin System and Portal features
    tests = [
        ("Admin Authentication", tester.test_admin_login),
        ("Client Authentication", tester.test_client_login),
        ("System Webhooks List", tester.test_system_webhooks_list),
        ("System Webhooks Create", tester.test_system_webhooks_create),
        ("System API Keys List", tester.test_system_api_keys_list),
        ("System API Keys Create", tester.test_system_api_keys_create),
        ("Wallet Breakdown (Client)", tester.test_wallet_breakdown),
        ("Bonus Progress (Client)", tester.test_bonus_progress),
        ("Cashout Preview (Client)", tester.test_cashout_preview),
        ("Portal Referrals Details", tester.test_portal_referrals_details),
        ("Portal Withdrawals Cashout Preview", tester.test_portal_withdrawals_cashout_preview),
        ("Enhanced Transactions (Client)", tester.test_enhanced_transactions),
        ("Promo Redemption (Client)", tester.test_promo_redemption),
        ("Client Rewards (Client)", tester.test_client_rewards),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed Tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All Admin + Client Portal tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())