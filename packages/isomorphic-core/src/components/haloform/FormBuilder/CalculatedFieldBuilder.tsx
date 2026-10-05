import React from "react";
import { FormElementType } from "@haloform/types/form-builder";
import { Label } from "@haloform/ui/label";
import { Input } from "@haloform/ui/input";
import { Button } from "@haloform/ui/button";

interface CalculatedFieldBuilderProps {
  element: FormElementType;
  elements: FormElementType[];
  onPropertyChange: (property: string, value: any) => void;
}

const CalculatedFieldBuilder: React.FC<CalculatedFieldBuilderProps> = ({
  element,
  elements,
  onPropertyChange,
}) => {
  return (
    <div className="space-y-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
      <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-800">
        <div className="p-2 bg-blue-500 text-white rounded-lg">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <Label className="text-lg font-semibold text-blue-700 dark:text-blue-300">
          Advanced Formula Builder
        </Label>
      </div>

      {/* Available Fields for Calculation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Available Fields
          </Label>
        </div>
        <div className="max-h-32 overflow-y-auto border border-blue-200 dark:border-blue-800 rounded p-2 bg-white dark:bg-blue-900">
          {elements
            .filter(
              (elem) =>
                elem.id !== element.id &&
                (elem.type === "number" ||
                  elem.type === "slider" ||
                  elem.type === "hidden")
            )
            .map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between py-1 px-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-xs">
                <span className="font-mono text-blue-700 dark:text-blue-300">
                  {field.id}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {field.label || "Unnamed"} (
                  {field.type === "number" &&
                  field.properties?.numberType === "percentage"
                    ? "percentage"
                    : field.type === "number" &&
                        field.properties?.numberType === "currency"
                      ? "currency"
                      : field.type}
                  )
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full"
                  onClick={() => {
                    const currentFormula = element.properties.formula || "";
                    const newFormula =
                      currentFormula + (currentFormula ? " + " : "") + field.id;
                    onPropertyChange("formula", newFormula);
                  }}
                  title={`Add ${field.label || field.id} to formula`}>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Button>
              </div>
            ))}
          {elements.filter(
            (elem) =>
              elem.id !== element.id &&
              (elem.type === "number" ||
                elem.type === "slider" ||
                elem.type === "hidden")
          ).length === 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
              No numeric fields available for calculation
            </div>
          )}
        </div>
      </div>

      {/* Math Operators */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <Label className="text-sm font-semibold text-green-700 dark:text-green-300">
            Math Operators
          </Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { op: "+", label: "Add", color: "green" },
            { op: "-", label: "Subtract", color: "green" },
            { op: "*", label: "Multiply", color: "green" },
            { op: "/", label: "Divide", color: "green" },
            { op: "%", label: "Modulo", color: "green" },
            { op: "^", label: "Power", color: "green" },
            { op: "(", label: "Open", color: "gray" },
            { op: ")", label: "Close", color: "gray" },
            { op: "sqrt(", label: "Square Root", color: "purple" },
            { op: "abs(", label: "Absolute", color: "purple" },
          ].map((item) => (
            <Button
              key={item.op}
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 px-3 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                item.color === "green"
                  ? "border-green-300 hover:bg-green-100 text-green-700 dark:border-green-700 dark:hover:bg-green-800 dark:text-green-300"
                  : item.color === "purple"
                    ? "border-purple-300 hover:bg-purple-100 text-purple-700 dark:border-purple-700 dark:hover:bg-purple-800 dark:text-purple-300"
                    : "border-gray-300 hover:bg-gray-100 text-gray-700 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
              }`}
              onClick={() => {
                const currentFormula = element.properties.formula || "";
                const newFormula = currentFormula + item.op;
                onPropertyChange("formula", newFormula);
              }}
              title={item.label}>
              {item.op}
            </Button>
          ))}
        </div>
      </div>

      {/* Logical Operators */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-orange-600 dark:text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <Label className="text-sm font-semibold text-orange-700 dark:text-orange-300">
            Logic & Comparison
          </Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { symbol: ">", label: "Greater than", color: "orange" },
            { symbol: "<", label: "Less than", color: "orange" },
            { symbol: ">=", label: "Greater or equal", color: "orange" },
            { symbol: "<=", label: "Less or equal", color: "orange" },
            { symbol: "==", label: "Equal to", color: "orange" },
            { symbol: "!=", label: "Not equal", color: "orange" },
            { symbol: "&&", label: "AND", color: "blue" },
            { symbol: "||", label: "OR", color: "blue" },
            { symbol: "?", label: "If true", color: "purple" },
            { symbol: ":", label: "If false", color: "purple" },
          ].map((op) => (
            <Button
              key={op.symbol}
              type="button"
              variant="outline"
              size="sm"
              className={`h-8 px-3 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                op.color === "orange"
                  ? "border-orange-300 hover:bg-orange-100 text-orange-700 dark:border-orange-700 dark:hover:bg-orange-800 dark:text-orange-300"
                  : op.color === "blue"
                    ? "border-blue-300 hover:bg-blue-100 text-blue-700 dark:border-blue-700 dark:hover:bg-blue-800 dark:text-blue-300"
                    : "border-purple-300 hover:bg-purple-100 text-purple-700 dark:border-purple-700 dark:hover:bg-purple-800 dark:text-purple-300"
              }`}
              onClick={() => {
                const currentFormula = element.properties.formula || "";
                const newFormula = currentFormula + " " + op.symbol + " ";
                onPropertyChange("formula", newFormula);
              }}
              title={op.label}>
              {op.symbol}
            </Button>
          ))}
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <strong>Conditional Example:</strong>{" "}
            <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-amber-800 dark:text-amber-200">
              (field1 &gt; 100) ? field1 * 0.9 : field1
            </code>
          </p>
        </div>
      </div>

      {/* Quick Numbers */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
            />
          </svg>
          <Label className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            Quick Numbers
          </Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "0.5", label: "Half" },
            { value: "1", label: "One" },
            { value: "2", label: "Two" },
            { value: "5", label: "Five" },
            { value: "10", label: "Ten" },
            { value: "100", label: "Hundred" },
            { value: "0.74", label: "Tax Rate" },
            { value: "1.5", label: "1.5x" },
            { value: "0.25", label: "Quarter" },
            { value: "3.14", label: "Pi" },
          ].map((constant) => (
            <Button
              key={constant.value}
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-medium rounded-lg border-2 border-indigo-300 hover:bg-indigo-100 text-indigo-700 dark:border-indigo-700 dark:hover:bg-indigo-800 dark:text-indigo-300 transition-all duration-200 hover:scale-105"
              onClick={() => {
                const currentFormula = element.properties.formula || "";
                const newFormula = currentFormula + constant.value;
                onPropertyChange("formula", newFormula);
              }}
              title={constant.label}>
              {constant.value}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <svg
            className="w-4 h-4 text-slate-600 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <Input
            placeholder="Enter custom number..."
            className="flex-1 h-8 text-xs border-slate-300 dark:border-slate-700"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = (e.target as HTMLInputElement).value;
                if (value && !isNaN(Number(value))) {
                  const currentFormula = element.properties.formula || "";
                  const newFormula = currentFormula + value;
                  onPropertyChange("formula", newFormula);
                  (e.target as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CalculatedFieldBuilder;
