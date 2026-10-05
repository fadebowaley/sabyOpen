import React from "react";
import { FormElementType } from "@haloform/types/form-builder";
import { Label } from "@haloform/ui/label";
import { Input } from "@haloform/ui/input";
import { Button } from "@haloform/ui/button";
import { Textarea } from "@haloform/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@haloform/ui/select";
import { Checkbox } from "@haloform/ui/checkbox";

interface NumberFieldEditorProps {
  element: FormElementType;
  elements: FormElementType[];
  onPropertyChange: (property: string, value: any, isNested?: boolean) => void;
}

const NumberFieldEditor: React.FC<NumberFieldEditorProps> = ({
  element,
  elements,
  onPropertyChange,
}) => {
  const handlePropertyChange = (
    property: string,
    value: any,
    isNested: boolean = false
  ) => {
    onPropertyChange(property, value, isNested);
  };

  return (
    <div className="space-y-4">
      {/* Number Type Selection */}
      <div>
        <Label htmlFor="numberType" className="text-sm">
          Number Type
        </Label>
        <Select
          value={element.properties.numberType || "basic"}
          onValueChange={(value) => handlePropertyChange("numberType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select number type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <SelectItem value="basic">Basic Number</SelectItem>
            <SelectItem value="currency">Currency</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="phone">Phone Number</SelectItem>
            <SelectItem value="calculated">Calculated Field</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Basic Number Properties - All in one row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="min" className="text-sm">
            Min Value
          </Label>
          <Input
            id="min"
            type="number"
            value={element.properties.min || ""}
            onChange={(e) =>
              handlePropertyChange(
                "min",
                parseFloat(e.target.value) || undefined
              )
            }
            placeholder="Minimum value"
          />
        </div>
        <div>
          <Label htmlFor="max" className="text-sm">
            Max Value
          </Label>
          <Input
            id="max"
            type="number"
            value={element.properties.max || ""}
            onChange={(e) =>
              handlePropertyChange(
                "max",
                parseFloat(e.target.value) || undefined
              )
            }
            placeholder="Maximum value"
          />
        </div>
        <div>
          <Label htmlFor="step" className="text-sm">
            Step
          </Label>
          <Input
            id="step"
            type="number"
            value={element.properties.step || ""}
            onChange={(e) =>
              handlePropertyChange(
                "step",
                parseFloat(e.target.value) || undefined
              )
            }
            placeholder="Step (e.g., 0.01)"
          />
        </div>
      </div>

      {/* Currency Settings */}
      {element.properties.numberType === "currency" && (
        <div className="space-y-3 p-4 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-950">
          <div className="flex items-center gap-2 pb-2 border-b border-green-200 dark:border-green-800">
            <div className="p-2 bg-green-500 text-white rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <Label className="font-semibold text-green-700 dark:text-green-300">
              Currency Settings
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="currency" className="text-sm">
                Currency
              </Label>
              <Select
                value={element.properties.currency || "USD"}
                onValueChange={(value) =>
                  handlePropertyChange("currency", value)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currencyPosition" className="text-sm">
                Position
              </Label>
              <Select
                value={element.properties.currencyPosition || "before"}
                onValueChange={(value) =>
                  handlePropertyChange("currencyPosition", value)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="before">Before ($100)</SelectItem>
                  <SelectItem value="after">After (100$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="currencyDecimalPlaces" className="text-sm">
                Decimal Places
              </Label>
              <Input
                id="currencyDecimalPlaces"
                type="number"
                min="0"
                max="4"
                value={element.properties.currencyDecimalPlaces || 2}
                onChange={(e) =>
                  handlePropertyChange(
                    "currencyDecimalPlaces",
                    parseInt(e.target.value) || 2
                  )
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="showThousandsSeparator"
                checked={element.properties.showThousandsSeparator !== false}
                onCheckedChange={(checked) =>
                  handlePropertyChange("showThousandsSeparator", checked)
                }
              />
              <Label htmlFor="showThousandsSeparator" className="text-sm">
                Show Thousands Separator
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Percentage Settings */}
      {element.properties.numberType === "percentage" && (
        <div className="space-y-3 p-4 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-950">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200 dark:border-amber-800">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
            <Label className="font-semibold text-amber-700 dark:text-amber-300">
              Percentage Settings
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="decimalPlaces" className="text-sm">
                Decimal Places
              </Label>
              <Input
                id="decimalPlaces"
                type="number"
                min="0"
                max="4"
                value={element.properties.decimalPlaces || 0}
                onChange={(e) =>
                  handlePropertyChange(
                    "decimalPlaces",
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="showPercentSymbol"
                checked={element.properties.showPercentSymbol !== false}
                onCheckedChange={(checked) =>
                  handlePropertyChange("showPercentSymbol", checked)
                }
              />
              <Label htmlFor="showPercentSymbol" className="text-sm">
                Show % Symbol
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Phone Number Settings */}
      {element.properties.numberType === "phone" && (
        <div className="space-y-3 p-4 border border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-950">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-200 dark:border-purple-800">
            <div className="p-2 bg-purple-500 text-white rounded-lg">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <Label className="font-semibold text-purple-700 dark:text-purple-300">
              Phone Settings
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="defaultCountry" className="text-sm">
                Default Country
              </Label>
              <Select
                value={element.properties.defaultCountry || "US"}
                onValueChange={(value) =>
                  handlePropertyChange("defaultCountry", value)
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="internationalFormat"
                checked={element.properties.internationalFormat !== false}
                onCheckedChange={(checked) =>
                  handlePropertyChange("internationalFormat", checked)
                }
              />
              <Label htmlFor="internationalFormat" className="text-sm">
                International Format
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Calculated Field Settings - Compact Version */}
      {element.properties.numberType === "calculated" && (
        <div className="space-y-4 border border-blue-300 dark:border-blue-700 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4">
          <div className="flex items-center gap-2 pb-2 border-b border-blue-200 dark:border-blue-800">
            <div className="p-1.5 bg-blue-500 text-white rounded-lg">
              <svg
                className="w-4 h-4"
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
            <Label className="text-base font-semibold text-blue-700 dark:text-blue-300">
              Formula Builder
            </Label>
          </div>

          {/* Formula Input */}
          <div>
            <Label htmlFor="formula" className="text-sm">
              Formula
            </Label>
            <Textarea
              id="formula"
              value={element.properties.formula || ""}
              onChange={(e) => handlePropertyChange("formula", e.target.value)}
              placeholder="e.g., quantity * price + tax"
              rows={2}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">
                Use field IDs, operators, and functions
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-red-600 hover:text-red-800"
                onClick={() => handlePropertyChange("formula", "")}>
                Clear
              </Button>
            </div>
          </div>

          {/* Read-only Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="readOnlyCalculated"
              checked={element.properties.readOnlyCalculated !== false}
              onCheckedChange={(checked) =>
                handlePropertyChange("readOnlyCalculated", checked)
              }
            />
            <Label htmlFor="readOnlyCalculated" className="text-sm">
              Make calculated field read-only
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberFieldEditor;
