from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from datetime import datetime, timedelta
import json
import uuid
import random
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

app = FastAPI(title="CatastropheIQ Multi-Agent Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.catastropheiq

# Pydantic models
class DisasterEvent(BaseModel):
    event_id: str
    event_type: str
    title: str
    coordinates: Dict
    damage_score: int
    confidence: float
    timestamp: datetime
    status: str

class ClaimRecord(BaseModel):
    claim_id: str
    event_id: str
    property_address: str
    claim_amount: float
    verification_status: str
    social_evidence: int
    satellite_damage: int
    auto_approved: bool
    timestamp: datetime

class ClientRecord(BaseModel):
    client_id: str
    company_name: str
    email: str
    status: str
    trial_events: int
    revenue_generated: float
    signup_timestamp: datetime

# Mock data generators
def generate_mock_disaster():
    event_types = ["Hurricane", "Wildfire", "Flood", "Tornado", "Hailstorm"]
    locations = [
        {"name": "Miami-Dade, FL", "lat": 25.7617, "lng": -80.1918},
        {"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437},
        {"name": "Houston, TX", "lat": 29.7604, "lng": -95.3698},
        {"name": "Phoenix, AZ", "lat": 33.4484, "lng": -112.0740},
        {"name": "Tampa, FL", "lat": 27.9506, "lng": -82.4572}
    ]
    
    event_type = random.choice(event_types)
    location = random.choice(locations)
    
    return {
        "event_id": f"NWS-{event_type.upper()}-{datetime.now().strftime('%Y%m%d%H%M')}",
        "event_type": event_type,
        "title": f"{event_type} Alert - {location['name']}",
        "coordinates": {
            "type": "Point",
            "coordinates": [location["lng"], location["lat"]],
            "radius_km": random.randint(15, 80)
        },
        "damage_score": random.randint(65, 95),
        "confidence": round(random.uniform(0.75, 0.98), 2),
        "timestamp": datetime.now(),
        "status": "active"
    }

def generate_mock_claims(event_id: str, count: int = 50):
    claims = []
    addresses = [
        "1234 Ocean Drive, Miami Beach, FL 33139",
        "5678 Sunset Blvd, Los Angeles, CA 90028",
        "9101 Main St, Houston, TX 77002",
        "1121 Central Ave, Phoenix, AZ 85004",
        "3141 Bay Shore Blvd, Tampa, FL 33629"
    ]
    
    for i in range(count):
        social_evidence = random.randint(1, 15)
        satellite_damage = random.randint(40, 95)
        auto_approved = social_evidence >= 3 and satellite_damage >= 70
        
        claims.append({
            "claim_id": f"CLM-{uuid.uuid4().hex[:8]}",
            "event_id": event_id,
            "property_address": random.choice(addresses),
            "claim_amount": round(random.uniform(5000, 150000), 2),
            "verification_status": "auto_approved" if auto_approved else "pending_review",
            "social_evidence": social_evidence,
            "satellite_damage": satellite_damage,
            "auto_approved": auto_approved,
            "timestamp": datetime.now() - timedelta(minutes=random.randint(1, 120))
        })
    
    return claims

def generate_mock_clients():
    companies = [
        {"name": "Florida Mutual Insurance", "email": "claims@flmutual.com", "status": "trial_active"},
        {"name": "Sunstate Coverage Corp", "email": "operations@sunstate.com", "status": "paying_client"},
        {"name": "Gulf Coast Insurers", "email": "tech@gulfcoast.com", "status": "demo_sent"},
        {"name": "Lone Star Insurance", "email": "claims@lonestar.com", "status": "trial_active"},
        {"name": "Pacific Risk Management", "email": "api@pacificrisk.com", "status": "paying_client"}
    ]
    
    clients = []
    for company in companies:
        trial_events = random.randint(0, 5) if company["status"] == "trial_active" else 0
        revenue = random.uniform(1000, 25000) if company["status"] == "paying_client" else 0
        
        clients.append({
            "client_id": f"CLI-{uuid.uuid4().hex[:8]}",
            "company_name": company["name"],
            "email": company["email"],
            "status": company["status"],
            "trial_events": trial_events,
            "revenue_generated": round(revenue, 2),
            "signup_timestamp": datetime.now() - timedelta(days=random.randint(1, 30))
        })
    
    return clients

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.get("/api/agents/status")
async def get_agent_status():
    return {
        "geo_sentinel": {
            "status": "active",
            "last_scan": datetime.now() - timedelta(minutes=2),
            "events_detected": 3,
            "processing_time": "45s"
        },
        "claims_verifier": {
            "status": "active", 
            "claims_processed": 127,
            "auto_approved": 83,
            "pending_review": 17,
            "processing_rate": "2.3 claims/min"
        },
        "revenue_engine": {
            "status": "active",
            "demos_sent": 17,
            "trials_activated": 4,
            "revenue_72h": 8200.00,
            "conversion_rate": "23.5%"
        }
    }

@app.get("/api/disasters/active")
async def get_active_disasters():
    # Generate 2-3 active disasters
    disasters = []
    for i in range(random.randint(2, 3)):
        disasters.append(generate_mock_disaster())
    return disasters

@app.get("/api/disasters/{event_id}/analysis")
async def get_disaster_analysis(event_id: str):
    # Mock satellite analysis results
    return {
        "event_id": event_id,
        "satellite_analysis": {
            "area_affected_sqkm": random.randint(50, 200),
            "damage_severity": random.choice(["moderate", "severe", "catastrophic"]),
            "building_damage_count": random.randint(200, 1500),
            "estimated_loss": random.randint(5000000, 50000000),
            "confidence_score": round(random.uniform(0.85, 0.98), 2)
        },
        "social_signals": {
            "total_posts": random.randint(50, 300),
            "damage_keywords": random.randint(25, 150),
            "geo_tagged_reports": random.randint(10, 80),
            "sentiment_analysis": "urgent_assistance_needed"
        }
    }

@app.get("/api/claims/event/{event_id}")
async def get_event_claims(event_id: str):
    claims = generate_mock_claims(event_id, random.randint(30, 80))
    return {
        "event_id": event_id,
        "total_claims": len(claims),
        "auto_approved": len([c for c in claims if c["auto_approved"]]),
        "pending_review": len([c for c in claims if not c["auto_approved"]]),
        "total_value": sum([c["claim_amount"] for c in claims]),
        "claims": claims[:20]  # Return first 20 for display
    }

@app.get("/api/revenue/dashboard")
async def get_revenue_dashboard():
    clients = generate_mock_clients()
    
    return {
        "total_clients": len(clients),
        "active_trials": len([c for c in clients if c["status"] == "trial_active"]),
        "paying_clients": len([c for c in clients if c["status"] == "paying_client"]),
        "total_revenue": sum([c["revenue_generated"] for c in clients]),
        "revenue_72h": 8200.00,
        "conversion_rate": 23.5,
        "clients": clients
    }

@app.post("/api/simulate/new-disaster")
async def simulate_new_disaster():
    # Simulate the complete workflow
    disaster = generate_mock_disaster()
    claims = generate_mock_claims(disaster["event_id"], random.randint(40, 70))
    
    # Simulate revenue engine response
    demo_sent_count = random.randint(10, 20)
    trials_activated = random.randint(2, 5)
    
    return {
        "disaster": disaster,
        "claims_generated": len(claims),
        "auto_approved": len([c for c in claims if c["auto_approved"]]),
        "demos_sent": demo_sent_count,
        "trials_activated": trials_activated,
        "estimated_revenue": trials_activated * 1200
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)