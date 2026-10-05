"use client";

import { useState, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  GripVertical,
} from "lucide-react";
import ProjectCard from "./ProjectCard";
import { ProjectCard as ProjectCardType } from "@chats/types";
import { Button } from "@chats/ui/button";

interface FloatingSidebarProps {
  projects: ProjectCardType[];
  activeProject: ProjectCardType | null;
  onProjectToggle: (project: ProjectCardType) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export default function FloatingSidebar({
  projects,
  activeProject,
  onProjectToggle,
  isLoading = false,
  error = null,
  emptyMessage = "No projects found",
}: FloatingSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });
  const dragControls = useDragControls();

  useEffect(() => {
    setMounted(true);

    const updateConstraints = () => {
      if (typeof window !== "undefined") {
        const sidebarWidth = isCollapsed ? 132 : 168;
        setDragConstraints({
          left: -(window.innerWidth - sidebarWidth - 24),
          right: 24,
          top: -56,
          bottom: window.innerHeight - 128,
        });
      }
    };

    updateConstraints();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateConstraints);

      return () => {
        window.removeEventListener("resize", updateConstraints);
      };
    }
  }, [isCollapsed]);

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      dragTransition={{
        bounceStiffness: 400,
        bounceDamping: 40,
        power: 0.1,
        timeConstant: 150,
      }}
      className={`fixed right-4 top-24 z-40 rounded-2xl border border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur-xl transition-all duration-300 sm:right-8 ${isCollapsed ? "w-32" : "w-44 sm:w-48"}`}
      initial={{ x: 0, y: 0 }}
      whileDrag={{
        scale: 1.01,
        rotate: 0.2,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.22)",
        transition: { duration: 0.05 },
      }}
      dragConstraints={dragConstraints}
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <div
        className={`flex cursor-grab items-center justify-between px-2.5 py-2 active:cursor-grabbing ${
          isCollapsed ? "" : "border-b border-slate-200"
        }`}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isCollapsed ? (
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-[#172554]" />
          ) : (
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold">
              {isCollapsed ? activeProject?.title || "Forms" : "Forms"}
            </h2>
            {isCollapsed && (
              <p className="truncate text-[10px] text-slate-500">
                {activeProject ? "Selected" : `${projects.length} available`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            onPointerDown={(event: any) => event.stopPropagation()}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-slate-600 hover:bg-slate-100"
            aria-label={
              isCollapsed ? "Open form palette" : "Close form palette"
            }
          >
            {isCollapsed ? (
              <ChevronLeft className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
          <p className="mb-2 px-1 text-[11px] text-slate-500">
            Form references
          </p>
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
              Loading forms...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
              {error}
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={activeProject?.id === project.id}
                  onToggle={() => {
                    onProjectToggle(project);
                    setIsCollapsed(true);
                  }}
                  isCompact={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {isCollapsed && activeProject && (
        <div className="border-t border-slate-200 px-2.5 pb-2 pt-1.5">
          <p className="truncate text-[10px] text-slate-500">
            {typeof activeProject.responseCount === "number"
              ? `${activeProject.responseCount} responses`
              : "Query reference"}
          </p>
        </div>
      )}
    </motion.div>
  );
}
