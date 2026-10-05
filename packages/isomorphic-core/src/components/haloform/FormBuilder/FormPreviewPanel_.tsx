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
import { Palette, Edit3 } from "lucide-react";

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
  userSettings?: any;
  onUserSettingsChange?: (settings: any) => void;
  isEditMode?: boolean;
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
    background: "bg-gray-50 dark:bg-gray-900",
    inputBackground: "bg-white dark:bg-black",
    inputBorder: "border-gray-300 dark:border-gray-600",
    inputFocus: "ring-gray-500 dark:ring-gray-400",
    borderRadius: "rounded-none",
    padding: "p-4",
    inputText: "text-gray-900 dark:text-white",
    labelText: "text-gray-700 dark:text-gray-300",
  },
  elegant: {
    background: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950",
    inputBackground: "bg-white dark:bg-black",
    inputBorder: "border-purple-200 dark:border-purple-700",
    inputFocus: "ring-purple-500 dark:ring-purple-400",
    borderRadius: "rounded-2xl",
    padding: "p-8",
    inputText: "text-gray-900 dark:text-white",
    labelText: "text-purple-800 dark:text-purple-200",
  },
  dark: {
    background: "bg-gray-900 dark:bg-black",
    inputBackground: "bg-gray-800 dark:bg-gray-900",
    inputBorder: "border-gray-600 dark:border-gray-700",
    inputFocus: "ring-blue-500 dark:ring-blue-400",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-white dark:text-white",
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
  wizardMode = false,
  columnSpans = {},
  selectedStyle,
  onStyleChange,
  userSettings,
  onUserSettingsChange,
  isEditMode = false,
}: FormPreviewPanelProps) => {
  const currentStyle = formStyles[selectedStyle as keyof typeof formStyles] || formStyles.default;

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Form Preview
        </h3>
        {isEditMode && (
          <div className="flex items-center space-x-2 rounded-lg bg-blue-100 px-2 py-1 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Edit3 className="h-4 w-4" />
            <span className="text-xs font-medium">Edit Mode</span>
          </div>
        )}
      </div>
      
      <div className="rounded-lg border border-gray-200 dark:border-gray-700">
        <FormPreview
          elements={elements}
          style={currentStyle}
          wizardMode={wizardMode}
          columnSpans={columnSpans}
          isPreview={true}
        />
      </div>
    </div>
  );

  const renderJSON = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Form JSON
      </h3>
      <ScrollArea className="h-96 rounded-lg border border-gray-200 dark:border-gray-700">
        <pre className="p-4 text-sm text-gray-800 dark:text-gray-200">
          {JSON.stringify(elements, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Element Properties
      </h3>
      {editingElement ? (
        <ElementEditor
          element={editingElement}
          onUpdate={onElementUpdate}
        />
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Select an element to edit its properties</p>
        </div>
      )}
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        User Settings
      </h3>
      <div className="space-y-4">
        {/* Access Settings */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Access Control</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={userSettings?.access?.restrictByLocation || false}
                onChange={(e) => onUserSettingsChange?.({
                  ...userSettings,
                  access: {
                    ...userSettings?.access,
                    restrictByLocation: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Restrict by location</span>
            </label>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Form Behavior</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={userSettings?.behavior?.allowMultipleSubmissions || false}
                onChange={(e) => onUserSettingsChange?.({
                  ...userSettings,
                  behavior: {
                    ...userSettings?.behavior,
                    allowMultipleSubmissions: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Allow multiple submissions</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={userSettings?.behavior?.enableProgressSave || false}
                onChange={(e) => onUserSettingsChange?.({
                  ...userSettings,
                  behavior: {
                    ...userSettings?.behavior,
                    enableProgressSave: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable progress save</span>
            </label>
          </div>
        </div>

        {/* UI Settings */}
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-2 font-medium text-gray-900 dark:text-white">UI Settings</h4>
          <div className="space-y-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Theme
            </label>
            <select
              value={userSettings?.ui?.theme || 'default'}
              onChange={(e) => onUserSettingsChange?.({
                ...userSettings,
                ui: {
                  ...userSettings?.ui,
                  theme: e.target.value
                }
              })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="default">Default</option>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="elegant">Elegant</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <Tabs value={activeTab} className="h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <div className="p-4">
          <TabsContent value="preview" className="mt-0">
            {renderPreview()}
          </TabsContent>
          
          <TabsContent value="json" className="mt-0">
            {renderJSON()}
          </TabsContent>
          
          <TabsContent value="properties" className="mt-0">
            {renderProperties()}
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            {renderUserSettings()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default FormPreviewPanel;
