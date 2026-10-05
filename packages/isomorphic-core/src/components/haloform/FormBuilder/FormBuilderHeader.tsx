"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@haloform/ui/tooltip";
import { Button } from "@haloform/ui/button";
import {
  LayoutGrid,
  Trash2,
  Upload,
  Eye,
  Settings,
  Code,
  Download,
} from "lucide-react";
import { Switch } from "@haloform/ui/switch";

import { ElementType } from "@haloform/types/form-builder";
import ElementDropdown from "./ElementDropdown";

interface FormBuilderHeaderProps {
  wizardMode: boolean;
  onWizardModeToggle: (enabled: boolean) => void;
  onSaveForm: () => void;
  onClearForm: () => void;
  onExportForm: () => void; // Changed: now opens modal instead of accepting format
  onImportForm?: () => void;
  activeTab: "preview" | "json" | "properties";
  onTabChange: (value: "preview" | "json" | "properties") => void;
  onAddElement: (type: ElementType) => void;
}

const FormBuilderHeader = ({
  wizardMode,
  onWizardModeToggle,
  onSaveForm,
  onClearForm,
  onExportForm,
  onImportForm, // New import function
  activeTab,
  onTabChange,
  onAddElement,
}: FormBuilderHeaderProps) => {
  return (
    <header className="border-b border-black dark:border-white px-6 py-3 flex justify-between items-center bg-white dark:bg-black">
      {/* Left side - Element Dropdown */}
      <div className="flex items-center gap-4">
        <ElementDropdown onAddElement={onAddElement} />
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-3">
        {/* Wizard mode toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Switch
                id="wizard-mode"
                checked={wizardMode}
                onCheckedChange={onWizardModeToggle}
                className="mr-1"
              />
              <LayoutGrid size={18} className="text-black dark:text-white" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Wizard Mode</p>
          </TooltipContent>
        </Tooltip>

        {/* Tab controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "properties" ? "default" : "ghost"}
              size="icon"
              onClick={() => onTabChange("properties")}
              className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
              <Settings size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Properties</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "preview" ? "default" : "ghost"}
              size="icon"
              onClick={() => onTabChange("preview")}
              className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
              <Eye size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Preview</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeTab === "json" ? "default" : "ghost"}
              size="icon"
              onClick={() => onTabChange("json")}
              className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
              <Code size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>JSON</p>
          </TooltipContent>
        </Tooltip>

        {/* Import/AI Generate button */}
        {onImportForm && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onImportForm}
                className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
                <Download size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import or Generate with AI</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearForm}
          className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
          <Trash2 size={20} />
        </Button>

        {/* Export/Publish button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportForm}
              className="hover:bg-gray-100 transition-colors text-black dark:text-white dark:hover:bg-gray-800">
              <Upload size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Publish Template</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default FormBuilderHeader;
