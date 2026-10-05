"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileBarChart,
  FileImage,
  FileText,
  FileSpreadsheet,
  Gauge,
  GitBranch,
  Landmark,
  Mic,
  Paperclip,
  Plus,
  Radar,
  ShieldAlert,
  Sigma,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { ProjectCard, ChatMessage } from "@chats/types";
import type { ApprovalStage } from "@chats/ApprovalStatusIndicator";

interface ChatInterfaceProps {
  activeProject: ProjectCard | null;
  messages: ChatMessage[];
  setMessages: (
    messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
  onApprovalProgress?: (stage: ApprovalStage | null) => void;
  onClearActiveProject?: () => void;
  composerSeed?: { id: string; text: string } | null;
  onComposerSeedConsumed?: () => void;
}

type PromptExample = {
  label: string;
  description: string;
  text: string;
  icon: typeof BarChart3;
};

type PromptCategory = {
  label: string;
  description: string;
  icon: typeof BarChart3;
  blockClass: string;
  badgeClass: string;
  pillClass: string;
  iconClass: string;
  prompts: PromptExample[];
};

const promptCategories: PromptCategory[] = [
  {
    label: "Executive Briefs",
    description: "Board-ready summaries and leadership context",
    icon: FileBarChart,
    blockClass:
      "border-white/10 bg-[#101216] text-[#f8fafc] shadow-[0_0_22px_rgba(147,197,253,0.14)] hover:border-[#93c5fd]/45 hover:bg-[#141820]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#31446b] bg-[#111827] text-[#dbeafe] hover:border-[#5d7fbd] hover:bg-[#17233d]",
    iconClass: "text-[#93c5fd]",
    prompts: [
      {
        label: "Executive brief",
        description: "Leadership-ready summary",
        text: "Generate an executive brief for this form",
        icon: BarChart3,
      },
      {
        label: "Board summary",
        description: "Monthly board narrative",
        text: "Create a board-ready monthly summary",
        icon: FileSpreadsheet,
      },
      {
        label: "Project health",
        description: "Current health snapshot",
        text: "Summarize the current health of this project",
        icon: Gauge,
      },
      {
        label: "Leadership note",
        description: "What leaders should know",
        text: "What should leadership know about this form this month?",
        icon: FileText,
      },
    ],
  },
  {
    label: "Metrics & Tables",
    description: "Structured totals, breakdowns, and rows",
    icon: FileSpreadsheet,
    blockClass:
      "border-white/10 bg-[#101614] text-[#f8fafc] shadow-[0_0_22px_rgba(110,231,183,0.13)] hover:border-[#6ee7b7]/45 hover:bg-[#121c18]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#1f4f3f] bg-[#0d1f1a] text-[#d1fae5] hover:border-[#34d399] hover:bg-[#102a21]",
    iconClass: "text-[#6ee7b7]",
    prompts: [
      {
        label: "Payment table",
        description: "Payment totals by member",
        text: "Show Payment Total by Membership ID as a table",
        icon: FileSpreadsheet,
      },
      {
        label: "Branch totals",
        description: "Submissions by branch",
        text: "Show total submissions by branch this month",
        icon: Landmark,
      },
      {
        label: "Completion",
        description: "Completion by node",
        text: "Compare completion by node and status",
        icon: Check,
      },
      {
        label: "Status mix",
        description: "Status breakdown",
        text: "Show rejected, pending, approved, and completed submissions",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    label: "Trends & Compare",
    description: "Movement over time and performance deltas",
    icon: TrendingUp,
    blockClass:
      "border-white/10 bg-[#131118] text-[#f8fafc] shadow-[0_0_22px_rgba(196,181,253,0.14)] hover:border-[#c4b5fd]/45 hover:bg-[#181421]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#4c1d95] bg-[#18102a] text-[#f3e8ff] hover:border-[#a78bfa] hover:bg-[#20143a]",
    iconClass: "text-[#c4b5fd]",
    prompts: [
      {
        label: "Monthly trend",
        description: "Metric movement by month",
        text: "Show the monthly trend for this project",
        icon: TrendingUp,
      },
      {
        label: "Period compare",
        description: "This period vs last",
        text: "Compare this month with last month",
        icon: BarChart3,
      },
      {
        label: "Branch rank",
        description: "Top and bottom branches",
        text: "Rank the top and bottom branches this month",
        icon: GitBranch,
      },
      {
        label: "Multi-form",
        description: "Compare selected forms",
        text: "Compare these selected project forms by shared metrics",
        icon: FileBarChart,
      },
    ],
  },
  {
    label: "Risk & Quality",
    description: "Anomalies, missing data, and follow-up risks",
    icon: Radar,
    blockClass:
      "border-white/10 bg-[#17130d] text-[#f8fafc] shadow-[0_0_22px_rgba(251,191,36,0.13)] hover:border-[#fbbf24]/45 hover:bg-[#1f180d]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#5f3a18] bg-[#24180c] text-[#ffedd5] hover:border-[#f59e0b] hover:bg-[#2e1f0e]",
    iconClass: "text-[#fbbf24]",
    prompts: [
      {
        label: "Anomalies",
        description: "Unusual data movement",
        text: "Highlight anomalies and unusual movements",
        icon: Radar,
      },
      {
        label: "Missing data",
        description: "Incomplete submissions",
        text: "Find missing or incomplete submission data",
        icon: ShieldAlert,
      },
      {
        label: "Risk summary",
        description: "Risks and next steps",
        text: "Summarize risks and recommended follow-ups",
        icon: Gauge,
      },
      {
        label: "Urgent nodes",
        description: "Nodes needing attention",
        text: "Which branches or nodes need urgent attention?",
        icon: GitBranch,
      },
    ],
  },
  {
    label: "Governance & Scope",
    description: "Tenant, node, user, role, and access intelligence",
    icon: UsersRound,
    blockClass:
      "border-white/10 bg-[#0d1517] text-[#f8fafc] shadow-[0_0_22px_rgba(103,232,249,0.13)] hover:border-[#67e8f9]/45 hover:bg-[#101c20]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#164e63] bg-[#0b1f24] text-[#ccfbf1] hover:border-[#22d3ee] hover:bg-[#0e2b31]",
    iconClass: "text-[#67e8f9]",
    prompts: [
      {
        label: "Node coverage",
        description: "Project node reach",
        text: "Show the node coverage for this project",
        icon: GitBranch,
      },
      {
        label: "Visible scope",
        description: "What this user can see",
        text: "Explain which nodes this user can see",
        icon: UsersRound,
      },
      {
        label: "Access review",
        description: "Roles and permissions",
        text: "Review role access and permissions for this workspace",
        icon: ShieldAlert,
      },
      {
        label: "Actor split",
        description: "Submitters vs team users",
        text: "Compare submitter-only users with workspace actors",
        icon: UsersRound,
      },
    ],
  },
  {
    label: "Exports & Advanced",
    description: "Downloadable reports and sandbox-backed analysis",
    icon: Download,
    blockClass:
      "border-white/10 bg-[#171114] text-[#f8fafc] shadow-[0_0_22px_rgba(253,164,175,0.13)] hover:border-[#fda4af]/45 hover:bg-[#201418]",
    badgeClass:
      "bg-[#f8fafc] text-[#111827] shadow-[0_0_16px_rgba(255,255,255,0.28)]",
    pillClass:
      "border-[#7f1d1d] bg-[#2a1014] text-[#ffe4e6] hover:border-[#fb7185] hover:bg-[#3a151b]",
    iconClass: "text-[#fda4af]",
    prompts: [
      {
        label: "PDF report",
        description: "Downloadable PDF",
        text: "Generate a PDF report from this project",
        icon: FileText,
      },
      {
        label: "DOCX memo",
        description: "Executive memo",
        text: "Generate a DOCX executive memo",
        icon: FileText,
      },
      {
        label: "XLSX export",
        description: "Spreadsheet export",
        text: "Export this table as XLSX",
        icon: FileSpreadsheet,
      },
      {
        label: "Correlation",
        description: "Advanced relationship check",
        text: "Check correlation between two numeric fields",
        icon: Sigma,
      },
      {
        label: "Forecast",
        description: "Predictive estimate",
        text: "Forecast next month if there is enough data",
        icon: TrendingUp,
      },
    ],
  },
];

const modelOptions = [
  "OpenCode Go",
  "Gemini 1.5 Flash",
  "GPT-4o (OpenAI)",
  "Claude 3.5 Sonnet",
  "DeepSeek Chat",
];

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const truncateFileName = (name: string) =>
  name.length > 28 ? `${name.slice(0, 16)}...${name.slice(-8)}` : name;

const formatAgentError = (error: unknown) => {
  if (!error) return "Could not connect to Saby service. Check agent status.";
  let message = "";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object") {
    const anyErr = error as Record<string, any>;
    message =
      anyErr.data?.message ||
      anyErr.message ||
      anyErr.error ||
      (anyErr.name
        ? `${anyErr.name}: ${JSON.stringify(anyErr.data || "")}`
        : JSON.stringify(error));
  } else {
    message = String(error);
  }
  if (message.includes("MISSING_ACTIVE_TENANT_ARTIFACT")) {
    return "Saby Intelligence is being prepared for this workspace. Please ask a workspace owner or administrator to open Intelligence and try again.";
  }
  return message || "Could not connect to Saby service. Check agent status.";
};

export default function ChatInterface({
  activeProject,
  setMessages,
  onClearActiveProject,
  composerSeed,
  onComposerSeedConsumed,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [activePromptCategory, setActivePromptCategory] = useState<
    string | null
  >(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const hasMessage = message.trim().length > 0;
  const selectedPromptCategory =
    promptCategories.find(
      (category) => category.label === activePromptCategory,
    ) || null;
  const SelectedPromptCategoryIcon = selectedPromptCategory?.icon || null;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const maxHeight = 150;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [message]);

  useEffect(() => {
    if (!composerSeed?.text) return;
    setMessage(composerSeed.text);
    onComposerSeedConsumed?.();
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [composerSeed, onComposerSeedConsumed]);

  const applyPromptToComposer = (prompt: string) => {
    setMessage(prompt);
    setIsQuickActionOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const clearPromptCategory = () => {
    setActivePromptCategory(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(prompt);
      setTimeout(() => setCopiedPrompt(null), 1400);
    } catch {
      setCopiedPrompt(null);
    }
  };

  const addSelectedFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setSelectedFiles((current: File[]) => {
      const existing = new Set(
        current.map((file: File) => `${file.name}:${file.size}`),
      );
      const next = [...current];
      Array.from(files).forEach((file) => {
        const key = `${file.name}:${file.size}`;
        if (!existing.has(key)) next.push(file);
      });
      return next.slice(0, 6);
    });
    setIsQuickActionOpen(false);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((current: File[]) =>
      current.filter((_: File, itemIndex: number) => itemIndex !== index),
    );
  };

  const resetFileInput = (input: HTMLInputElement | null) => {
    if (input) input.value = "";
  };

  const handleSend = async (overrideMessage?: string) => {
    if (isSending) return;
    const outgoingMessage = (overrideMessage ?? message).trim();
    if (!outgoingMessage) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: outgoingMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setIsQuickActionOpen(false);
    setIsModelMenuOpen(false);

    const assistantId = `assistant-${Date.now() + 1}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      content: "",
      sender: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsSending(true);

    const references =
      activeProject?.referenceType === "project_form" && activeProject.projectId
        ? [
            {
              type: "project_form",
              projectId: activeProject.projectId,
              projectFormId: activeProject.projectFormId || null,
              workspaceId: activeProject.workspaceId || null,
              title: activeProject.title,
            },
          ]
        : [];

    try {
      const response = await fetch("/api/saby/agent/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: outgoingMessage,
          threadId: null,
          activeNodeId: null,
          context: {
            currentRoute:
              typeof window !== "undefined"
                ? window.location.pathname
                : "/intelligence",
            currentModuleId: activeProject?.projectId || null,
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              "Africa/Lagos",
            modelPreference: selectedModel,
            references,
          },
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Unable to process request");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEventType = "";
      let streamedText = "";
      let streamedReasoning = "";
      let finalAnswer = "";
      let finalReasoning = "";

      const cleanThinking = (raw: string, reasoningChunk?: string) => {
        let text = raw || "";
        let reasoning = reasoningChunk || "";
        if (text.includes("<think>")) {
          const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/gi;
          let match;
          while ((match = thinkRegex.exec(text)) !== null) {
            if (match[1]) {
              reasoning = (reasoning ? `${reasoning}\n` : "") + match[1].trim();
            }
          }
          text = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
        }
        return { text, reasoning: reasoning.trim() || undefined };
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          if (line.startsWith("data: ")) {
            try {
              const payload: any = JSON.parse(line.slice(6));

              if (currentEventType === "token") {
                streamedText += payload.chunk ?? payload.token ?? "";
                const parsed = cleanThinking(streamedText, streamedReasoning);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: parsed.text, reasoning: parsed.reasoning }
                      : msg,
                  ),
                );
              } else if (currentEventType === "reasoning") {
                streamedReasoning += payload.chunk ?? payload.token ?? "";
                const parsed = cleanThinking(streamedText, streamedReasoning);
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: parsed.text, reasoning: parsed.reasoning }
                      : msg,
                  ),
                );
              } else if (currentEventType === "done") {
                finalAnswer = String(payload.answer ?? streamedText).trim();
                finalReasoning = String(
                  payload.reasoning ?? streamedReasoning
                ).trim();
                try {
                  void reader.cancel().catch(() => null);
                } catch {
                  /* ignore */
                }
                break outer;
              } else if (currentEventType === "error") {
                throw new Error(formatAgentError(payload.error || "Saby stream error"));
              }
            } catch (error) {
              if (error instanceof Error) {
                finalAnswer = `I could not complete that request: ${error.message}`;
                break outer;
              }
            } finally {
              currentEventType = "";
            }
          } else if (line === "") {
            currentEventType = "";
          }
        }
      }

      const parsedFinal = cleanThinking(
        finalAnswer || streamedText,
        finalReasoning || streamedReasoning
      );
      const answer = parsedFinal.text.trim();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  answer ||
                  "I could not generate a response. Please try again.",
                reasoning: parsedFinal.reasoning,
              }
            : msg,
        ),
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  formatAgentError(error),
              }
            : msg,
        ),
      );
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:px-5">
      <div className="pointer-events-auto mx-auto w-full max-w-[62rem]">
        <div className="rounded-[30px] border border-white/10 bg-[#161616] px-3 py-3 text-[#f4f5f7] shadow-[0_18px_48px_rgba(0,0,0,0.28)] ring-1 ring-black/10 sm:rounded-[34px] sm:px-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              addSelectedFiles(event.target.files);
              resetFileInput(event.target);
            }}
          />
          <input
            ref={documentInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              addSelectedFiles(event.target.files);
              resetFileInput(event.target);
            }}
          />
          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              addSelectedFiles(event.target.files);
              resetFileInput(event.target);
            }}
          />

          <div className="mb-2 flex flex-wrap items-center gap-2">
            {activeProject && (
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs font-semibold text-[#e5e7eb] shadow-sm">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f8fafc] text-[#111827]">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 truncate">{activeProject.title}</span>
                {typeof activeProject.responseCount === "number" && (
                  <span className="text-[#a9b0bd]">
                    {activeProject.responseCount} responses
                  </span>
                )}
                {onClearActiveProject && (
                  <button
                    type="button"
                    onClick={onClearActiveProject}
                    className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-white/10"
                    aria-label="Remove project reference"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {selectedPromptCategory && SelectedPromptCategoryIcon && (
              <div
                className={`inline-flex max-w-full items-center gap-2 rounded-full border border-transparent px-2.5 py-1.5 text-xs font-semibold shadow-sm ${selectedPromptCategory.badgeClass}`}
              >
                <SelectedPromptCategoryIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">
                  {selectedPromptCategory.label}
                </span>
                <button
                  type="button"
                  onClick={clearPromptCategory}
                  className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-current/80 transition hover:bg-white/20 hover:text-current"
                  aria-label={`Clear ${selectedPromptCategory.label} category`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {selectedFiles.map((file: File, index: number) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#5f3a18] bg-[#24180c] px-2.5 py-1.5 text-xs font-semibold text-[#ffedd5] shadow-sm"
                title={`${file.name} (${formatBytes(file.size)})`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[180px] truncate">
                  {truncateFileName(file.name)}
                </span>
                <span className="text-[#fbbf24]">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedFile(index)}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-white/10"
                  aria-label="Remove selected file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-[#202020] px-3 py-2 shadow-inner shadow-black/30">
            <div className="flex min-h-[42px] items-center gap-2.5 sm:gap-3">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
                  className="rounded-full border border-white/[0.08] bg-white/[0.06] p-2 text-[#f4f5f7] transition hover:bg-white/[0.1] active:scale-[0.98] sm:p-2.5"
                  aria-label="Open upload and prompt actions"
                >
                  {isQuickActionOpen ? (
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                  )}
                </button>

                {isQuickActionOpen && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 z-30 w-[17rem] max-w-[calc(100vw-1.5rem)] rounded-[18px] border border-white/[0.08] bg-[#1d1d1d] p-1.5 text-[#f4f5f7] shadow-2xl">
                    <p className="px-2.5 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8f98a8]">
                      Add context
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition hover:bg-white/[0.06]"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-[#93c5fd]" />
                      <span>
                        <span className="block font-semibold">Attach file</span>
                        <span className="block text-[10px] text-[#9ca3af]">
                          Any local file
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => documentInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition hover:bg-white/[0.06]"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#6ee7b7]" />
                      <span>
                        <span className="block font-semibold">
                          Attach document
                        </span>
                        <span className="block text-[10px] text-[#9ca3af]">
                          PDF, DOCX, XLSX, CSV
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition hover:bg-white/[0.06]"
                    >
                      <FileImage className="h-3.5 w-3.5 text-[#fbbf24]" />
                      <span>
                        <span className="block font-semibold">
                          Attach image
                        </span>
                        <span className="block text-[10px] text-[#9ca3af]">
                          PNG, JPG, screenshots
                        </span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="relative min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeProject
                      ? `Ask Saby about ${activeProject.title}`
                      : "Ask Saby about today's task"
                  }
                  rows={1}
                  disabled={isSending}
                  className="h-7 w-full resize-none overflow-hidden border-0 bg-transparent py-0 text-[16px] leading-[1.35] text-[#f4f5f7] shadow-none outline-none ring-0 placeholder:text-[#737373] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[18px]"
                  style={{
                    fontFamily:
                      "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
                    letterSpacing: "-0.01em",
                  }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="inline-flex max-w-[116px] items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-3 py-2 text-sm text-[#f4f5f7] transition hover:bg-white/[0.1] sm:max-w-none"
                    aria-label="Select intelligence model"
                    aria-expanded={isModelMenuOpen}
                  >
                    <span className="truncate">{selectedModel}</span>
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </button>

                  {isModelMenuOpen && (
                    <div className="absolute bottom-[calc(100%+12px)] right-0 z-30 w-44 rounded-2xl border border-white/[0.08] bg-[#1d1d1d] p-1.5 text-[#f4f5f7] shadow-2xl">
                      <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f98a8]">
                        Model
                      </p>
                      {modelOptions.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model);
                            setIsModelMenuOpen(false);
                            setTimeout(() => textareaRef.current?.focus(), 0);
                          }}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/[0.06] ${
                            selectedModel === model
                              ? "bg-white/[0.08] font-semibold text-white"
                              : "text-[#d1d5db]"
                          }`}
                        >
                          <span>{model}</span>
                          {selectedModel === model && (
                            <span className="h-2 w-2 rounded-full bg-[#f4f5f7]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => (hasMessage ? void handleSend() : undefined)}
                  disabled={isSending}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:w-11 ${
                    hasMessage
                      ? "bg-[#f4f5f7] text-[#111827] shadow-md shadow-white/10"
                      : "border border-white/[0.08] bg-white/[0.06] text-[#f4f5f7] hover:bg-white/[0.1]"
                  }`}
                  aria-label={hasMessage ? "Send message" : "Start voice input"}
                >
                  {hasMessage ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 overflow-hidden">
          {selectedPromptCategory ? (
            <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5">
              {selectedPromptCategory.prompts.map((prompt) => {
                const PromptIcon = prompt.icon;
                const promptTitle = `${prompt.description}: ${prompt.text}`;
                return (
                  <span
                    key={prompt.text}
                    className={`inline-flex shrink-0 overflow-hidden rounded-full border text-[11px] font-semibold shadow-sm transition ${selectedPromptCategory.pillClass}`}
                  >
                    <button
                      type="button"
                      onClick={() => applyPromptToComposer(prompt.text)}
                      disabled={isSending}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
                      title={promptTitle}
                      aria-label={promptTitle}
                    >
                      <PromptIcon
                        className={`h-3.5 w-3.5 shrink-0 stroke-[2.2] ${selectedPromptCategory.iconClass}`}
                      />
                      <span>{prompt.label}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyPrompt(prompt.text)}
                      className="inline-flex w-7 items-center justify-center border-l border-current/15 text-current opacity-70 transition hover:opacity-100"
                      title={`Copy: ${promptTitle}`}
                      aria-label="Copy suggested prompt"
                    >
                      {copiedPrompt === prompt.text ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:grid lg:grid-cols-6 lg:overflow-visible">
              {promptCategories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => {
                      setActivePromptCategory(category.label);
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                    className={`min-w-[9.25rem] rounded-xl border px-2.5 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:min-w-0 ${category.blockClass}`}
                    aria-label={`Show ${category.label} prompts`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ${category.badgeClass}`}
                      >
                        <CategoryIcon className="h-4 w-4 stroke-[2.2]" />
                      </span>
                      <span className="truncate text-[11.5px] font-bold text-current">
                        {category.label}
                      </span>
                    </div>
                    <span className="mt-0.5 block truncate text-[9.5px] font-semibold leading-3 text-current/65">
                      {category.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
