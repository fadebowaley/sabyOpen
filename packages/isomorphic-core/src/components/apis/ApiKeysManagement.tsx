"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Key,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  Search,
  Calendar,
  Shield,
  Minimize2,
  Maximize2,
  Download,
  Upload,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useApiKeys } from "@/app/lib/hooks/useApiKeys";
import {
  ApiKey,
  CreateApiKeyPayload,
  UpdateApiKeyPayload,
} from "@/app/lib/api/apiKeys";
import toast from "react-hot-toast";

export default function ApiKeysManagement() {
  const { data: session } = useSession();
  const tenantId = session?.user?.id;

  // API hook
  const {
    loading,
    getApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    regenerateApiKey,
    batchDeleteApiKeys,
    toggleApiKeyStatus,
    getStatusColor,
    getEnvironmentColor,
    validateCreatePayload,
  } = useApiKeys();

  // Component state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showRawKey, setShowRawKey] = useState<{
    keyId: string;
    rawKey: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "label" | "created" | "lastUsed" | "usageCount"
  >("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Form state
  const [newKeyData, setNewKeyData] = useState<CreateApiKeyPayload>({
    label: "",
    scope: "api",
    environment: "development",
    permissions: ["read"],
    rateLimit: 1000,
  });

  const [editKeyData, setEditKeyData] = useState<UpdateApiKeyPayload>({});

  const itemsPerPage = 5;

  // Load API keys on component mount
  const loadApiKeys = useCallback(async () => {
    if (!tenantId) return;

    const filters = {
      page: currentPage,
      limit: itemsPerPage,
      environment:
        filterEnvironment !== "all" ? (filterEnvironment as any) : undefined,
      isActive:
        filterStatus === "active"
          ? true
          : filterStatus === "inactive"
            ? false
            : undefined,
      sortBy: `${sortBy}:${sortOrder}`,
    };

    const response = await getApiKeys(filters);
    if (response.success && response.data) {
      setApiKeys(response.data.results);
      setTotalResults(response.data.totalResults);
      setTotalPages(response.data.totalPages);
    }
  }, [
    tenantId,
    currentPage,
    filterEnvironment,
    filterStatus,
    sortBy,
    sortOrder,
    getApiKeys,
  ]);

  // Initial load and refresh on filter changes
  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApiKeys();
    setRefreshing(false);
    toast.success("API keys refreshed");
  };

  // Filter keys by search term (client-side for immediate feedback)
  const filteredKeys = apiKeys.filter((key) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      key.label.toLowerCase().includes(search) ||
      key.key.toLowerCase().includes(search) ||
      key.scope.toLowerCase().includes(search)
    );
  });

  // Toggle key visibility
  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  // Handle key status toggle
  const handleToggleKeyStatus = async (
    keyId: string,
    currentStatus: boolean
  ) => {
    const response = await toggleApiKeyStatus(keyId, !currentStatus);
    if (response.success) {
      await loadApiKeys(); // Refresh data
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Delete single key
  const handleDeleteKey = async (keyId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      const response = await deleteApiKey(keyId);
      if (response.success) {
        await loadApiKeys();
      }
    }
  };

  // Delete selected keys
  const handleDeleteSelectedKeys = async () => {
    if (selectedKeys.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedKeys.size} selected API keys? This action cannot be undone.`
      )
    ) {
      const response = await batchDeleteApiKeys(Array.from(selectedKeys));
      if (response.success) {
        setSelectedKeys(new Set());
        await loadApiKeys();
      }
    }
  };

  // Create new key
  const handleCreateNewKey = async () => {
    const errors = validateCreatePayload(newKeyData);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const response = await createApiKey(newKeyData);
    if (response.success && response.data) {
      setShowCreateForm(false);
      setNewKeyData({
        label: "",
        scope: "api",
        environment: "development",
        permissions: ["read"],
        rateLimit: 1000,
      });

      // Show the raw key to the user
      setShowRawKey({
        keyId: response.data.apiKey.id,
        rawKey: response.data.rawKey,
      });

      await loadApiKeys();
    }
  };

  // Update key
  const handleUpdateKey = async (keyId: string) => {
    const response = await updateApiKey(keyId, editKeyData);
    if (response.success) {
      setShowEditForm(null);
      setEditKeyData({});
      await loadApiKeys();
    }
  };

  // Regenerate key
  const handleRegenerateKey = async (keyId: string) => {
    if (
      confirm(
        "Are you sure you want to regenerate this API key? The old key will be permanently invalidated."
      )
    ) {
      const response = await regenerateApiKey(keyId);
      if (response.success && response.data) {
        setShowRawKey({
          keyId: response.data.apiKey.id,
          rawKey: response.data.rawKey,
        });
        await loadApiKeys();
      }
    }
  };

  // Export keys
  const exportKeys = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalKeys: totalResults,
      keys: apiKeys.map((key) => ({
        id: key.id,
        label: key.label,
        status: key.status,
        environment: key.environment,
        scope: key.scope,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        usageCount: key.usageCount,
        created: key.created,
        lastUsed: key.lastUsed,
        // Don't export actual keys for security
        key: "***REDACTED***",
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-keys-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Raw Key Display Modal
  const RawKeyModal = ({
    keyId,
    rawKey,
    onClose,
  }: {
    keyId: string;
    rawKey: string;
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">New API Key Generated</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Save this key now - you won't be able to see it again for security
            reasons.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg border">
            <code className="text-sm font-mono break-all">{rawKey}</code>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => copyToClipboard(rawKey)}
            className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Copy Key
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );

  // Create Form Modal
  const CreateForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New API Key</h3>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label
            </label>
            <input
              type="text"
              value={newKeyData.label}
              onChange={(e) =>
                setNewKeyData({ ...newKeyData, label: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="e.g., Production API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment
            </label>
            <select
              value={newKeyData.environment}
              onChange={(e) =>
                setNewKeyData({
                  ...newKeyData,
                  environment: e.target.value as any,
                })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5">
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scope
            </label>
            <input
              type="text"
              value={newKeyData.scope}
              onChange={(e) =>
                setNewKeyData({ ...newKeyData, scope: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="e.g., api, mobile, crm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2">
              {["read", "write", "delete", "admin"].map((permission) => (
                <label key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newKeyData.permissions?.includes(permission)}
                    onChange={(e) => {
                      const permissions = newKeyData.permissions || [];
                      if (e.target.checked) {
                        setNewKeyData({
                          ...newKeyData,
                          permissions: [...permissions, permission],
                        });
                      } else {
                        setNewKeyData({
                          ...newKeyData,
                          permissions: permissions.filter(
                            (p) => p !== permission
                          ),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              value={newKeyData.rateLimit}
              onChange={(e) =>
                setNewKeyData({
                  ...newKeyData,
                  rateLimit: parseInt(e.target.value),
                })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              min="1"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires (optional)
            </label>
            <input
              type="datetime-local"
              value={newKeyData.expires}
              onChange={(e) =>
                setNewKeyData({ ...newKeyData, expires: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        <div className="flex space-x-2 mt-6">
          <button
            onClick={handleCreateNewKey}
            disabled={loading}
            className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Key"}
          </button>
          <button
            onClick={() => setShowCreateForm(false)}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // Minimized view
  if (isMinimized) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-black" />
            <h2 className="text-lg font-semibold text-black">
              API Keys Management
            </h2>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">{totalResults} keys</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div
          className="px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center space-x-3">
            <Key className="h-5 w-5 text-black" />
            <h2 className="text-lg font-semibold text-black">
              API Keys Management
            </h2>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">{totalResults} keys</span>
            {loading && (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw
                className={`h-4 w-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                exportKeys();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Download className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
            {/* Search and Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search API keys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 w-64"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                  <select
                    value={filterEnvironment}
                    onChange={(e) => setFilterEnvironment(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5">
                    <option value="all">All Environments</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredKeys.length} of {totalResults} keys
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {selectedKeys.size > 0 && (
                  <button
                    onClick={handleDeleteSelectedKeys}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Selected ({selectedKeys.size})</span>
                  </button>
                )}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Create New Key</span>
                </button>
              </div>
            </div>

            {/* API Keys List */}
            <div className="space-y-4">
              {filteredKeys.map((key) => (
                <div
                  key={key.id}
                  className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(key.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedKeys);
                          if (e.target.checked) {
                            newSelected.add(key.id);
                          } else {
                            newSelected.delete(key.id);
                          }
                          setSelectedKeys(newSelected);
                        }}
                        className="rounded"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{key.label}</h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(key.status)}`}>
                            {key.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium ${getEnvironmentColor(key.environment)}`}>
                            {key.environment}
                          </span>
                          <span className="text-sm text-gray-500">
                            {key.scope}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleToggleKeyStatus(key.id, key.isActive)
                        }
                        disabled={loading}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          key.isActive
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}>
                        {key.isActive ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRegenerateKey(key.id)}
                        disabled={loading}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        disabled={loading}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Key className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-sm">
                          {visibleKeys.has(key.id)
                            ? key.key
                            : key.key.replace(/[^.]/g, "●")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Usage:</span>
                        <div className="font-medium">
                          {key.usageCount.toLocaleString()} requests
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate Limit:</span>
                        <div className="font-medium">{key.rateLimit}/min</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Used:</span>
                        <div className="font-medium">{key.lastUsed}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <div className="font-medium">{key.created}</div>
                      </div>
                    </div>

                    {key.permissions && (
                      <div>
                        <span className="text-sm text-gray-500">
                          Permissions:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {key.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredKeys.length === 0 && !loading && (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No API keys found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ||
                  filterStatus !== "all" ||
                  filterEnvironment !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first API key to get started"}
                </p>
                {!searchTerm &&
                  filterStatus === "all" &&
                  filterEnvironment === "all" && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                      Create Your First API Key
                    </button>
                  )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalResults)} of{" "}
                  {totalResults} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateForm && <CreateForm />}
      {showRawKey && (
        <RawKeyModal
          keyId={showRawKey.keyId}
          rawKey={showRawKey.rawKey}
          onClose={() => setShowRawKey(null)}
        />
      )}
    </>
  );
}
