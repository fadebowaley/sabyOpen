import React from "react";
import { FormElementType } from "@haloform/types/form-builder";
import FormPreview from "./FormPreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@haloform/ui/tabs";
import { Button } from "@haloform/ui/button";
import { ScrollArea } from "@haloform/ui/scroll-area";
import ElementEditor from "./ElementEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@haloform/ui/select";
import { LayoutPanelTop, MessageSquare, Palette } from "lucide-react";

interface FormPreviewPanelProps {
  elements: FormElementType[];
  onSave?: () => void;
  activeTab: "preview" | "json" | "properties";
  editingElement: FormElementType | null;
  onElementUpdate: (element: FormElementType) => void;
  wizardMode?: boolean;
  columnSpans?: Record<string, 1 | 2 | 3 | 4>;
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  formData?: Record<string, any>;
  onInputChange?: (id: string, value: any) => void;
  headerActions?: React.ReactNode;
  previewMode?: "standard" | "conversational";
  onPreviewModeChange?: (mode: "standard" | "conversational") => void;
  conversationalPreview?: React.ReactNode;
}

// Predefined form styles
const formStyles = {
  default: {
    background: "bg-white dark:bg-black",
    inputBackground: "bg-white dark:bg-black",
    inputBorder: "border-black dark:border-white",
    inputFocus: "ring-black dark:ring-white",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-black dark:text-white",
    labelText: "text-black dark:text-white",
  },
  modern: {
    background: "bg-blue-50 dark:bg-blue-950",
    inputBackground: "bg-white dark:bg-black",
    inputBorder: "!border-2 !border-blue-500 dark:!border-blue-400",
    inputFocus: "ring-black dark:ring-white",
    borderRadius: "rounded-xl",
    padding: "p-8",
    inputText: "text-black dark:text-white",
    labelText: "text-black dark:text-white",
  },
  minimal: {
    background: "bg-gray-100 dark:bg-gray-800",
    inputBackground: "bg-white dark:bg-black",
    inputBorder:
      "!border-b-2 !border-gray-400 !border-t-0 !border-l-0 !border-r-0",
    inputFocus: "ring-black dark:ring-white",
    borderRadius: "!rounded-none",
    padding: "p-4",
    inputText: "text-black dark:text-white",
    labelText: "text-black dark:text-white",
  },
  elegant: {
    background:
      "bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900",
    inputBackground: "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm",
    inputBorder: "border-slate-200 dark:border-slate-700",
    inputFocus: "ring-violet-500",
    borderRadius: "rounded-2xl",
    padding: "p-8",
    inputText: "text-slate-900 dark:text-slate-100",
    labelText: "text-slate-700 dark:text-slate-300",
  },
  dark: {
    background: "bg-gray-900 dark:bg-black",
    inputBackground: "bg-gray-800 dark:bg-gray-900",
    inputBorder: "border-gray-700 dark:border-gray-800",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-gray-100 dark:text-gray-100",
    labelText: "text-gray-300 dark:text-gray-400",
  },
  light: {
    background: "bg-gray-50 dark:bg-white",
    inputBackground: "bg-white dark:bg-gray-50",
    inputBorder: "border-gray-200 dark:border-gray-300",
    inputFocus: "ring-blue-500",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-gray-900 dark:text-gray-900",
    labelText: "text-gray-700 dark:text-gray-700",
  },
};

const FormPreviewPanel = ({
  elements,
  onSave,
  activeTab,
  editingElement,
  onElementUpdate,
  wizardMode,
  columnSpans = {},
  selectedStyle,
  onStyleChange,
  formData,
  onInputChange,
  headerActions,
  previewMode = "standard",
  onPreviewModeChange,
  conversationalPreview,
}: FormPreviewPanelProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Preview Header with Style Selector */}
      <div className="border-b border-black dark:border-white px-6 py-3 flex items-center justify-between gap-4 bg-white dark:bg-black">
        {/* <h3 className="text-lg font-semibold text-black dark:text-white">
          Live Form Preview
        </h3> */}

        <div className="flex items-center gap-3">
          {onPreviewModeChange ? (
            <div className="inline-flex items-center rounded-lg border border-black dark:border-white p-1">
              <Button
                type="button"
                variant={previewMode === "standard" ? "default" : "ghost"}
                className="h-8 gap-2 px-3"
                onClick={() => onPreviewModeChange("standard")}
              >
                <LayoutPanelTop className="h-4 w-4" />
                <span>Standard</span>
              </Button>
              <Button
                type="button"
                variant={previewMode === "conversational" ? "default" : "ghost"}
                className="h-8 gap-2 px-3"
                onClick={() => onPreviewModeChange("conversational")}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Conversational</span>
              </Button>
            </div>
          ) : null}

          {/* Style selector */}
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-black dark:text-white" />
            <Select value={selectedStyle} onValueChange={onStyleChange}>
              <SelectTrigger className="w-[120px] bg-white dark:bg-black border-black dark:border-white text-black dark:text-white">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-black border-black dark:border-white">
                <SelectItem
                  value="default"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Default
                </SelectItem>
                <SelectItem
                  value="modern"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Modern
                </SelectItem>
                <SelectItem
                  value="minimal"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Minimal
                </SelectItem>
                <SelectItem
                  value="elegant"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Elegant
                </SelectItem>
                <SelectItem
                  value="dark"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Dark
                </SelectItem>
                <SelectItem
                  value="light"
                  className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800">
                  Light
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {headerActions ? (
          <div className="ml-auto flex items-center">{headerActions}</div>
        ) : null}
      </div>

      <div className="flex-grow overflow-hidden h-full">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="preview" className="h-full m-0">
            {previewMode === "conversational" && conversationalPreview ? (
              conversationalPreview
            ) : (
              <FormPreview
                key={selectedStyle}
                elements={elements}
                onSave={onSave}
                wizardMode={wizardMode}
                columnSpans={columnSpans}
                formStyle={
                  formStyles[selectedStyle as keyof typeof formStyles] ||
                  formStyles.default
                }
                formData={formData}
                onInputChange={onInputChange}
              />
            )}
          </TabsContent>
          <TabsContent value="json" className="h-full m-0">
            <ScrollArea className="h-full">
              <pre className="p-4 text-sm">
                {JSON.stringify(
                  {
                    elements,
                    style: selectedStyle,
                    wizardMode,
                    columnSpans,
                    metadata: {
                      createdAt: new Date().toISOString(),
                      version: "1.0.0",
                      elementsCount: elements.length,
                      hasValidation: elements.some(
                        (el) => el.properties.validation?.required
                      ),
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="properties" className="h-full m-0">
            {editingElement ? (
              <ElementEditor
                element={editingElement}
                onElementUpdate={onElementUpdate}
                elements={elements}
                wizardMode={wizardMode}
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select an element to edit its properties
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FormPreviewPanel;
