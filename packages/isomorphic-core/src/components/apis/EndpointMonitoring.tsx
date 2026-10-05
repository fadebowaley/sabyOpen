'use client'

import React, { useState } from 'react';
import { 
  Server, 
  ChevronDown, 
  ChevronUp,
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  Minimize2,
  Maximize2,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  path: string;
  status: 'online' | 'maintenance' | 'offline';
  responseTime: number;
  successRate: number;
  uptime: number;
  lastChecked: string;
  incidents: Incident[];
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

interface Incident {
  id: string;
  timestamp: string;
  type: 'downtime' | 'slow_response' | 'error';
  duration: string;
  description: string;
}

const methodColors = {
  GET: 'bg-green-100 text-green-700 border-green-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-orange-100 text-orange-700 border-orange-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200'
};

const statusColors = {
  online: 'text-green-600',
  maintenance: 'text-orange-600',
  offline: 'text-red-600'
};

const statusIcons = {
  online: <CheckCircle className="h-4 w-4" />,
  maintenance: <AlertTriangle className="h-4 w-4" />,
  offline: <XCircle className="h-4 w-4" />
};

export default function EndpointMonitoring() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [showIncidents, setShowIncidents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    {
      id: '1',
      method: 'POST',
      name: 'User Authentication',
      path: '/api/auth/login',
      status: 'online',
      responseTime: 145,
      successRate: 99.8,
      uptime: 99.9,
      lastChecked: '2 minutes ago',
      avgResponseTime: 142,
      minResponseTime: 89,
      maxResponseTime: 234,
      incidents: [
        {
          id: '1',
          timestamp: '2024-01-15 14:30',
          type: 'slow_response',
          duration: '5 minutes',
          description: 'Response time exceeded 500ms threshold'
        }
      ]
    },
    {
      id: '2',
      method: 'GET',
      name: 'Get User Profile',
      path: '/api/users/profile',
      status: 'online',
      responseTime: 89,
      successRate: 99.9,
      uptime: 100,
      lastChecked: '1 minute ago',
      avgResponseTime: 95,
      minResponseTime: 67,
      maxResponseTime: 156,
      incidents: []
    },
    {
      id: '3',
      method: 'PUT',
      name: 'Update Settings',
      path: '/api/settings',
      status: 'maintenance',
      responseTime: 234,
      successRate: 95.2,
      uptime: 98.5,
      lastChecked: '3 minutes ago',
      avgResponseTime: 198,
      minResponseTime: 145,
      maxResponseTime: 456,
      incidents: [
        {
          id: '2',
          timestamp: '2024-01-15 12:00',
          type: 'downtime',
          duration: '15 minutes',
          description: 'Scheduled maintenance window'
        },
        {
          id: '3',
          timestamp: '2024-01-14 09:15',
          type: 'error',
          duration: '2 minutes',
          description: 'Database connection timeout'
        }
      ]
    },
    {
      id: '4',
      method: 'DELETE',
      name: 'Delete User',
      path: '/api/users/:id',
      status: 'online',
      responseTime: 156,
      successRate: 98.7,
      uptime: 99.2,
      lastChecked: '30 seconds ago',
      avgResponseTime: 167,
      minResponseTime: 123,
      maxResponseTime: 289,
      incidents: []
    }
  ]);

  const refreshEndpoints = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update last checked times and potentially status
    setEndpoints(prev => prev.map(endpoint => ({
      ...endpoint,
      lastChecked: 'Just now',
      responseTime: Math.floor(Math.random() * 100) + 80 // Random response time
    })));
    
    setIsRefreshing(false);
  };

  const testEndpoint = async (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (!endpoint) return;

    // Simulate test request
    const testResponseTime = Math.floor(Math.random() * 200) + 50;
    
    setEndpoints(prev => prev.map(e => 
      e.id === endpointId 
        ? { ...e, responseTime: testResponseTime, lastChecked: 'Just now' }
        : e
    ));
  };

  if (isMinimized) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-black" />
            <h2 className="text-lg font-semibold text-black">Endpoint Monitoring</h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">{endpoints.filter(e => e.status === 'online').length} online</span>
            </div>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-6">
      <div 
        className="px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Server className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">Endpoint Monitoring</h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">{endpoints.filter(e => e.status === 'online').length} online</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshEndpoints();
            }}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Minimize2 className="h-4 w-4 text-gray-600" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">{endpoints.filter(e => e.status === 'online').length}</div>
                  <div className="text-sm text-gray-600">Online</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">{endpoints.filter(e => e.status === 'maintenance').length}</div>
                  <div className="text-sm text-gray-600">Maintenance</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {Math.round(endpoints.reduce((acc, e) => acc + e.responseTime, 0) / endpoints.length)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {Math.round(endpoints.reduce((acc, e) => acc + e.uptime, 0) / endpoints.length * 10) / 10}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Uptime</div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-md border ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <h3 className="text-lg font-semibold text-black">{endpoint.name}</h3>
                      <div className={`flex items-center space-x-1 ${statusColors[endpoint.status]}`}>
                        {statusIcons[endpoint.status]}
                        <span className="text-sm font-medium capitalize">{endpoint.status}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 font-mono mb-4 bg-gray-50 px-3 py-2 rounded-lg">
                      {endpoint.path}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>Response: {endpoint.responseTime}ms</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Success: {endpoint.successRate}%</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Activity className="h-3 w-3" />
                        <span>Uptime: {endpoint.uptime}%</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <RefreshCw className="h-3 w-3" />
                        <span>Checked: {endpoint.lastChecked}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedEndpoint(selectedEndpoint === endpoint.id ? null : endpoint.id)}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => testEndpoint(endpoint.id)}
                      className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Test</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedEndpoint === endpoint.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Response Time Metrics */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">Response Time Metrics</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average:</span>
                            <span className="text-sm font-medium">{endpoint.avgResponseTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Minimum:</span>
                            <span className="text-sm font-medium text-green-600">{endpoint.minResponseTime}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Maximum:</span>
                            <span className="text-sm font-medium text-red-600">{endpoint.maxResponseTime}ms</span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Incidents */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-black">Recent Incidents</h4>
                          {endpoint.incidents.length > 0 && (
                            <button
                              onClick={() => setShowIncidents(!showIncidents)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              {showIncidents ? 'Hide' : 'Show All'}
                            </button>
                          )}
                        </div>
                        {endpoint.incidents.length === 0 ? (
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>No recent incidents</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {endpoint.incidents.slice(0, showIncidents ? undefined : 2).map((incident) => (
                              <div key={incident.id} className="flex items-start space-x-2 text-sm">
                                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-gray-900">{incident.description}</div>
                                  <div className="text-gray-500">{incident.timestamp} • {incident.duration}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Uptime Chart Placeholder */}
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-black mb-3">Uptime Chart (Last 24 Hours)</h4>
                      <div className="h-20 flex items-end justify-between space-x-1">
                        {Array.from({ length: 24 }, (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t ${
                              Math.random() > 0.05 ? 'bg-green-400' : 'bg-red-400'
                            }`}
                            style={{ height: `${Math.random() * 60 + 40}%` }}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>24h ago</span>
                        <span>Now</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}