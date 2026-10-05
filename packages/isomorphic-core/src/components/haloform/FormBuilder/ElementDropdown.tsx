"use client";
import React, { useState } from "react";
import { Button } from "@haloform/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@haloform/ui/dropdown-menu";
import { Plus, ChevronDown } from "lucide-react";
import { ElementType } from "@haloform/types/form-builder";
import { FormFieldIcon } from "./FormFieldIcon";

interface ElementDropdownProps {
  onAddElement: (type: ElementType) => void;
}

interface ElementCategory {
  label: string;
  elements: Array<{
    type: ElementType;
    label: string;
    description: string;
  }>;
}

const elementCategories: ElementCategory[] = [
  {
    label: "Basic Elements",
    elements: [
      {
        type: "text",
        label: "Text Input",
        description: "Single line text field",
      },
      { type: "email", label: "Email", description: "Email address input" },
      { type: "number", label: "Number", description: "Numeric input field" },
      {
        type: "password",
        label: "Password",
        description: "Password input field",
      },
      {
        type: "textarea",
        label: "Text Area",
        description: "Multi-line text field",
      },
      {
        type: "checkbox",
        label: "Checkbox",
        description: "Multiple choice selection",
      },
      {
        type: "radio",
        label: "Radio Group",
        description: "Single choice selection",
      },
      {
        type: "dropdown",
        label: "Dropdown",
        description: "Select from options",
      },
    ],
  },
  {
    label: "Advanced Elements",
    elements: [
      {
        type: "datepicker",
        label: "Date Picker",
        description: "Date selection",
      },
      {
        type: "timepicker",
        label: "Time Picker",
        description: "Time selection",
      },
      {
        type: "fileupload",
        label: "File Upload",
        description: "File attachment",
      },
      { type: "toggle", label: "Toggle", description: "On/off switch" },
      {
        type: "slider",
        label: "Range Slider",
        description: "Numeric range selector",
      },
      { type: "rating", label: "Rating", description: "Star or emoji rating" },
      {
        type: "signature",
        label: "Signature",
        description: "Digital signature pad",
      },
      {
        type: "locationPicker",
        label: "Location",
        description: "Map location picker",
      },
    ],
  },
  {
    label: "Special Elements",
    elements: [
      { type: "button", label: "Button", description: "Action button" },
      {
        type: "dependentDropdown",
        label: "Linked Dropdown",
        description: "Dependent select field",
      },
      {
        type: "searchLookup",
        label: "DB Lookup",
        description: "Database search field",
      },
      {
        type: "sessionLookup",
        label: "Session Lookup",
        description: "Read from user/session context",
      },
      {
        type: "endpointSubmission",
        label: "Endpoint Submission",
        description: "Submit flow to external endpoint",
      },
      {
        type: "captcha",
        label: "CAPTCHA",
        description: "Security verification",
      },
      {
        type: "hidden",
        label: "Hidden Field",
        description: "Hidden form value",
      },
    ],
  },
  {
    label: "Layout Elements",
    elements: [
      { type: "header", label: "Form Header", description: "Section heading" },
      {
        type: "paragraph",
        label: "Text Paragraph",
        description: "Descriptive text",
      },
    ],
  },
];

const ElementDropdown = ({ onAddElement }: ElementDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddElement = (type: ElementType) => {
    onAddElement(type);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white dark:bg-black border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus size={16} />
          Add Element
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 max-h-[70vh] overflow-y-auto bg-white dark:bg-black border-black dark:border-white p-1"
        align="start"
      >
        <DropdownMenuLabel className="text-black dark:text-white font-semibold px-2 py-1.5 text-sm">
          🧩 Form Elements
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

        {elementCategories.map((category, categoryIndex) => (
          <DropdownMenuSub key={category.label}>
            <DropdownMenuSubTrigger className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5">
              <span className="font-medium text-sm">{category.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 bg-white dark:bg-black border-black dark:border-white p-1">
              {category.elements.map((element) => (
                <DropdownMenuItem
                  key={element.type}
                  onClick={() => handleAddElement(element.type)}
                  className="flex items-start gap-1.5 px-2 py-1.5 cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <FormFieldIcon type={element.type} size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{element.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {element.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

        {/* Quick Access to Most Common Elements */}
        <DropdownMenuLabel className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide px-2 py-1">
          Quick Add
        </DropdownMenuLabel>
        {elementCategories[0].elements.slice(0, 4).map((element) => (
          <DropdownMenuItem
            key={`quick-${element.type}`}
            onClick={() => handleAddElement(element.type)}
            className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FormFieldIcon type={element.type} size={14} />
            <span className="text-sm">{element.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ElementDropdown;
