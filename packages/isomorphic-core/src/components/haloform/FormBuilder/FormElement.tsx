"use client";
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@haloform/ui/button";
import { ArrowLeft, ArrowRight, Copy, GripVertical, X } from "lucide-react";
import { FormElementType } from "@haloform/types/form-builder";

interface FormElementProps {
  element: FormElementType;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  isEditing: boolean;
  colSpan?: 1 | 2 | 3 | 4;
  onIncreaseSpan?: () => void;
  onDecreaseSpan?: () => void;
}

const FormElement = ({
  element,
  onRemove,
  onEdit,
  onDuplicate,
  isEditing,
  colSpan = 1,
  onIncreaseSpan,
  onDecreaseSpan,
}: FormElementProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(element.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(element.id);
  };

  const getColSpanClass = () => {
    switch (colSpan) {
      case 1:
        return "col-span-1";
      case 2:
        return "col-span-2";
      case 3:
        return "col-span-3";
      case 4:
        return "col-span-4";
      default:
        return "col-span-1";
    }
  };

  const displayLabel =
    (typeof element.label === "string" && element.label.trim()) ||
    (typeof element.properties?.label === "string" &&
      element.properties.label.trim()) ||
    "Untitled element";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative border-2 border-black dark:border-white rounded-xl p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900 form-element-hover shadow-lg hover:shadow-xl transition-all duration-200 ${getColSpanClass()}
        ${isDragging ? "dragging" : ""}
        ${isEditing ? "ring-4 ring-blue-500 ring-opacity-50 border-blue-500 dark:border-blue-400" : ""}
        dark:text-neutral-200 backdrop-blur-sm
        
      `}
      onClick={() => onEdit(element.id)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="drag-handle p-1 rounded-lg hover:bg-white/50 dark:hover:bg-black/30 cursor-grab transition-colors flex-shrink-0"
          >
            <GripVertical
              size={16}
              className="text-gray-500 dark:text-neutral-400"
            />
          </div>
          <div className="font-medium text-xs sm:text-sm truncate flex-1">
            {displayLabel}
          </div>
        </div>

        <div className="element-actions flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={handleRemove}
            title="Remove"
          >
            <X size={10} className="text-red-600 dark:text-red-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            onClick={handleDuplicate}
            title="Duplicate"
          >
            <Copy size={10} className="text-blue-600 dark:text-blue-400" />
          </Button>
        </div>
      </div>

      {/* Only show column controls if there are actual controls to display */}
      {((onDecreaseSpan && colSpan > 1) || (onIncreaseSpan && colSpan < 4)) && (
        <div className="flex items-center justify-center gap-1 bg-white dark:bg-neutral-800 rounded-md shadow-sm border border-gray-200 dark:border-neutral-700 py-1 px-2">
          {onDecreaseSpan && colSpan > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDecreaseSpan();
              }}
              title="Decrease width"
            >
              <ArrowLeft
                size={10}
                className="text-gray-700 dark:text-neutral-200"
              />
            </Button>
          )}

          <span className="text-xs text-gray-600 dark:text-neutral-400 px-1 whitespace-nowrap">
            {colSpan} column{colSpan > 1 ? "s" : ""}
          </span>

          {onIncreaseSpan && colSpan < 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 rounded hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onIncreaseSpan();
              }}
              title="Increase width"
            >
              <ArrowRight
                size={10}
                className="text-gray-700 dark:text-neutral-200"
              />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormElement;
