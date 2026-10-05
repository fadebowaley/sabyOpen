"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  ChevronDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Download,
  Filter,
  Calendar,
} from "lucide-react";

interface OverviewCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string;
  trendIcon?: React.ReactNode;
  className?: string;
  progressValue?: number;
  status?: "success" | "warning" | "info";
  titleClassName?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendIcon,
  className = "",
  progressValue,
  status = "info",
  titleClassName,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 card-hover ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        {trend && (
          <div className="flex items-center space-x-1 text-sm">
            {trendIcon}
            <span className={getStatusColor()}>{trend}</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-black mb-1">{value}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>

      {progressValue && (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-black h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressValue}%` }}></div>
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {progressValue}%
          </span>
        </div>
      )}
    </div>
  );
};

export default function ApiOverview() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("7d");
  const [realTimeData, setRealTimeData] = useState({
    activeKeys: 3,
    uptime: 99.8,
    requestsToday: 1200000,
    avgResponse: 145,
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData((prev) => ({
        ...prev,
        requestsToday: prev.requestsToday + Math.floor(Math.random() * 100),
        avgResponse: Math.max(
          80,
          Math.min(200, prev.avgResponse + (Math.random() - 0.5) * 10)
        ),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setRealTimeData((prev) => ({
      ...prev,
      uptime: Math.max(
        95,
        Math.min(100, prev.uptime + (Math.random() - 0.5) * 2)
      ),
      avgResponse: Math.floor(Math.random() * 100) + 80,
    }));
    setIsRefreshing(false);
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: realTimeData,
      dateRange,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-overview-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 mb-6 animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">API Overview</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-subtle"></div>
            <span className="text-sm text-gray-500">Live Data</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black/5">
              <option value="1d">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={exportData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={refreshData}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isRefreshing ? "animate-spin" : ""}`}>
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors micro-bounce">
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 text-gray-600" />
            ) : (
              <Minimize2 className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <OverviewCard
              title="Active API Keys"
              value={realTimeData.activeKeys.toString()}
              subtitle="Active API Keys"
              icon={<Zap className="h-6 w-6 text-black" />}
              trend="+12%"
              trendIcon={<TrendingUp className="h-3 w-3 text-black" />}
              className="bg-gray-50 text-black border-4 border-black"
              progressValue={75}
              status="success"
            />

            <OverviewCard
              title="System Uptime"
              value={`${realTimeData.uptime.toFixed(1)}%`}
              subtitle={`Last ${dateRange === "1d" ? "24 hours" : dateRange === "7d" ? "7 days" : dateRange === "30d" ? "30 days" : "90 days"}`}
              icon={<Activity className="h-6 w-6 text-gray-600" />}
              trend="Excellent"
              trendIcon={<CheckCircle className="h-3 w-3 text-green-600" />}
              className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-green-100"
              status="success"
              titleClassName="text-gray-600"
            />

            <OverviewCard
              title="Requests Today"
              value={`${(realTimeData.requestsToday / 1000000).toFixed(1)}M`}
              subtitle="API Requests"
              icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
              trend="+18%"
              trendIcon={<TrendingUp className="h-3 w-3 text-green-600" />}
              className="bg-gradient-to-br from-blue-50 to-blue-100"
              status="success"
            />

            <OverviewCard
              title="Avg Response"
              value={`${Math.round(realTimeData.avgResponse)}ms`}
              subtitle="Response Time"
              icon={<Clock className="h-6 w-6 text-purple-600" />}
              trend="Fast"
              trendIcon={<CheckCircle className="h-3 w-3 text-green-600" />}
              className="bg-gradient-to-br from-purple-50 to-purple-100"
              status="success"
            />
          </div>

          {/* Enhanced Quick Stats Row */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">247</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                  <div className="text-xs text-green-600 mt-1">
                    +8% from yesterday
                  </div>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">2</div>
                  <div className="text-sm text-gray-600">Active Incidents</div>
                  <div className="text-xs text-orange-600 mt-1">
                    1 resolved today
                  </div>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">98.7%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                  <div className="text-xs text-green-600 mt-1">
                    +0.3% improvement
                  </div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-black mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">
                  API key "Production API" used successfully
                </span>
                <span className="text-gray-400">2 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600">
                  New endpoint monitoring started for /api/users
                </span>
                <span className="text-gray-400">5 minutes ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600">
                  Rate limit threshold reached for client 192.168.1.100
                </span>
                <span className="text-gray-400">8 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
