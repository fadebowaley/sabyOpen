"use client";

import type { CSSProperties } from "react";
import * as LucideIcons from "lucide-react";
import { FileSpreadsheet } from "lucide-react";
import { ProjectCard as ProjectCardType } from "@chats/types";
import { Button } from "@chats/ui/button";

interface ProjectCardProps {
  project: ProjectCardType;
  isActive?: boolean;
  onToggle?: () => void;
  isCompact?: boolean;
  iconOnly?: boolean;
}

export default function ProjectCard({
  project,
  isActive = false,
  onToggle,
  isCompact = false,
  iconOnly = false,
}: ProjectCardProps) {
  const IconComponent =
    project.referenceType === "project_form"
      ? FileSpreadsheet
      : (LucideIcons as any)[project.icon] || LucideIcons.FileText;

  const activeAccent =
    project.accentColor === "blue"
      ? "59 130 246"
      : project.accentColor === "purple"
        ? "168 85 247"
        : project.accentColor === "green"
          ? "34 197 94"
          : project.accentColor === "orange"
            ? "249 115 22"
            : "99 102 241";

  return (
    <Button
      onClick={onToggle}
      variant="ghost"
      className={`
        ${isCompact ? "h-9" : "h-12"} w-full rounded-xl border p-1.5 transition-all duration-200 hover:scale-[1.005]
        ${
          isActive
            ? "border-slate-300 bg-slate-50 shadow-sm"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }
      `}
      style={
        isActive
          ? ({
              borderColor: `rgb(${activeAccent})`,
            } as CSSProperties)
          : {}
      }
    >
      <div className="flex items-center gap-2 w-full">
        <div
          className={`${isCompact ? "h-6 w-6" : "h-8 w-8"} flex shrink-0 items-center justify-center rounded-full ${
            isActive ? "bg-[#111827] text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          <IconComponent className={isCompact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </div>

        {!iconOnly && (
          <div className="flex-1 text-left min-w-0">
            <h3
              className={`${isCompact ? "text-[11px]" : "text-sm"} truncate font-semibold leading-tight text-slate-900`}
            >
              {project.title}
            </h3>
            <p
              className={`${isCompact ? "text-[10px]" : "text-xs"} mt-0.5 truncate leading-tight text-slate-500`}
            >
              {project.description}
            </p>
          </div>
        )}

        {/* Active Indicator */}
        {isActive && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: `rgb(${activeAccent})`,
            }}
          />
        )}
      </div>
    </Button>
  );
}
