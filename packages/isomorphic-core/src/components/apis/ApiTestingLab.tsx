'use client'

import React, { useState } from 'react';
import { 
  Play, 
  ChevronDown, 
  ChevronUp,
  Code,
  Send,
  Save,
  Trash2,
  Plus,
  Copy,
  Download,
  Minimize2,
  Maximize2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TestCase {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  createdAt: string;
}

interface TestResponse {
  status: number;
  statusText: string;
  responseTime: number;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
}

export default function ApiTestingLab() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [testCaseName, setTestCaseName] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'saved' | 'history'>('builder');
  
  const [requestData, setRequestData] = useState({
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: '{\n  "Authorization": "Bearer token",\n  "Content-Type": "application/json"\n}',
    body: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}'
  });

  const [response, setResponse] = useState<TestResponse | null>({
    status: 200,
    statusText: 'OK',
    responseTime: 145,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': '156'
    },
    body: '{\n  "id": 1,\n  "name": "John Doe",\n  "email": "john@example.com",\n  "created_at": "2024-01-15T10:30:00Z"\n}',
    timestamp: new Date().toISOString()
  });

  const [savedTestCases, setSavedTestCases] = useState<TestCase[]>([
    {
      id: '1',
      name: 'Get User Profile',
      method: 'GET',
      url: 'https://api.example.com/users/profile',
      headers: { 'Authorization': 'Bearer token' },
      body: '',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Create New User',
      method: 'POST',
      url: 'https://api.example.com/users',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name": "Jane Doe", "email": "jane@example.com"}',
      createdAt: '2024-01-14'
    }
  ]);

  const [requestHistory, setRequestHistory] = useState<(TestResponse & { request: any })[]>([
    {
      ...response!,
      request: { method: 'GET', url: 'https://api.example.com/users', timestamp: '2024-01-15T10:30:00Z' }
    }
  ]);

  const sendRequest = async () => {
    setIsLoading(true);
    
    // Simulate API request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
    
    const mockResponse: TestResponse = {
      status: Math.random() > 0.2 ? 200 : 400,
      statusText: Math.random() > 0.2 ? 'OK' : 'Bad Request',
      responseTime: Math.floor(Math.random() * 500) + 50,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': '156',
        'X-RateLimit-Remaining': '99'
      },
      body: requestData.method === 'GET' 
        ? '{\n  "users": [\n    {"id": 1, "name": "John Doe"},\n    {"id": 2, "name": "Jane Smith"}\n  ]\n}'
        : '{\n  "id": 3,\n  "name": "New User",\n  "created_at": "' + new Date().toISOString() + '"\n}',
      timestamp: new Date().toISOString()
    };
    
    setResponse(mockResponse);
    setRequestHistory(prev => [{
      ...mockResponse,
      request: { 
        method: requestData.method, 
        url: requestData.url, 
        timestamp: mockResponse.timestamp 
      }
    }, ...prev.slice(0, 9)]); // Keep last 10 requests
    
    setIsLoading(false);
  };

  const saveTestCase = () => {
    if (!testCaseName.trim()) return;
    
    const newTestCase: TestCase = {
      id: Date.now().toString(),
      name: testCaseName,
      method: requestData.method,
      url: requestData.url,
      headers: JSON.parse(requestData.headers || '{}'),
      body: requestData.body,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setSavedTestCases(prev => [newTestCase, ...prev]);
    setTestCaseName('');
    setShowSaveDialog(false);
  };

  const loadTestCase = (testCase: TestCase) => {
    setRequestData({
      method: testCase.method,
      url: testCase.url,
      headers: JSON.stringify(testCase.headers, null, 2),
      body: testCase.body
    });
    setActiveTab('builder');
  };

  const deleteTestCase = (id: string) => {
    setSavedTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResponse = () => {
    const data = {
      request: requestData,
      response: response,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-test-${Date.now()}.json`;
    a.click();
  };

  if (isMinimized) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Play className="h-5 w-5 text-black" />
            <h2 className="text-lg font-semibold text-black">API Testing Lab</h2>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-500">{savedTestCases.length} saved tests</span>
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
          <Play className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">API Testing Lab</h2>
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-500">{savedTestCases.length} saved tests</span>
        </div>
        <div className="flex items-center space-x-2">
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
          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'builder' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Request Builder
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'saved' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Saved Tests ({savedTestCases.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              History ({requestHistory.length})
            </button>
          </div>

          {/* Request Builder Tab */}
          {activeTab === 'builder' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Request Configuration</h3>
                  <button
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Test</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Method
                    </label>
                    <select 
                      value={requestData.method}
                      onChange={(e) => setRequestData({...requestData, method: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                      <option>PATCH</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={requestData.url}
                      onChange={(e) => setRequestData({...requestData, url: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Headers (JSON)
                  </label>
                  <textarea
                    value={requestData.headers}
                    onChange={(e) => setRequestData({...requestData, headers: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm"
                    placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  />
                </div>
                
                {requestData.method !== 'GET' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Request Body (JSON)
                    </label>
                    <textarea
                      value={requestData.body}
                      onChange={(e) => setRequestData({...requestData, body: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-black/5 font-mono text-sm"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}
                
                <button 
                  onClick={sendRequest}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Request</span>
                    </>
                  )}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">Response</h3>
                  {response && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(response.body)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={exportResponse}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                </div>
                
                {response ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`bg-gray-50 rounded-lg p-4 ${
                        response.status >= 200 && response.status < 300 ? 'border-l-4 border-green-500' :
                        response.status >= 400 ? 'border-l-4 border-red-500' : 'border-l-4 border-orange-500'
                      }`}>
                        <div className="text-sm text-gray-600 mb-1">Status Code</div>
                        <div className={`text-lg font-semibold ${
                          response.status >= 200 && response.status < 300 ? 'text-green-600' :
                          response.status >= 400 ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          {response.status} {response.statusText}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Response Time</div>
                        <div className="text-lg font-semibold text-black flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{response.responseTime}ms</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Response Headers
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-sm max-h-32 overflow-auto">
                        {Object.entries(response.headers).map(([key, value]) => (
                          <div key={key} className="text-gray-700">
                            <span className="text-blue-600">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Response Body
                      </label>
                      <div className="border border-gray-200 rounded-lg p-4 h-64 bg-gray-50 font-mono text-sm overflow-auto">
                        <pre className="text-gray-700 whitespace-pre-wrap">{response.body}</pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                    <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <div>Response will appear here after sending a request</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Tests Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Saved Test Cases</h3>
                <span className="text-sm text-gray-500">{savedTestCases.length} saved tests</span>
              </div>
              
              {savedTestCases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Save className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div>No saved test cases yet</div>
                  <div className="text-sm">Save your requests from the builder tab</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTestCases.map((testCase) => (
                    <div key={testCase.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              testCase.method === 'GET' ? 'bg-green-100 text-green-700' :
                              testCase.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                              testCase.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {testCase.method}
                            </span>
                            <h4 className="font-semibold text-black">{testCase.name}</h4>
                          </div>
                          <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">
                            {testCase.url}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {testCase.createdAt}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => loadTestCase(testCase)}
                            className="flex items-center space-x-1 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                          >
                            <Play className="h-3 w-3" />
                            <span>Load</span>
                          </button>
                          <button
                            onClick={() => deleteTestCase(testCase.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Request History</h3>
                <span className="text-sm text-gray-500">{requestHistory.length} recent requests</span>
              </div>
              
              {requestHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div>No request history yet</div>
                  <div className="text-sm">Your sent requests will appear here</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {requestHistory.map((item, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            item.request.method === 'GET' ? 'bg-green-100 text-green-700' :
                            item.request.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                            item.request.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.request.method}
                          </span>
                          <div className="text-sm text-gray-600 font-mono">
                            {item.request.url}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className={`flex items-center space-x-1 ${
                            item.status >= 200 && item.status < 300 ? 'text-green-600' :
                            item.status >= 400 ? 'text-red-600' : 'text-orange-600'
                          }`}>
                            {item.status >= 200 && item.status < 300 ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span>{item.status}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>{item.responseTime}ms</span>
                          </div>
                          <div className="text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Save Test Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-black rounded-lg">
                <Save className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-black">Save Test Case</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Test Case Name
              </label>
              <input
                type="text"
                value={testCaseName}
                onChange={(e) => setTestCaseName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black"
                placeholder="Enter a descriptive name..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={saveTestCase}
                disabled={!testCaseName.trim()}
                className="flex-1 bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Test
              </button>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTestCaseName('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}