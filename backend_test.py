import requests
import sys
import json
from datetime import datetime

class CatastropheIQAPITester:
    def __init__(self, base_url="https://disaster-response-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.event_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error response: {error_data}")
                except:
                    print(f"   Error text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"   Health status: {response.get('status', 'unknown')}")
        return success

    def test_agent_status(self):
        """Test agent status endpoint"""
        success, response = self.run_test(
            "Agent Status",
            "GET", 
            "api/agents/status",
            200
        )
        if success:
            agents = ['geo_sentinel', 'claims_verifier', 'revenue_engine']
            for agent in agents:
                if agent in response:
                    status = response[agent].get('status', 'unknown')
                    print(f"   {agent}: {status}")
                else:
                    print(f"   ⚠️  Missing agent: {agent}")
                    return False
        return success

    def test_active_disasters(self):
        """Test active disasters endpoint"""
        success, response = self.run_test(
            "Active Disasters",
            "GET",
            "api/disasters/active", 
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} active disasters")
            for disaster in response:
                event_id = disaster.get('event_id')
                if event_id:
                    self.event_ids.append(event_id)
                    print(f"   - {disaster.get('title', 'Unknown')} (ID: {event_id})")
                    print(f"     Damage Score: {disaster.get('damage_score', 'N/A')}/100")
        return success

    def test_disaster_analysis(self):
        """Test disaster analysis endpoint"""
        if not self.event_ids:
            print("❌ No event IDs available for analysis test")
            return False
            
        event_id = self.event_ids[0]
        success, response = self.run_test(
            f"Disaster Analysis for {event_id}",
            "GET",
            f"api/disasters/{event_id}/analysis",
            200
        )
        if success:
            satellite = response.get('satellite_analysis', {})
            social = response.get('social_signals', {})
            print(f"   Area affected: {satellite.get('area_affected_sqkm', 'N/A')} km²")
            print(f"   Damage severity: {satellite.get('damage_severity', 'N/A')}")
            print(f"   Social posts: {social.get('total_posts', 'N/A')}")
        return success

    def test_event_claims(self):
        """Test claims by event endpoint"""
        if not self.event_ids:
            print("❌ No event IDs available for claims test")
            return False
            
        event_id = self.event_ids[0]
        success, response = self.run_test(
            f"Claims for Event {event_id}",
            "GET",
            f"api/claims/event/{event_id}",
            200
        )
        if success:
            total_claims = response.get('total_claims', 0)
            auto_approved = response.get('auto_approved', 0)
            pending = response.get('pending_review', 0)
            total_value = response.get('total_value', 0)
            
            print(f"   Total claims: {total_claims}")
            print(f"   Auto approved: {auto_approved}")
            print(f"   Pending review: {pending}")
            print(f"   Total value: ${total_value:,.2f}")
            
            # Test auto-approval logic
            claims = response.get('claims', [])
            if claims:
                correct_logic = True
                for claim in claims[:5]:  # Check first 5 claims
                    social_evidence = claim.get('social_evidence', 0)
                    satellite_damage = claim.get('satellite_damage', 0)
                    auto_approved = claim.get('auto_approved', False)
                    expected_approval = social_evidence >= 3 and satellite_damage >= 70
                    
                    if auto_approved != expected_approval:
                        print(f"   ⚠️  Auto-approval logic error for claim {claim.get('claim_id')}")
                        print(f"      Social: {social_evidence}, Satellite: {satellite_damage}, Approved: {auto_approved}")
                        correct_logic = False
                
                if correct_logic:
                    print("   ✅ Auto-approval logic working correctly")
        return success

    def test_revenue_dashboard(self):
        """Test revenue dashboard endpoint"""
        success, response = self.run_test(
            "Revenue Dashboard",
            "GET",
            "api/revenue/dashboard",
            200
        )
        if success:
            total_clients = response.get('total_clients', 0)
            active_trials = response.get('active_trials', 0)
            paying_clients = response.get('paying_clients', 0)
            revenue_72h = response.get('revenue_72h', 0)
            
            print(f"   Total clients: {total_clients}")
            print(f"   Active trials: {active_trials}")
            print(f"   Paying clients: {paying_clients}")
            print(f"   72h revenue: ${revenue_72h:,.2f}")
            
            # Check if revenue matches expected $8,200
            if revenue_72h == 8200.00:
                print("   ✅ Revenue matches expected $8,200")
            else:
                print(f"   ⚠️  Revenue {revenue_72h} doesn't match expected $8,200")
        return success

    def test_simulate_disaster(self):
        """Test disaster simulation endpoint"""
        success, response = self.run_test(
            "Simulate New Disaster",
            "POST",
            "api/simulate/new-disaster",
            200
        )
        if success:
            disaster = response.get('disaster', {})
            claims_generated = response.get('claims_generated', 0)
            auto_approved = response.get('auto_approved', 0)
            demos_sent = response.get('demos_sent', 0)
            trials_activated = response.get('trials_activated', 0)
            estimated_revenue = response.get('estimated_revenue', 0)
            
            print(f"   New disaster: {disaster.get('title', 'Unknown')}")
            print(f"   Claims generated: {claims_generated}")
            print(f"   Auto approved: {auto_approved}")
            print(f"   Demos sent: {demos_sent}")
            print(f"   Trials activated: {trials_activated}")
            print(f"   Estimated revenue: ${estimated_revenue:,.2f}")
        return success

def main():
    print("🚀 Starting CatastropheIQ API Testing...")
    print("=" * 60)
    
    tester = CatastropheIQAPITester()
    
    # Run all tests in order
    tests = [
        tester.test_health_check,
        tester.test_agent_status,
        tester.test_active_disasters,
        tester.test_disaster_analysis,
        tester.test_event_claims,
        tester.test_revenue_dashboard,
        tester.test_simulate_disaster
    ]
    
    for test in tests:
        test()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ SOME TESTS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())