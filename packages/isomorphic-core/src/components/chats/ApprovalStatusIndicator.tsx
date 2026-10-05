"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, ShieldCheck, UserCheck } from "lucide-react";

export type ApprovalStage = "checking" | "granted" | "executing" | "seeking" | "done";

interface ApprovalStatusIndicatorProps {
  stage: ApprovalStage;
  actionLabel?: string;
  reference?: string;
}

interface StageConfig {
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  pillClass: string;
  dotClass: string;
  animate: boolean;
}

const STAGES: ApprovalStage[] = ["checking", "granted", "executing", "done"];

function getStageConfig(stage: ApprovalStage, actionLabel?: string, reference?: string): StageConfig {
  switch (stage) {
    case "checking":
      return {
        label: "Checking permissions…",
        sublabel: actionLabel ? `Verifying authorization for ${actionLabel}` : undefined,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        pillClass: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400",
        dotClass: "bg-amber-400",
        animate: true,
      };
    case "granted":
      return {
        label: "Approval received",
        sublabel: actionLabel ? `Authorized to ${actionLabel}` : undefined,
        icon: <ShieldCheck className="w-4 h-4" />,
        pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400",
        dotClass: "bg-emerald-400",
        animate: false,
      };
    case "executing":
      return {
        label: "Processing…",
        sublabel: actionLabel ? `Executing ${actionLabel}` : undefined,
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        pillClass: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400",
        dotClass: "bg-blue-400",
        animate: true,
      };
    case "done":
      return {
        label: "Complete",
        sublabel: actionLabel ? `${actionLabel} executed successfully` : undefined,
        icon: <CheckCircle2 className="w-4 h-4" />,
        pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400",
        dotClass: "bg-emerald-400",
        animate: false,
      };
    case "seeking":
      return {
        label: "Awaiting human approval",
        sublabel: reference ? `Reference: ${reference}` : "Tenant owner has been notified",
        icon: <UserCheck className="w-4 h-4" />,
        pillClass: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400",
        dotClass: "bg-purple-400",
        animate: false,
      };
  }
}

function StepPill({
  stepStage,
  currentStage,
  actionLabel,
}: {
  stepStage: ApprovalStage;
  currentStage: ApprovalStage;
  actionLabel?: string;
}) {
  const orderedStages: ApprovalStage[] = ["checking", "granted", "executing", "done"];
  const currentIdx = orderedStages.indexOf(currentStage);
  const stepIdx = orderedStages.indexOf(stepStage);

  const isPast = stepIdx < currentIdx;
  const isCurrent = stepIdx === currentIdx;
  const isFuture = stepIdx > currentIdx;

  const config = getStageConfig(stepStage, actionLabel);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-500
        ${isCurrent ? config.pillClass : ""}
        ${isPast ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-500" : ""}
        ${isFuture ? "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-600" : ""}
      `}
    >
      {isCurrent ? (
        config.icon
      ) : isPast ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-current opacity-40" />
      )}
      <span className={isFuture ? "opacity-40" : ""}>
        {stepStage === "checking" ? "Checking" : stepStage === "granted" ? "Approved" : stepStage === "executing" ? "Executing" : "Done"}
      </span>
    </div>
  );
}

export default function ApprovalStatusIndicator({
  stage,
  actionLabel,
  reference,
}: ApprovalStatusIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const config = getStageConfig(stage, actionLabel, reference);

  if (stage === "seeking") {
    return (
      <div
        className={`
          my-4 flex justify-start transition-all duration-500
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        `}
      >
        <div className="max-w-sm rounded-2xl border bg-white/90 shadow-md backdrop-blur-sm dark:bg-gray-800/90 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-100 dark:border-purple-900/30 bg-purple-50/60 dark:bg-purple-900/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                Awaiting Human Approval
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Tenant owner has been notified
              </p>
            </div>
          </div>
          {reference && (
            <div className="px-4 py-2.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
              <p className="mt-0.5 font-mono text-xs text-gray-700 dark:text-gray-300 truncate">{reference}</p>
            </div>
          )}
          {actionLabel && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Action pending approval</p>
              <p className="mt-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{actionLabel}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        my-3 flex justify-start transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
    >
      <div className="flex flex-col gap-2">
        {/* Active stage label */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-sm text-xs font-medium
            ${config.pillClass}
            transition-all duration-300
          `}
        >
          {config.icon}
          <div>
            <span className="font-semibold">{config.label}</span>
            {config.sublabel && (
              <span className="ml-1.5 opacity-70">{config.sublabel}</span>
            )}
          </div>
          {config.animate && (
            <div className="ml-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1 w-1 rounded-full ${config.dotClass} animate-bounce`}
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Step progress pills */}
        <div className="flex items-center gap-1.5 pl-1">
          {STAGES.map((s, idx) => (
            <div key={s} className="flex items-center gap-1.5">
              <StepPill stepStage={s} currentStage={stage} actionLabel={actionLabel} />
              {idx < STAGES.length - 1 && (
                <div
                  className={`h-px w-4 transition-colors duration-500 ${
                    STAGES.indexOf(stage) > idx
                      ? "bg-emerald-300 dark:bg-emerald-700"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
