import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import DisasterMap from './DisasterMap';
import GlobeView from './GlobeView';
import { 
  MapPin, 
  Satellite, 
  TrendingUp, 
  Activity,
  Globe,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const GeospatialDashboard = () => {
  const [disasters, setDisasters] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAnalysis, setEventAnalysis] = useState(null);
  const [claims, setClaims] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    processingRate: 0,
    activeClaims: 0,
    responseTime: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    const realtimeInterval = setInterval(updateRealtimeData, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(realtimeInterval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [disastersRes, agentStatusRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/disasters/active`),
        fetch(`${BACKEND_URL}/api/agents/status`)
      ]);
      
      const disastersData = await disastersRes.json();
      const agentData = await agentStatusRes.json();
      
      setDisasters(disastersData);
      setAgentStatus(agentData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const [analysisResponse, claimsResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/api/disasters/${eventId}/analysis`),
        fetch(`${BACKEND_URL}/api/claims/event/${eventId}`)
      ]);
      
      const analysis = await analysisResponse.json();
      const claimsData = await claimsResponse.json();
      
      setEventAnalysis(analysis);
      setClaims(claimsData);
      setSelectedEvent(eventId);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const updateRealtimeData = () => {
    setRealtimeData(prev => ({
      processingRate: prev.processingRate + Math.random() * 0.2 - 0.1,
      activeClaims: prev.activeClaims + Math.floor(Math.random() * 3 - 1),
      responseTime: 45 + Math.random() * 10 - 5
    }));
  };

  const getAgentStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Bar */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Activity className="w-4 h-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-blue-800 font-medium">
            Real-time Geospatial Intelligence Active
          </span>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-blue-600">
              Processing Rate: {realtimeData.processingRate.toFixed(1)} events/min
            </span>
            <span className="text-green-600">
              Response Time: {realtimeData.responseTime.toFixed(0)}s
            </span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
              <span className="text-green-600">Live</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agentStatus && Object.entries(agentStatus).map(([agentName, status]) => (
          <Card key={agentName} className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {agentName.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">
                      {status.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {agentName === 'geo_sentinel' && (
                    <div className="text-2xl font-bold text-blue-600">
                      {status.events_detected}
                    </div>
                  )}
                  {agentName === 'claims_verifier' && (
                    <div className="text-2xl font-bold text-green-600">
                      {status.auto_approved}
                    </div>
                  )}
                  {agentName === 'revenue_engine' && (
                    <div className="text-2xl font-bold text-purple-600">
                      ${status.revenue_72h?.toLocaleString() || 0}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Geospatial Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Interactive Map */}
        <div className="xl:col-span-2">
          <Card className="h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Satellite className="w-5 h-5 mr-2 text-blue-600" />
                Real-time Disaster Mapping
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {disasters.length} Active Events
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[520px]">
              <DisasterMap 
                disasters={disasters}
                onEventSelect={fetchEventDetails}
                selectedEvent={selectedEvent}
                claims={claims}
              />
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* 3D Globe View */}
          <GlobeView 
            disasters={disasters}
            onEventSelect={fetchEventDetails}
          />

          {/* Event Analysis */}
          {selectedEvent && eventAnalysis && (
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                  Event Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Satellite Analysis</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Area Affected:</span>
                      <div className="font-semibold">{eventAnalysis.satellite_analysis.area_affected_sqkm} km²</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Severity:</span>
                      <Badge variant="outline" className="capitalize">
                        {eventAnalysis.satellite_analysis.damage_severity}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Buildings:</span>
                      <div className="font-semibold">{eventAnalysis.satellite_analysis.building_damage_count}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Loss Estimate:</span>
                      <div className="font-semibold text-red-600">
                        ${(eventAnalysis.satellite_analysis.estimated_loss / 1000000).toFixed(1)}M
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Social Intelligence</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Posts Analyzed:</span>
                      <div className="font-semibold">{eventAnalysis.social_signals.total_posts}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Damage Reports:</span>
                      <div className="font-semibold">{eventAnalysis.social_signals.damage_keywords}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Geo-tagged Evidence:</span>
                      <div className="font-semibold text-blue-600">
                        {eventAnalysis.social_signals.geo_tagged_reports} verified locations
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claims Processing Status */}
          {claims && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Claims Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Claims:</span>
                    <span className="font-bold text-2xl">{claims.total_claims}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white bg-opacity-70 p-2 rounded text-center">
                      <div className="text-lg font-bold text-green-600">{claims.auto_approved}</div>
                      <div className="text-xs text-gray-600">Auto Approved</div>
                    </div>
                    <div className="bg-white bg-opacity-70 p-2 rounded text-center">
                      <div className="text-lg font-bold text-orange-600">{claims.pending_review}</div>
                      <div className="text-xs text-gray-600">Under Review</div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-2 border-t">
                    <div className="text-lg font-bold text-blue-600">
                      ${(claims.total_value / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-gray-600">Total Claim Value</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <Card className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            Advanced Geospatial Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {disasters.reduce((sum, d) => sum + d.damage_score, 0)}
              </div>
              <div className="text-sm text-gray-300">Cumulative Damage Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {disasters.reduce((sum, d) => sum + d.coordinates.radius_km, 0)} km
              </div>
              <div className="text-sm text-gray-300">Total Impact Radius</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {Math.round(disasters.reduce((sum, d) => sum + d.confidence, 0) / disasters.length * 100 || 0)}%
              </div>
              <div className="text-sm text-gray-300">Avg. Confidence Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {disasters.filter(d => d.damage_score > 80).length}
              </div>
              <div className="text-sm text-gray-300">Critical Events</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeospatialDashboard;