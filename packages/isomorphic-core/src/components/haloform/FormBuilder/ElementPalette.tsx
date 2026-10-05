"use client";
import React, { useState } from "react";
import { Button } from "@haloform/ui/button";
import { Card } from "@haloform/ui/card";
import { Tabs, TabsContent } from "@haloform/ui/tabs";
import { ElementType } from "@haloform/types/form-builder";
import { FormFieldIcon } from "./FormFieldIcon";
import { Minus, Maximize2 } from "lucide-react";
import DraggableWrapper from "../DraggableWrapper";

interface ElementPaletteProps {
  onAddElement: (type: ElementType) => void;
}

interface DraggableElementProps {
  type: ElementType;
  label: string;
  onAddElement: (type: ElementType) => void;
}

const DraggableElement = ({
  type,
  label,
  onAddElement,
}: DraggableElementProps) => (
  <Button
    variant="outline"
    className="justify-start w-full mb-2 gap-2 text-xs transition-all hover:shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900 bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-700"
    onClick={() => onAddElement(type)}
  >
    <FormFieldIcon type={type} size={16} />
    <span className="truncate">{label}</span>
  </Button>
);

const ElementPalette = ({ onAddElement }: ElementPaletteProps) => {
  const [activeCategory, setActiveCategory] = useState<string>("basic");
  const [isMinimized, setIsMinimized] = useState(false);

  const categories = [
    { value: "basic", icon: "text", tooltip: "Basic" },
    { value: "advanced", icon: "slider", tooltip: "Advanced" },
    { value: "special", icon: "star", tooltip: "Special" },
    { value: "layout", icon: "layout", tooltip: "Layout" },
  ];

  return (
    <DraggableWrapper>
      <Card
        className={`element-palette-override ${
          isMinimized ? "w-12 h-80" : "w-64 max-h-[80vh]"
        } bg-white dark:bg-neutral-900 shadow-2xl shadow-blue-500/20 border-2 border-blue-500 dark:border-blue-400 rounded-xl overflow-hidden flex flex-col ring-4 ring-blue-500/30`}
        style={{
          position: "fixed",
          top: "8rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999999,
        }}
      >
        <div
          className={`handle flex items-center justify-between p-3 cursor-move border-b border-blue-300 dark:border-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800`}
        >
          {!isMinimized && (
            <span className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              🧩 Element Palette
            </span>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-blue-500 dark:hover:bg-blue-600 transition-all text-white"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
          </button>
        </div>

        {isMinimized ? (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
            <span className="text-xs text-blue-800 dark:text-blue-200 font-bold tracking-tight rotate-90 whitespace-nowrap">
              🧩 ELEMENTS
            </span>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Sidebar Tabs */}
            <div className="flex flex-col gap-2 p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800">
              {categories.map((cat) => (
                <div key={cat.value} className="relative group">
                  <button
                    onClick={() => setActiveCategory(cat.value)}
                    className={`p-2 rounded-md flex items-center justify-center w-10 h-10 transition-all hover:bg-blue-100 dark:hover:bg-blue-800 ${
                      activeCategory === cat.value
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <FormFieldIcon type={cat.icon as ElementType} size={16} />
                  </button>
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {cat.tooltip}
                  </span>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 w-full max-h-[70vh] custom-scroll">
              <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                <TabsContent value="basic" className="space-y-2">
                  <DraggableElement
                    type="text"
                    label="Text Input"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="email"
                    label="Email"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="number"
                    label="Number"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="password"
                    label="Password"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="textarea"
                    label="Text Area"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="checkbox"
                    label="Checkbox"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="radio"
                    label="Radio Group"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="dropdown"
                    label="Dropdown"
                    onAddElement={onAddElement}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-2">
                  <DraggableElement
                    type="datepicker"
                    label="Date Picker"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="timepicker"
                    label="Time Picker"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="fileupload"
                    label="File Upload"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="toggle"
                    label="Toggle"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="slider"
                    label="Range Slider"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="hidden"
                    label="Hidden Field"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="rating"
                    label="Rating"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="dependentDropdown"
                    label="Linked Dropdown"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="signature"
                    label="Signature"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="locationPicker"
                    label="Location"
                    onAddElement={onAddElement}
                  />
                </TabsContent>

                <TabsContent value="special" className="space-y-2">
                  <DraggableElement
                    type="button"
                    label="Button"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="apidropdown"
                    label="API Dropdown"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="searchLookup"
                    label="DB Lookup"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="sessionLookup"
                    label="Session Lookup"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="endpointSubmission"
                    label="Endpoint Submission"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="captcha"
                    label="CAPTCHA"
                    onAddElement={onAddElement}
                  />
                </TabsContent>

                <TabsContent value="layout" className="space-y-2">
                  <DraggableElement
                    type="header"
                    label="Form Header"
                    onAddElement={onAddElement}
                  />
                  <DraggableElement
                    type="paragraph"
                    label="Text Paragraph"
                    onAddElement={onAddElement}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </Card>
    </DraggableWrapper>
  );
};

export default ElementPalette;
