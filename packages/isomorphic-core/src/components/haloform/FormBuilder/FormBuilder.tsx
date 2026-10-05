"use client";
import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
// import ElementPalette from "./ElementPalette"; // Replaced with dropdown
import FormElementsList from "./FormElementsList";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@haloform/ui/resizable";
import {
  generateElement,
  FormElementType,
  ElementType,
} from "@haloform/types/form-builder";
import FormBuilderHeader from "./FormBuilderHeader";
import FormPreviewPanel from "./FormPreviewPanel";

const LOCAL_STORAGE_KEY = "formBuilderElements";

const FormBuilder = () => {
  const [elements, setElements] = useState<FormElementType[]>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "json" | "properties">(
    "preview"
  );
  const [wizardMode, setWizardMode] = useState<boolean>(false);
  const [columnSpans, setColumnSpans] = useState<Record<string, 1 | 2 | 3 | 4>>(
    {}
  );
  const [selectedStyle, setSelectedStyle] = useState<string>("default");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const editingElement =
    elements.find((el) => el.id === editingElementId) || null;

  // Load from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsedElements = JSON.parse(stored) as FormElementType[];
        setElements(parsedElements);
      }
    } catch (e) {}
  }, []);

  // Add new effect to automatically add navigation buttons when wizard mode is toggled on
  useEffect(() => {
    if (wizardMode) {
      // Find if we already have any next or back buttons
      const hasNextButton = elements.some(
        (el) => el.type === "button" && el.properties.buttonType === "next"
      );

      if (!hasNextButton) {
        // Add a "Next" button if we don't have one
        const nextButton = generateElement("button");
        nextButton.properties.buttonType = "next";
        nextButton.properties.buttonText = "Next";
        nextButton.label = "Next Button";

        // Add button at the end
        setElements([...elements, nextButton]);
      }
    }
  }, [wizardMode]);

  // Effect to auto-switch to properties tab when an element is selected
  useEffect(() => {
    if (editingElementId) {
      setActiveTab("properties");
    }
  }, [editingElementId]);

  // Save elements to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(elements));
    } catch (e) {}
  }, [elements]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type) {
      // This is a drag from the palette
    }
  };

  const handleDragOver = () => {
    // Handle drag over events if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // If dragging from palette to the form area
    if (active.data.current?.type && over) {
      const type = active.data.current.type as ElementType;

      const newElement = generateElement(type);

      // If adding a button and wizard mode is on, default to "next" type
      if (type === "button" && wizardMode) {
        newElement.properties.buttonType = "next";
        newElement.properties.buttonText = "Next";
      }

      setElements([...elements, newElement]);
      setEditingElementId(newElement.id);

      toast.success(`Added ${type} element`);
    }
  };

  const handleWizardModeToggle = (enabled: boolean) => {
    setWizardMode(enabled);

    if (enabled) {
      toast.info(
        "Wizard mode enabled. Multi-step form functionality activated."
      );

      // Check if we already have navigation buttons
      const hasNextButton = elements.some(
        (el) => el.type === "button" && el.properties.buttonType === "next"
      );

      // If no next button exists, create one
      if (!hasNextButton) {
        const nextButton = generateElement("button");
        nextButton.properties.buttonType = "next";
        nextButton.properties.buttonText = "Next";
        nextButton.label = "Next Button";

        setElements([...elements, nextButton]);
        toast.success("Added navigation button to start multi-step form");
      }
    }
  };

  const handleAddElement = (type: ElementType) => {
    const newElement = generateElement(type);

    // If adding a button and wizard mode is on, default to "next" type
    if (type === "button" && wizardMode) {
      newElement.properties.buttonType = "next";
      newElement.properties.buttonText = "Next";
      newElement.label = "Next Button";
    }

    setElements([...elements, newElement]);
    // Do NOT set editingElementId here, so tab does not switch
    toast.success(`Added ${type} element`);
  };

  const handleElementUpdate = (updatedElement: FormElementType) => {
    const newElements = elements.map((element) =>
      element.id === updatedElement.id ? updatedElement : element
    );
    setElements(newElements);
  };

  const handleElementsChange = (newElements: FormElementType[]) => {
    setElements(newElements);
  };

  const handleSaveForm = () => {
    console.log("Form structure:", JSON.stringify(elements, null, 2));
    toast.success("Form structure logged to console");
  };

  const handleClearForm = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the form? This will remove all elements."
      )
    ) {
      setElements([]);
      setEditingElementId(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}
      toast.info("Form cleared");
    }
  };

  const handleExportForm = (format: "json" | "html") => {
    if (format === "json") {
      const dataStr = JSON.stringify(elements, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileName = "form-structure.json";

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileName);
      linkElement.click();

      toast.success("Form JSON exported successfully");
    } else {
      toast.info("HTML export functionality coming soon");
    }
  };

  const handleDuplicateElement = (elementId: string) => {
    const elementToDuplicate = elements.find((el) => el.id === elementId);
    if (elementToDuplicate) {
      const duplicatedElement = {
        ...elementToDuplicate,
        id: generateElement(elementToDuplicate.type).id,
        label: `${elementToDuplicate.label} (Copy)`,
      };
      setElements([...elements, duplicatedElement]);
      setEditingElementId(duplicatedElement.id);
      toast.success(`Duplicated ${elementToDuplicate.type} element`);
    }
  };

  const handleElementEdit = (id: string | null) => {
    setEditingElementId(id);
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    // If the click is directly on the canvas (not an element), clear element selection
    if (
      (event.target as HTMLElement).classList.contains("canvas-grid") ||
      (event.target as HTMLElement).classList.contains("form-structure-canvas")
    ) {
      setEditingElementId(null);
      if (activeTab === "properties") {
        setActiveTab("preview");
      }
    }
  };

  const handleTabChange = (tab: "preview" | "json" | "properties") => {
    setActiveTab(tab);
    // If switching to properties tab but no element is selected, maintain the current tab
    if (tab === "properties" && !editingElementId) {
      setActiveTab("preview");
      toast.info("Select an element to edit its properties");
    }
  };

  return (
    <div className="h-screen flex flex-col border !border-black dark:!border-white rounded-lg">
      <FormBuilderHeader
        wizardMode={wizardMode}
        onWizardModeToggle={handleWizardModeToggle}
        onSaveForm={handleSaveForm}
        onClearForm={handleClearForm}
        onExportForm={handleExportForm}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
        onAddElement={handleAddElement}
      />
      <div className="flex-grow">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={50}
              collapsible
              className="bg-white dark:bg-black">
              <div
                className="p-4 h-full form-structure-canvas"
                onClick={handleCanvasClick}>
                <div className="overflow-auto h-[calc(100vh-180px)] halo-grid">
                  <div className="canvas-grid rounded-md">
                    <FormElementsList
                      elements={elements}
                      onElementsChange={handleElementsChange}
                      editingElementId={editingElementId}
                      onEditElement={handleElementEdit}
                      onDuplicateElement={handleDuplicateElement}
                      columnSpans={columnSpans}
                      onColumnSpansChange={setColumnSpans}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle className="border-x border-black dark:border-white" />
            <ResizablePanel
              defaultSize={50}
              collapsible
              className="overflow-auto flex flex-col bg-white dark:bg-black">
              <FormPreviewPanel
                elements={elements}
                onSave={handleSaveForm}
                activeTab={activeTab}
                editingElement={editingElement}
                onElementUpdate={handleElementUpdate}
                wizardMode={wizardMode}
                columnSpans={columnSpans}
                selectedStyle={selectedStyle}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </DndContext>
      </div>
    </div>
  );
};

export default FormBuilder;
