import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Progress } from './components/ui/progress';
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
  BarChart3
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
    
    // Set up real-time updates
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
      
      // Refresh all data after simulation
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CatastropheIQ</h1>
                <p className="text-sm text-gray-600">Multi-Agent Geospatial Platform</p>
              </div>
            </div>
            <Button 
              onClick={simulateNewDisaster} 
              disabled={isSimulating}
              className="bg-orange-600 hover:bg-orange-700 text-white"
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
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Agent Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {agentStatus && Object.entries(agentStatus).map(([agentName, status]) => (
            <Card key={agentName} className="bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold capitalize">
                    {agentName.replace('_', '-')}
                  </CardTitle>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {agentName === 'geo_sentinel' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Events Detected:</span>
                        <span className="font-semibold">{status.events_detected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Time:</span>
                        <span className="font-semibold">{status.processing_time}</span>
                      </div>
                    </>
                  )}
                  {agentName === 'claims_verifier' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Claims Processed:</span>
                        <span className="font-semibold">{status.claims_processed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Auto Approved:</span>
                        <span className="font-semibold text-green-600">{status.auto_approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Rate:</span>
                        <span className="font-semibold">{status.processing_rate}</span>
                      </div>
                    </>
                  )}
                  {agentName === 'revenue_engine' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Demos Sent:</span>
                        <span className="font-semibold">{status.demos_sent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">72h Revenue:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(status.revenue_72h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversion:</span>
                        <span className="font-semibold">{status.conversion_rate}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="disasters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="disasters">Active Disasters</TabsTrigger>
            <TabsTrigger value="claims">Claims Processing</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Dashboard</TabsTrigger>
          </TabsList>

          {/* Active Disasters Tab */}
          <TabsContent value="disasters" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
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
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
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
                          Radius: {disaster.coordinates.radius_km}km
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-600">Damage Score: </span>
                            <span className="font-semibold">{disaster.damage_score}/100</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Confidence: </span>
                            <span className="font-semibold">{Math.round(disaster.confidence * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedEvent && eventAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Eye className="w-5 h-5 mr-2 text-blue-500" />
                      Event Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Satellite Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Area Affected:</span>
                            <span className="font-semibold">{eventAnalysis.satellite_analysis.area_affected_sqkm} km²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Damage Severity:</span>
                            <Badge variant="outline" className="capitalize">
                              {eventAnalysis.satellite_analysis.damage_severity}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Buildings Affected:</span>
                            <span className="font-semibold">{eventAnalysis.satellite_analysis.building_damage_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Loss:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(eventAnalysis.satellite_analysis.estimated_loss)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Social Media Signals</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Posts:</span>
                            <span className="font-semibold">{eventAnalysis.social_signals.total_posts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Damage Keywords:</span>
                            <span className="font-semibold">{eventAnalysis.social_signals.damage_keywords}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Geo-tagged Reports:</span>
                            <span className="font-semibold">{eventAnalysis.social_signals.geo_tagged_reports}</span>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Claims Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{claims.total_claims}</div>
                        <div className="text-sm text-gray-600">Total Claims</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-green-600">{claims.auto_approved}</div>
                          <div className="text-xs text-gray-600">Auto Approved</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-orange-600">{claims.pending_review}</div>
                          <div className="text-xs text-gray-600">Pending Review</div>
                        </div>
                      </div>
                      <div className="text-center pt-2 border-t">
                        <div className="text-xl font-bold text-blue-600">{formatCurrency(claims.total_value)}</div>
                        <div className="text-sm text-gray-600">Total Value</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Claims</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {claims.claims.map((claim) => (
                        <div key={claim.claim_id} className="p-3 border rounded-lg">
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
                          <div className="text-sm text-gray-600 mb-2">
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
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                          <div className="text-2xl font-bold">{revenueData.total_clients}</div>
                          <div className="text-sm text-gray-600">Total Clients</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <Clock className="w-8 h-8 text-orange-500" />
                        <div className="ml-4">
                          <div className="text-2xl font-bold">{revenueData.active_trials}</div>
                          <div className="text-sm text-gray-600">Active Trials</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                          <div className="text-2xl font-bold">{revenueData.paying_clients}</div>
                          <div className="text-sm text-gray-600">Paying Clients</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <div className="text-2xl font-bold">{formatCurrency(revenueData.revenue_72h)}</div>
                          <div className="text-sm text-gray-600">72h Revenue</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Client Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueData.clients.map((client) => (
                        <div key={client.client_id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900">{client.company_name}</div>
                            <div className="text-sm text-gray-600">{client.email}</div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={client.status === 'paying_client' ? 'default' : 'outline'}
                              className="mb-1"
                            >
                              {client.status.replace('_', ' ')}
                            </Badge>
                            <div className="text-sm text-gray-600">
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