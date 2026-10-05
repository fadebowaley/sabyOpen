"use client";
import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import FormElement from "./FormElement";
import { FormElementType } from "@haloform/types/form-builder";

interface FormElementsListProps {
  elements: FormElementType[];
  onElementsChange: (elements: FormElementType[]) => void;
  editingElementId: string | null;
  onEditElement: (id: string | null) => void;
  onDuplicateElement: (id: string) => void;
  columnSpans: Record<string, 1 | 2 | 3 | 4>;
  onColumnSpansChange: (spans: Record<string, 1 | 2 | 3 | 4>) => void;
}

const FormElementsList = ({
  elements,
  onElementsChange,
  editingElementId,
  onEditElement,
  onDuplicateElement,
  columnSpans,
  onColumnSpansChange,
}: FormElementsListProps) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((item) => item.id === active.id);
      const newIndex = elements.findIndex((item) => item.id === over.id);

      const newElements = arrayMove(elements, oldIndex, newIndex);
      onElementsChange(newElements);
    }
  };

  const handleRemoveElement = (id: string) => {
    const newElements = elements.filter((element) => element.id !== id);
    onElementsChange(newElements);

    // Remove column span data for removed element
    const newColumnSpans = { ...columnSpans };
    delete newColumnSpans[id];
    onColumnSpansChange(newColumnSpans);

    if (editingElementId === id) {
      onEditElement(null);
    }
  };

  const handleColSpanChange = (id: string, span: 1 | 2 | 3 | 4) => {
    // Update the local columnSpans state for immediate UI feedback
    onColumnSpansChange({
      ...columnSpans,
      [id]: span,
    });

    // Also persist the span inside the element's own properties
    const updatedElements = elements.map((el) =>
      el.id === id
        ? { ...el, properties: { ...el.properties, colSpan: span } }
        : el
    );
    onElementsChange(updatedElements);
  };

  const getCurrentSpan = (id: string): 1 | 2 | 3 | 4 => {
    return (
      columnSpans[id] ||
      (elements.find((e) => e.id === id)?.properties.colSpan as
        | 1
        | 2
        | 3
        | 4) ||
      1
    );
  };

  const increaseColumnSpan = (id: string) => {
    const currentSpan = getCurrentSpan(id);
    if (currentSpan < 4) {
      handleColSpanChange(id, (currentSpan + 1) as 1 | 2 | 3 | 4);
    }
  };

  const decreaseColumnSpan = (id: string) => {
    const currentSpan = getCurrentSpan(id);
    if (currentSpan > 1) {
      handleColSpanChange(id, (currentSpan - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}>
      <SortableContext
        items={elements.map((e) => e.id)}
        strategy={verticalListSortingStrategy}>
        {elements.length === 0 && (
          <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground col-span-4 dark:border-neutral-700 dark:text-neutral-400">
            Drag elements here to build your form for your project.
          </div>
        )}
        {elements.map((element) => (
          <FormElement
            key={element.id}
            element={element}
            onRemove={handleRemoveElement}
            onEdit={onEditElement}
            onDuplicate={onDuplicateElement}
            isEditing={element.id === editingElementId}
            colSpan={getCurrentSpan(element.id)}
            onIncreaseSpan={() => increaseColumnSpan(element.id)}
            onDecreaseSpan={() => decreaseColumnSpan(element.id)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default FormElementsList;
