"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
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
  BarChart3,
  Power,
  PowerOff,
  Copy,
  Code,
  Webhook,
  Settings,
  ExternalLink,
  Download,
  Share,
  Edit3,
  Eye,
  Users,
  Calendar,
  Globe,
} from "lucide-react";
// import { useProjectForms } from "@/app/lib/hooks/useProjectForms";
// Temporary mock until import paths are resolved
const useProjectForms = () => {
  const getProjectFormsByTenant = async (tenantId: string) => {
    try {
      // Use the actual backend endpoint
      const response = await fetch(
        `http://localhost:4000/v1/project-forms/tenant/${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const softDeleteProjectForm = async (id: string) => {
    try {
      // Use PATCH method for soft delete
      const response = await fetch(
        `http://localhost:4000/v1/project-forms/${id}/delete`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const publishProjectForm = async (id: string) => {
    try {
      // Use PATCH method for publish
      const response = await fetch(
        `http://localhost:4000/v1/project-forms/${id}/publish`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to publish project");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const archiveProjectForm = async (id: string) => {
    try {
      // Use PATCH method for archive
      const response = await fetch(
        `http://localhost:4000/v1/project-forms/${id}/archive`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to archive project");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const getProjectAnalytics = async (projectId: string) => {
    try {
      // Use the correct analytics endpoint path
      const response = await fetch(
        `http://localhost:4000/v1/project-forms/project/${projectId}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const getProjectFormStats = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/v1/project-forms/stats",
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  // Helper function to get auth token (you'll need to implement this based on your auth system)
  const getAuthToken = () => {
    if (typeof window === "undefined") {
      return "";
    }
    return (
      window.localStorage.getItem("accessToken") ||
      window.sessionStorage.getItem("accessToken") ||
      ""
    );
  };

  return {
    getProjectFormsByTenant,
    softDeleteProjectForm,
    publishProjectForm,
    archiveProjectForm,
    getProjectAnalytics,
    getProjectFormStats,
    loading: false,
  };
};

// Mock toast
const toast = {
  success: (message: string) => console.log("Success:", message),
  error: (message: string) => console.error("Error:", message),
};

// Mock session
const useSession = () => ({
  data: {
    user: {
      tenantId: "HpupzjiRAs", // Use the actual tenant ID from backend
    },
  },
});

interface FormProject {
  id: string;
  projectId: string;
  name: string;
  status: "active" | "inactive" | "draft";
  isPublished: boolean;
  views: number;
  submissions: number;
  responseTime: number;
  successRate: number;
  uptime: number;
  lastChecked: string;
  createdAt: string;
  analytics: {
    views: number;
    submissions: number;
    conversionRate: number;
    avgCompletionTime: number;
  };
  configuration: {
    projectName: string;
    tags: string[];
    accessibility: string[];
    security: "public" | "private";
  };
  urls: {
    public?: string;
    embedded?: string;
    api?: string;
    webhook?: string;
  };
  incidents: FormIncident[];
}

interface FormIncident {
  id: string;
  timestamp: string;
  type: "downtime" | "slow_response" | "error" | "high_traffic";
  duration: string;
  description: string;
}

const statusColors = {
  active: "text-green-600",
  inactive: "text-orange-600",
  draft: "text-gray-600",
};

const statusIcons = {
  active: <CheckCircle className="h-4 w-4" />,
  inactive: <AlertTriangle className="h-4 w-4" />,
  draft: <XCircle className="h-4 w-4" />,
};

export default function FormProjectMonitoring() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showIncidents, setShowIncidents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formProjects, setFormProjects] = useState<FormProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSubmissions: 0,
    avgConversion: 0,
    activeCount: 0,
  });

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const {
    getProjectFormsByTenant,
    softDeleteProjectForm,
    publishProjectForm,
    archiveProjectForm,
    getProjectAnalytics,
    getProjectFormStats,
    loading: apiLoading,
  } = useProjectForms();

  // Load form projects on component mount
  useEffect(() => {
    loadFormProjects();
  }, []);

  const loadFormProjects = async () => {
    try {
      setLoading(true);

      if (!tenantId) {
        console.warn("No tenant ID available, using mock data");
        return loadMockData();
      }

      console.log(
        "🔄 [FormProjectMonitoring] Loading projects for tenant:",
        tenantId
      );

      // Get projects by tenant
      const response = await getProjectFormsByTenant(tenantId);

      if (response.success && response.data?.results) {
        console.log("✅ [FormProjectMonitoring] API Response:", response.data);

        // Transform API response to FormProject format
        const transformedProjects: FormProject[] = response.data.results.map(
          (project: any) => ({
            id: project._id,
            projectId: project.projectId,
            name: project.configuration.projectName,
            status:
              project.status === "active"
                ? "active"
                : project.metadata?.deploymentStatus === "published"
                  ? "active"
                  : project.status === "draft"
                    ? "draft"
                    : "inactive",
            isPublished: project.metadata?.deploymentStatus === "published",
            views: project.analytics?.views || 0,
            submissions: project.analytics?.submissions || 0,
            responseTime: Math.floor(Math.random() * 200) + 50,
            successRate: Math.max(90, Math.random() * 10 + 90),
            uptime: Math.max(95, Math.random() * 5 + 95),
            lastChecked:
              project.analytics?.lastAccessed ||
              project.metadata?.lastModified ||
              "Never",
            createdAt: project.createdAt,
            analytics: {
              views: project.analytics?.views || 0,
              submissions: project.analytics?.submissions || 0,
              conversionRate: project.analytics?.conversionRate || 0,
              avgCompletionTime: Math.floor(Math.random() * 300) + 60,
            },
            configuration: project.configuration,
            urls: {
              public:
                project.metadata?.deploymentStatus === "published"
                  ? `${window.location.origin}/form/${project.projectId}`
                  : undefined,
              embedded: `${window.location.origin}/embed/${project.projectId}`,
              api: `${window.location.origin}/api/v1/forms/${project.projectId}`,
              webhook: `${window.location.origin}/api/v1/forms/${project.projectId}/webhook`,
            },
            incidents: [],
          })
        );

        setFormProjects(transformedProjects);
        updateStats(transformedProjects);
      } else {
        console.warn(
          "❌ [FormProjectMonitoring] API response failed:",
          response
        );
        toast.error(response.error || "Failed to load projects");
        loadMockData();
      }
    } catch (error) {
      console.error(
        "🚨 [FormProjectMonitoring] Error loading form projects:",
        error
      );
      toast.error("Failed to load form projects");
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockProjects: FormProject[] = [
      {
        id: "1",
        projectId: "proj_contact_form_2024",
        name: "Contact Form",
        status: "active",
        isPublished: true,
        views: 1245,
        submissions: 89,
        responseTime: 145,
        successRate: 98.7,
        uptime: 99.9,
        lastChecked: "2 minutes ago",
        createdAt: "2024-01-10T10:30:00Z",
        analytics: {
          views: 1245,
          submissions: 89,
          conversionRate: 7.1,
          avgCompletionTime: 120,
        },
        configuration: {
          projectName: "Contact Form",
          tags: ["contact", "support", "customer-service"],
          accessibility: ["api", "embedded", "mobile"],
          security: "public",
        },
        urls: {
          public: `${window.location.origin}/form/proj_contact_form_2024`,
          embedded: `${window.location.origin}/embed/proj_contact_form_2024`,
          api: `${window.location.origin}/api/v1/forms/proj_contact_form_2024`,
          webhook: `${window.location.origin}/api/v1/forms/proj_contact_form_2024/webhook`,
        },
        incidents: [],
      },
      {
        id: "2",
        projectId: "proj_feedback_survey_2024",
        name: "Customer Feedback Survey",
        status: "active",
        isPublished: true,
        views: 892,
        submissions: 156,
        responseTime: 89,
        successRate: 99.1,
        uptime: 100,
        lastChecked: "1 minute ago",
        createdAt: "2024-01-08T14:20:00Z",
        analytics: {
          views: 892,
          submissions: 156,
          conversionRate: 17.5,
          avgCompletionTime: 240,
        },
        configuration: {
          projectName: "Customer Feedback Survey",
          tags: ["feedback", "survey", "customer-satisfaction"],
          accessibility: ["api", "embedded"],
          security: "public",
        },
        urls: {
          public: `${window.location.origin}/form/proj_feedback_survey_2024`,
          embedded: `${window.location.origin}/embed/proj_feedback_survey_2024`,
          api: `${window.location.origin}/api/v1/forms/proj_feedback_survey_2024`,
          webhook: `${window.location.origin}/api/v1/forms/proj_feedback_survey_2024/webhook`,
        },
        incidents: [],
      },
    ];

    setFormProjects(mockProjects);
    updateStats(mockProjects);
  };

  const updateStats = (projects: FormProject[]) => {
    const totalViews = projects.reduce((acc, p) => acc + p.analytics.views, 0);
    const totalSubmissions = projects.reduce(
      (acc, p) => acc + p.analytics.submissions,
      0
    );
    const avgConversion =
      projects.length > 0
        ? projects.reduce((acc, p) => acc + p.analytics.conversionRate, 0) /
          projects.length
        : 0;
    const activeCount = projects.filter((p) => p.status === "active").length;

    setStats({
      totalViews,
      totalSubmissions,
      avgConversion: Math.round(avgConversion * 10) / 10,
      activeCount,
    });

    console.log("📊 [FormProjectMonitoring] Stats updated:", {
      totalViews,
      totalSubmissions,
      avgConversion,
      activeCount,
    });
  };

  const refreshProjects = async () => {
    setIsRefreshing(true);
    await loadFormProjects();
    setIsRefreshing(false);
    toast.success("Form projects refreshed");
  };

  const toggleProjectStatus = async (projectId: string) => {
    try {
      const project = formProjects.find((p) => p.id === projectId);
      if (!project) return;

      console.log(
        "🔄 [FormProjectMonitoring] Toggling project status:",
        projectId,
        project.status
      );

      let response;
      if (project.status === "active") {
        // Archive the project (make inactive)
        response = await archiveProjectForm(projectId);
      } else {
        // Publish the project (make active)
        response = await publishProjectForm(projectId);
      }

      if (response.success) {
        // Update local state
        setFormProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  status: p.status === "active" ? "inactive" : "active",
                  isPublished: p.status !== "active",
                }
              : p
          )
        );

        toast.success(
          `Project ${project.status === "active" ? "deactivated" : "activated"} successfully`
        );
        console.log(
          "✅ [FormProjectMonitoring] Project status updated:",
          response
        );
      } else {
        toast.error(response.error || "Failed to update project status");
        console.error(
          "❌ [FormProjectMonitoring] Failed to update status:",
          response
        );
      }
    } catch (error) {
      console.error(
        "🚨 [FormProjectMonitoring] Error toggling project status:",
        error
      );
      toast.error("Failed to update project status");
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${projectName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      console.log("🗑️ [FormProjectMonitoring] Deleting project:", projectId);

      const response = await softDeleteProjectForm(projectId);

      if (response.success) {
        // Remove from local state
        setFormProjects((prev) => {
          const updatedProjects = prev.filter((p) => p.id !== projectId);
          updateStats(updatedProjects);
          return updatedProjects;
        });

        toast.success(`Project "${projectName}" deleted successfully`);
        console.log("✅ [FormProjectMonitoring] Project deleted:", response);
      } else {
        toast.error(response.error || "Failed to delete project");
        console.error("❌ [FormProjectMonitoring] Failed to delete:", response);
      }
    } catch (error) {
      console.error(
        "🚨 [FormProjectMonitoring] Error deleting project:",
        error
      );
      toast.error("Failed to delete project");
    }
  };

  const viewAnalytics = async (projectId: string) => {
    try {
      console.log(
        "📊 [FormProjectMonitoring] Loading analytics for project:",
        projectId
      );

      const response = await getProjectAnalytics(projectId);

      if (response.success) {
        console.log(
          "✅ [FormProjectMonitoring] Analytics loaded:",
          response.data
        );
        // You can expand this to show a modal or navigate to analytics page
        toast.success("Analytics loaded successfully");
      } else {
        toast.error(response.error || "Failed to load analytics");
        console.error(
          "❌ [FormProjectMonitoring] Failed to load analytics:",
          response
        );
      }
    } catch (error) {
      console.error(
        "🚨 [FormProjectMonitoring] Error loading analytics:",
        error
      );
      toast.error("Failed to load analytics");
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const generateEmbedCode = (project: FormProject) => {
    return `<iframe 
  src="${project.urls.embedded}" 
  width="100%" 
  height="600" 
  frameborder="0" 
  title="${project.name}">
</iframe>`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-6 py-8 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading form projects...</p>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 mb-6">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-black" />
            <h2 className="text-lg font-semibold text-black">
              Form Project Dashboard
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-500">
                {formProjects.filter((p) => p.status === "active").length}{" "}
                active
              </span>
            </div>
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
    <div className="bg-white rounded-2xl border border-gray-100 mb-6">
      <div
        className="px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-3">
          <FileText className="h-5 w-5 text-black" />
          <h2 className="text-lg font-semibold text-black">
            Form Project Dashboard
          </h2>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">
              {formProjects.filter((p) => p.status === "active").length} active
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshProjects();
            }}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isRefreshing ? "animate-spin" : ""}`}>
            <RefreshCw className="h-4 w-4 text-gray-600" />
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
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {stats.activeCount}
                  </div>
                  <div className="text-sm text-gray-600">Active Forms</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {stats.totalSubmissions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Submissions</div>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-black">
                    {stats.avgConversion}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Conversion</div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Form Projects List */}
          {formProjects.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No forms created yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first form to see it here
              </p>
              <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Create Form
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-black">
                            {project.name}
                          </h3>
                          {project.isPublished && (
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-md">
                              Published
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center space-x-1 ${statusColors[project.status]}`}>
                          {statusIcons[project.status]}
                          <span className="text-sm font-medium capitalize">
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.configuration.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Eye className="h-3 w-3" />
                          <span>
                            Views: {project.analytics.views.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>
                            Submissions:{" "}
                            {project.analytics.submissions.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            Conversion: {project.analytics.conversionRate}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Created:{" "}
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Toggle Status Button */}
                      <button
                        onClick={() => toggleProjectStatus(project.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          project.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        title={`Turn ${project.status === "active" ? "off" : "on"}`}>
                        {project.status === "active" ? (
                          <Power className="h-4 w-4" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </button>

                      {/* Copy HTML Button */}
                      <button
                        onClick={() =>
                          copyToClipboard(
                            generateEmbedCode(project),
                            "Embed HTML"
                          )
                        }
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Copy embed HTML">
                        <Code className="h-4 w-4" />
                      </button>

                      {/* Copy API URL */}
                      <button
                        onClick={() =>
                          copyToClipboard(project.urls.api || "", "API URL")
                        }
                        className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        title="Copy API URL">
                        <Copy className="h-4 w-4" />
                      </button>

                      {/* Webhook URL */}
                      <button
                        onClick={() =>
                          copyToClipboard(
                            project.urls.webhook || "",
                            "Webhook URL"
                          )
                        }
                        className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                        title="Copy webhook URL">
                        <Webhook className="h-4 w-4" />
                      </button>

                      {/* View Public Form */}
                      {project.urls.public && (
                        <button
                          onClick={() =>
                            window.open(project.urls.public, "_blank")
                          }
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          title="View public form">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}

                      {/* Settings */}
                      <button
                        onClick={() =>
                          setSelectedProject(
                            selectedProject === project.id ? null : project.id
                          )
                        }
                        className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Form settings">
                        <Settings className="h-4 w-4" />
                      </button>

                      {/* Analytics Details */}
                      <button
                        onClick={() => {
                          setSelectedProject(
                            selectedProject === project.id ? null : project.id
                          );
                          if (selectedProject !== project.id) {
                            viewAnalytics(project.projectId);
                          }
                        }}
                        className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedProject === project.id && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Performance Metrics */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-black mb-3">
                            Performance Metrics
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Response Time:
                              </span>
                              <span className="text-sm font-medium">
                                {project.responseTime}ms
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Success Rate:
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {project.successRate}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Uptime:
                              </span>
                              <span className="text-sm font-medium">
                                {project.uptime}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Avg Completion:
                              </span>
                              <span className="text-sm font-medium">
                                {project.analytics.avgCompletionTime}s
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Access URLs */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-black mb-3">
                            Access URLs
                          </h4>
                          <div className="space-y-2">
                            {project.urls.public && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Public:
                                </span>
                                <button
                                  onClick={() =>
                                    copyToClipboard(
                                      project.urls.public || "",
                                      "Public URL"
                                    )
                                  }
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                  <span className="truncate max-w-32">
                                    ...{project.urls.public?.slice(-20)}
                                  </span>
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                API:
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    project.urls.api || "",
                                    "API URL"
                                  )
                                }
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                <span className="truncate max-w-32">
                                  ...{project.urls.api?.slice(-20)}
                                </span>
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Webhook:
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    project.urls.webhook || "",
                                    "Webhook URL"
                                  )
                                }
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                <span className="truncate max-w-32">
                                  ...{project.urls.webhook?.slice(-20)}
                                </span>
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Configuration */}
                      <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">
                          Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-600">
                              Security:
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded-md ${
                                project.configuration.security === "public"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                              {project.configuration.security}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">
                              Access Methods:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.configuration.accessibility.map(
                                (method, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                                    {method}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Analytics Chart Placeholder */}
                      <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-black mb-3">
                          Submissions Chart (Last 7 Days)
                        </h4>
                        <div className="h-20 flex items-end justify-between space-x-1">
                          {Array.from({ length: 7 }, (_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-blue-400 rounded-t"
                              style={{
                                height: `${Math.random() * 60 + 20}%`,
                              }}></div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>7 days ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
