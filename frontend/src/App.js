import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Progress } from './components/ui/progress';
import GeospatialDashboard from './components/GeospatialDashboard';
import { 
  Activity, 
  MapPin, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Zap,
  Globe,
  BarChart3,
  Satellite,
  Brain,
  Shield
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [agentStatus, setAgentStatus] = useState(null);
  const [disasters, setDisasters] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAnalysis, setEventAnalysis] = useState(null);
  const [claims, setClaims] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchAgentStatus();
    fetchActiveDisasters();
    fetchRevenueData();
    
    const interval = setInterval(() => {
      fetchAgentStatus();
      fetchActiveDisasters();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/agents/status`);
      const data = await response.json();
      setAgentStatus(data);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const fetchActiveDisasters = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/disasters/active`);
      const data = await response.json();
      setDisasters(data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/revenue/dashboard`);
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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

  const simulateNewDisaster = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulate/new-disaster`, {
        method: 'POST'
      });
      const simulation = await response.json();
      
      setTimeout(() => {
        fetchActiveDisasters();
        fetchRevenueData();
        setIsSimulating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error simulating disaster:', error);
      setIsSimulating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  CatastropheIQ
                </h1>
                <p className="text-sm text-gray-600 font-medium">Multi-Agent Geospatial Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Live Status Indicator */}
              <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                <span className="text-green-700 text-sm font-medium">Live Intelligence</span>
              </div>
              
              <Button 
                onClick={simulateNewDisaster} 
                disabled={isSimulating}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg"
              >
                {isSimulating ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Simulate Disaster
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* AI Agent Status Dashboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            AI Agent Command Center
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agentStatus && Object.entries(agentStatus).map(([agentName, status]) => (
              <Card key={agentName} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold capitalize flex items-center">
                      {agentName === 'geo_sentinel' && <Satellite className="w-5 h-5 mr-2 text-blue-600" />}
                      {agentName === 'claims_verifier' && <Shield className="w-5 h-5 mr-2 text-green-600" />}
                      {agentName === 'revenue_engine' && <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />}
                      {agentName.replace('_', '-')}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)} animate-pulse`} />
                      <Badge variant="outline" className="text-xs">
                        {status.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {agentName === 'geo_sentinel' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Events Detected:</span>
                          <span className="font-bold text-2xl text-blue-600">{status.events_detected}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Processing Time:</span>
                          <span className="font-semibold text-green-600">{status.processing_time}</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <span className="text-xs text-gray-500">Scanning global satellites...</span>
                      </>
                    )}
                    {agentName === 'claims_verifier' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Claims Processed:</span>
                          <span className="font-bold text-2xl text-green-600">{status.claims_processed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Auto Approved:</span>
                          <span className="font-semibold text-green-600">{status.auto_approved}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Processing Rate:</span>
                          <span className="font-semibold text-blue-600">{status.processing_rate}</span>
                        </div>
                      </>
                    )}
                    {agentName === 'revenue_engine' && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Demos Sent:</span>
                          <span className="font-bold text-2xl text-purple-600">{status.demos_sent}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">72h Revenue:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(status.revenue_72h)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 text-sm">Conversion:</span>
                          <span className="font-semibold text-indigo-600">{status.conversion_rate}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Tabs defaultValue="geospatial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
            <TabsTrigger value="geospatial" className="flex items-center">
              <Satellite className="w-4 h-4 mr-2" />
              Geospatial Intelligence
            </TabsTrigger>
            <TabsTrigger value="disasters" className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Active Disasters
            </TabsTrigger>
            <TabsTrigger value="claims" className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Claims Processing
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Revenue Dashboard
            </TabsTrigger>
          </TabsList>

          {/* Geospatial Intelligence Tab */}
          <TabsContent value="geospatial">
            <GeospatialDashboard />
          </TabsContent>

          {/* Active Disasters Tab */}
          <TabsContent value="disasters" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                    Active Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {disasters.map((disaster) => (
                      <div 
                        key={disaster.event_id}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border-l-4 border-l-red-500"
                        onClick={() => fetchEventDetails(disaster.event_id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{disaster.title}</h3>
                          <Badge variant="destructive" className="ml-2">
                            {disaster.event_type}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          Impact Radius: {disaster.coordinates.radius_km} km
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-600">Damage Score: </span>
                            <span className="font-semibold text-red-600">{disaster.damage_score}/100</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Confidence: </span>
                            <span className="font-semibold text-green-600">{Math.round(disaster.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedEvent && eventAnalysis && (
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-blue-500" />
                      Event Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-white bg-opacity-80 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Satellite Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Area Affected:</span>
                            <div className="font-semibold text-lg">{eventAnalysis.satellite_analysis.area_affected_sqkm} km²</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Damage Severity:</span>
                            <Badge variant="outline" className="capitalize mt-1">
                              {eventAnalysis.satellite_analysis.damage_severity}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-gray-600">Buildings Affected:</span>
                            <div className="font-semibold text-lg">{eventAnalysis.satellite_analysis.building_damage_count}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Estimated Loss:</span>
                            <div className="font-semibold text-lg text-red-600">
                              {formatCurrency(eventAnalysis.satellite_analysis.estimated_loss)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white bg-opacity-80 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Social Media Intelligence</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Posts:</span>
                            <div className="font-semibold text-lg">{eventAnalysis.social_signals.total_posts}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Damage Keywords:</span>
                            <div className="font-semibold text-lg">{eventAnalysis.social_signals.damage_keywords}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Geo-tagged Reports:</span>
                            <div className="font-semibold text-lg text-blue-600">{eventAnalysis.social_signals.geo_tagged_reports}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Claims Processing Tab */}
          <TabsContent value="claims" className="space-y-6">
            {claims && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Claims Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{claims.total_claims}</div>
                        <div className="text-sm text-gray-600">Total Claims</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{claims.auto_approved}</div>
                          <div className="text-xs text-gray-600">Auto Approved</div>
                        </div>
                        <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{claims.pending_review}</div>
                          <div className="text-xs text-gray-600">Pending Review</div>
                        </div>
                      </div>
                      <div className="text-center pt-3 border-t">
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(claims.total_value)}</div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-lg">
                  <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {claims.claims.map((claim) => (
                        <div key={claim.claim_id} className="p-4 border rounded-lg border-l-4 border-l-blue-500">
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {claim.property_address}
                            </div>
                            <Badge 
                              variant={claim.auto_approved ? "default" : "outline"}
                              className={claim.auto_approved ? "bg-green-100 text-green-800" : ""}
                            >
                              {claim.verification_status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-2 font-semibold">
                            Amount: {formatCurrency(claim.claim_amount)}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Social Evidence: {claim.social_evidence} posts</span>
                            <span>Satellite Damage: {claim.satellite_damage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Revenue Dashboard Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {revenueData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                          <div className="text-3xl font-bold">{revenueData.total_clients}</div>
                          <div className="text-sm text-gray-600">Total Clients</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-orange-500" />
                        <div className="ml-4">
                          <div className="text-3xl font-bold">{revenueData.active_trials}</div>
                          <div className="text-sm text-gray-600">Active Trials</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                          <div className="text-3xl font-bold">{revenueData.paying_clients}</div>
                          <div className="text-sm text-gray-600">Paying Clients</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <div className="text-3xl font-bold">{formatCurrency(revenueData.revenue_72h)}</div>
                          <div className="text-sm text-gray-600">72h Revenue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Client Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueData.clients.map((client) => (
                        <div key={client.client_id} className="flex items-center justify-between p-4 border rounded-lg border-l-4 border-l-green-500">
                          <div>
                            <div className="font-semibold text-gray-900">{client.company_name}</div>
                            <div className="text-sm text-gray-600">{client.email}</div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={client.status === 'paying_client' ? 'default' : 'outline'}
                              className="mb-2"
                            >
                              {client.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-sm font-semibold">
                              {client.status === 'paying_client' 
                                ? formatCurrency(client.revenue_generated)
                                : `${client.trial_events} trial events`
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;