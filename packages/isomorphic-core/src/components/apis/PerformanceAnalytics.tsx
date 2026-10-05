'use client'

import React, { useState } from 'react';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  BarChart3,
  Activity,
  Clock,
  Users
} from 'lucide-react';

export default function PerformanceAnalytics() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-6">
      <div 
        className="px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">Performance Analytics</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">+15%</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">2.4M</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-green-600" />
                <span className="text-sm text-green-600 font-medium">99.9%</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">Uptime</div>
              <div className="text-sm text-gray-600">Last 30 days</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">-5ms</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">142ms</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">+8%</span>
              </div>
              <div className="text-2xl font-bold text-black mb-1">1,247</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Request Volume (Last 7 Days)</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[65, 78, 82, 95, 88, 92, 100].map((height, index) => (
                <div key={index} className="flex-1 bg-black rounded-t-lg transition-all duration-500 hover:bg-gray-700" style={{ height: `${height}%` }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}