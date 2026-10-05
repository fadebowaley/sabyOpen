import React, { useState, useEffect } from "react";
import { FormElementType } from "@haloform/types/form-builder";
import { Input } from "@haloform/ui/input";
import { Label } from "@haloform/ui/label";
import { Textarea } from "@haloform/ui/textarea";
import { Checkbox } from "@haloform/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@haloform/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@haloform/ui/select";
import { Button } from "@haloform/ui/button";
import { Calendar } from "@haloform/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@haloform/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
import { cn } from "@haloform/lib/utils";
import { Switch } from "@haloform/ui/switch";
import { Slider } from "@haloform/ui/slider";
import { toast } from "sonner";
import { Rating } from "@haloform/ui/rating";

// Enhanced number field utilities
const formatCurrency = (
  value: number,
  currency: string,
  decimalPlaces: number = 2,
  showThousands: boolean = true,
  position: string = "before",
) => {
  const currencySymbols: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
    AUD: "A$",
    JPY: "¥",
    INR: "₹",
  };

  const symbol = currencySymbols[currency] || currency;
  const formatted = showThousands
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      })
    : value.toFixed(decimalPlaces);

  return position === "before"
    ? `${symbol}${formatted}`
    : `${formatted}${symbol}`;
};

const formatPercentage = (value: number, decimalPlaces: number = 0) => {
  return `${value.toFixed(decimalPlaces)}%`;
};

const formatPhoneNumber = (
  value: string,
  countryCode: string,
  international: boolean = true,
) => {
  // Basic phone number formatting - in production, use libphonenumber-js
  const countryCodes: Record<string, string> = {
    NG: "+234",
    US: "+1",
    GB: "+44",
    CA: "+1",
    AU: "+61",
    DE: "+49",
    FR: "+33",
    IN: "+91",
  };

  const code = countryCodes[countryCode] || "+234";
  const cleanValue = value.replace(/\D/g, "");

  if (international && cleanValue.length > 0) {
    return `${code} ${cleanValue}`;
  }
  return cleanValue;
};

const evaluateFormula = (
  formula: string,
  formData: FormData,
  elements: FormElementType[],
): number => {
  try {
    // Replace field IDs with their values
    let expression = formula.trim();

    // Sort elements by ID length (longest first) to avoid partial replacements
    const sortedElements = [...elements].sort(
      (a, b) => b.id.length - a.id.length,
    );

    sortedElements.forEach((element) => {
      const value = formData[element.id];
      const numValue =
        typeof value === "number" ? value : parseFloat(value as string) || 0;

      // Use word boundaries to ensure we only replace complete field IDs
      // Also handle field IDs that contain hyphens and numbers
      const escapedId = element.id.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedId}\\b`, "g");
      expression = expression.replace(regex, numValue.toString());
    });

    // Enhanced math evaluation with support for constants, field combinations, and logical operators
    // Support: +, -, *, /, %, ^, sqrt, abs, logical operators, and ternary conditionals
    expression = expression.replace(/sqrt\(([^)]+)\)/g, "Math.sqrt($1)");
    expression = expression.replace(/abs\(([^)]+)\)/g, "Math.abs($1)");
    expression = expression.replace(/\^/g, "**");

    // Add support for common mathematical constants
    expression = expression.replace(/\bpi\b/g, "Math.PI");
    expression = expression.replace(/\be\b/g, "Math.E");

    // Validate that the expression contains safe characters including logical operators
    const safePattern = /^[\d\s+\-*/.()%\^,><=!&|?:]+$/;
    if (!safePattern.test(expression.replace(/Math\.(sqrt|abs|PI|E)/g, ""))) {
      console.warn("Formula contains unsafe characters:", expression);
      return 0;
    }

    // Evaluate safely - supports logical operators and ternary conditionals
    // Examples: (x > 100) ? x * 0.9 : x
    const result = Function(`"use strict"; return (${expression})`)();
    return isNaN(result) || !isFinite(result) ? 0 : Number(result);
  } catch (error) {
    console.warn("Formula evaluation error:", error, "Formula:", formula);
    return 0;
  }
};

// Define types for form data
type FormData = Record<
  string,
  string | number | boolean | Date | File | string[]
>;

// Add type guards
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const isArray = (value: unknown): value is string[] => Array.isArray(value);
const isDate = (value: unknown): value is Date => value instanceof Date;
const isFile = (value: unknown): value is File => value instanceof File;

// Helper functions for safe type conversion
const getStringValue = (id: string, formData: FormData): string => {
  const value = formData[id];
  if (isString(value)) return value;
  if (isNumber(value)) return value.toString();
  if (isDate(value)) return value.toISOString();
  if (isArray(value)) return value.join(", ");
  return "";
};

const getNumberValue = (id: string, formData: FormData): number => {
  const value = formData[id];
  if (isNumber(value)) return value;
  if (isString(value)) return parseFloat(value) || 0;
  return 0;
};

const getArrayValue = (id: string, formData: FormData): string[] => {
  const value = formData[id];
  if (isArray(value)) return value;
  if (isString(value)) return [value];
  return [];
};

const getElementDisplayLabel = (element?: Partial<FormElementType> | null) => {
  if (!element) return "";

  const rootLabel =
    typeof element.label === "string" ? element.label.trim() : "";
  const propertyLabel =
    typeof element.properties?.label === "string"
      ? element.properties.label.trim()
      : "";

  return rootLabel || propertyLabel || "";
};

interface FormPreviewProps {
  elements: FormElementType[];
  onSave?: () => void;
  columnSpans?: Record<string, 1 | 2 | 3 | 4>;
  formStyle?: {
    background?: string;
    inputBackground?: string;
    inputBorder?: string;
    inputFocus?: string;
    borderRadius?: string;
    padding?: string;
    inputText?: string;
    labelText?: string;
  };
  wizardMode?: boolean;
  // External state management props
  formData?: FormData;
  onInputChange?: (
    id: string,
    value: string | number | boolean | Date | File | string[],
  ) => void;
  colSpan?: number;
}

const FormPreview = ({
  elements,
  onSave,
  columnSpans = {},
  formStyle = {
    background: "bg-white dark:bg-black",
    inputBackground: "bg-white dark:bg-black",
    inputBorder: "border-black dark:border-white",
    inputFocus: "ring-black dark:ring-white",
    borderRadius: "rounded-lg",
    padding: "p-6",
    inputText: "text-black dark:text-white",
    labelText: "text-black dark:text-white",
  },
  wizardMode = false,
  formData: externalFormData,
  onInputChange: externalOnInputChange,
  colSpan = 1,
}: FormPreviewProps) => {
  const [internalFormData, setInternalFormData] = useState<FormData>({});

  // Use external formData if provided, otherwise use internal state
  const formData = externalFormData || internalFormData;
  const [date, setDate] = useState<Record<string, Date | undefined>>({});
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Track dependent dropdowns' options
  const [dependentOptions, setDependentOptions] = useState<
    Record<string, string[]>
  >({});

  // Debug log the props received by FormPreview
  useEffect(() => {
    console.log("🎯 [FORM PREVIEW] Props received:");
    console.log("Elements count:", elements?.length || 0);
    console.log("Elements:", elements);
    console.log("Column spans:", columnSpans);
    console.log("Form style:", formStyle);
    console.log("Wizard mode:", wizardMode);

    if (elements && elements.length > 0) {
      console.log("🎯 [FORM PREVIEW] Element details:");
      elements.forEach((element, index) => {
        console.log(`  Element ${index + 1}:`, {
          id: element.id,
          type: element.type,
          label: element.label,
          hasLabel: !!element.label,
          labelValue: element.label || "MISSING LABEL",
          properties: element.properties
            ? Object.keys(element.properties)
            : "NO PROPERTIES",
        });
      });
    }
  }, [elements, columnSpans, formStyle, wizardMode]);

  // Helper function to update form data (internal or external)
  const updateFormData = (
    updates: Record<string, string | number | boolean | Date | File | string[]>,
  ) => {
    if (externalOnInputChange) {
      // If using external state, call the handler for each update
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          externalOnInputChange(key, value);
        }
      });
    } else {
      // Use internal state
      setInternalFormData((prev) => ({
        ...prev,
        ...updates,
      }));
    }
  };

  // Update dependent dropdown options when parent values change
  useEffect(() => {
    // Find all dependent dropdowns
    const dependentDropdowns = elements.filter(
      (elem) => elem.type === "dependentDropdown",
    );

    // For each dependent dropdown, update its options based on parent value
    dependentDropdowns.forEach((dropdown) => {
      const parentId = dropdown.properties.parentDropdown;
      if (!parentId) return;

      const parentValue = formData[parentId];
      if (!parentValue) return;

      // Get options for this parent value
      const options =
        dropdown.properties.optionsMap?.[parentValue as string] || [];
      setDependentOptions((prev) => ({
        ...prev,
        [dropdown.id]: options,
      }));

      // Reset the dependent dropdown value if the selected value isn't in the new options
      if (
        formData[dropdown.id] &&
        !options.includes(formData[dropdown.id] as string)
      ) {
        updateFormData({
          [dropdown.id]: options.length > 0 ? options[0] : "",
        });
      }
    });
  }, [formData, elements]);

  // Update calculated fields when form data changes
  useEffect(() => {
    const calculatedFields = elements.filter(
      (elem) =>
        elem.type === "number" &&
        elem.properties.numberType === "calculated" &&
        elem.properties.formula &&
        elem.properties.formula.trim() !== "",
    );

    let hasChanges = false;
    const updates: Record<string, number> = {};

    calculatedFields.forEach((field) => {
      if (field.properties.formula) {
        const calculatedValue = evaluateFormula(
          field.properties.formula,
          formData,
          elements,
        );

        // Only update if the value has changed to prevent infinite loops
        if (formData[field.id] !== calculatedValue) {
          updates[field.id] = calculatedValue;
          hasChanges = true;
        }
      }
    });

    // Batch all updates together to prevent multiple re-renders
    if (hasChanges) {
      updateFormData(updates);
    }
  }, [
    formData, // Track all formData changes
    elements.length,
    // Only track formulas of calculated fields, not all elements
    elements
      .filter(
        (e) => e.type === "number" && e.properties?.numberType === "calculated",
      )
      .map((e) => `${e.id}:${e.properties?.formula || ""}`)
      .join("|"),
  ]);

  // Pre-fill session lookup fields when empty
  useEffect(() => {
    const updates: Record<string, string> = {};

    elements
      .filter((elem) => elem.type === "sessionLookup")
      .forEach((elem) => {
        const currentValue = formData[elem.id];
        const hasValue =
          currentValue !== undefined &&
          currentValue !== null &&
          currentValue !== "";
        if (hasValue) return;

        const fallbackValue =
          elem.properties.sessionFallbackValue || elem.properties.defaultValue;
        if (typeof fallbackValue === "string" && fallbackValue.trim()) {
          updates[elem.id] = fallbackValue;
        }
      });

    if (Object.keys(updates).length > 0) {
      updateFormData(updates);
    }
  }, [elements, formData]);

  // Group elements into steps (any element after a "next" button starts a new step)
  const steps = elements.reduce((acc: FormElementType[][], element, index) => {
    if (index === 0) {
      acc.push([element]);
    } else if (
      elements[index - 1].type === "button" &&
      elements[index - 1].properties.buttonType === "next"
    ) {
      acc.push([element]);
    } else {
      acc[acc.length - 1].push(element);
    }
    return acc;
  }, []);

  // If no steps were created (no next buttons), put all elements in one step
  const formSteps = steps.length > 0 ? steps : [elements];

  const handleInputChange = (
    id: string,
    value: string | number | boolean | Date | File | string[],
  ) => {
    if (externalOnInputChange) {
      // Use external handler if provided
      externalOnInputChange(id, value);
    } else {
      // Use internal state
      setInternalFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  const moveToNextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const moveToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Check if an element should be shown based on conditional logic
  const shouldShowElement = (element: FormElementType): boolean => {
    if (!element.properties.conditional) return true;

    const { conditionalLogic } = element.properties;
    if (!conditionalLogic?.dependsOn) return true;

    const dependsOnValue = formData[conditionalLogic.dependsOn];
    return dependsOnValue === conditionalLogic.showWhen;
  };

  const getColSpanClass = (id: string) => {
    // First check the columnSpans prop, then fallback to element properties
    const span =
      columnSpans[id] ||
      (elements.find((e) => e.id === id)?.properties?.colSpan as
        | 1
        | 2
        | 3
        | 4) ||
      1;

    // Debug logging for column spans
    console.log(`📐 [COL SPAN] Element ${id}:`, {
      fromColumnSpans: columnSpans[id],
      fromElementProperties: elements.find((e) => e.id === id)?.properties
        ?.colSpan,
      finalSpan: span,
      cssClass: `col-span-${span}`,
    });

    switch (span) {
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

  const getInputClasses = () => {
    return `w-full ${formStyle.inputBackground} ${formStyle.inputBorder} focus:${formStyle.inputFocus} ${formStyle.inputText} ${formStyle.borderRadius}`;
  };

  const getLabelClasses = () => {
    return formStyle.labelText;
  };

  const renderField = (element: FormElementType) => {
    const { id, type, properties } = element;
    const effectiveLabel = getElementDisplayLabel(element);

    // Debug each element during rendering
    console.log(`🔨 [RENDER FIELD] Rendering element:`, {
      id,
      type,
      label: effectiveLabel,
      hasLabel: !!effectiveLabel,
      labelText: effectiveLabel || "NO LABEL PROVIDED",
      properties: properties ? Object.keys(properties) : "NO PROPERTIES",
    });

    // Don't render if this element should be hidden based on conditional logic
    if (!shouldShowElement(element)) {
      console.log(
        `🚫 [RENDER FIELD] Element ${id} hidden by conditional logic`,
      );
      return null;
    }

    // Extract properties early to avoid declaration issues
    const {
      required,
      helpText,
      placeholder,
      defaultValue,
      options,
      buttonText,
      buttonType,
      min,
      max,
      step,
      ratingType,
      maxRating,
      parentDropdown,
      headerSize,
      paragraphText,
      textAlign,
    } = properties;

    // Don't render next/back buttons here - they'll be rendered at the bottom
    if (type === "button" && (buttonType === "next" || buttonType === "back")) {
      return null;
    }

    const colSpanClass = getColSpanClass(id);
    const inputClasses = getInputClasses();
    const labelClasses = getLabelClasses();

    switch (type) {
      case "text":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id={id}
              placeholder={placeholder}
              defaultValue={defaultValue}
              required={properties.validation?.required}
              minLength={properties.validation?.minLength}
              maxLength={properties.validation?.maxLength}
              pattern={properties.validation?.pattern}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className={inputClasses}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Textarea
              id={id}
              placeholder={placeholder}
              defaultValue={defaultValue}
              required={properties.validation?.required}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className={inputClasses}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "number":
        const numberType = properties.numberType || "basic";
        const formula = properties.formula;
        const readOnlyCalculated = properties.readOnlyCalculated;
        const defaultCountry = properties.defaultCountry || "NG";
        const showCountrySelector = properties.showCountrySelector;
        const internationalFormat = properties.internationalFormat !== false;
        const decimalPlaces = properties.decimalPlaces || 0;
        const showPercentSymbol = properties.showPercentSymbol !== false;
        const currency = properties.currency || "NGN";
        const currencyDecimalPlaces = properties.currencyDecimalPlaces || 2;
        const showThousandsSeparator =
          properties.showThousandsSeparator !== false;
        const currencyPosition = properties.currencyPosition || "before";

        // Note: Calculated field updates are now handled in useEffect to prevent infinite loops

        // Only get current value for calculated fields - other fields should use user input
        const currentValue =
          numberType === "calculated" ? getNumberValue(id, formData) : 0;

        let displayValue = "";
        let inputType = "number";

        // Format display value ONLY for calculated fields
        switch (numberType) {
          case "calculated":
            // For calculated fields, always show the calculated value
            displayValue = currentValue.toString();
            break;
          case "phone":
            inputType = "tel";
            // For phone fields, don't pre-format - let user input naturally
            displayValue = "";
            break;
          default:
            // For all other number fields (basic, currency, percentage), don't override display value
            displayValue = "";
            break;
        }

        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>

            {/* Phone Number with Country Selector */}
            {numberType === "phone" && showCountrySelector ? (
              <div className="flex gap-2">
                <Select
                  value={defaultCountry}
                  onValueChange={(value) => {
                    // Update country and reformat number
                    const newValue = formatPhoneNumber(
                      getStringValue(id, formData),
                      value,
                      internationalFormat,
                    );
                    handleInputChange(id, newValue);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <SelectItem value="NG">🇳🇬 +234</SelectItem>
                    <SelectItem value="US">🇺🇸 +1</SelectItem>
                    <SelectItem value="GB">🇬🇧 +44</SelectItem>
                    <SelectItem value="CA">🇨🇦 +1</SelectItem>
                    <SelectItem value="AU">🇦🇺 +61</SelectItem>
                    <SelectItem value="DE">🇩🇪 +49</SelectItem>
                    <SelectItem value="FR">🇫🇷 +33</SelectItem>
                    <SelectItem value="IN">🇮🇳 +91</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id={id}
                  type={inputType}
                  placeholder={
                    numberType === "calculated" && formula
                      ? "Auto-calculated"
                      : placeholder || "Enter phone number"
                  }
                  defaultValue={defaultValue}
                  min={numberType === "percentage" ? 0 : properties.min}
                  max={numberType === "percentage" ? 100 : properties.max}
                  step={properties.step}
                  required={properties.validation?.required}
                  readOnly={
                    numberType === "calculated" && formula && readOnlyCalculated
                  }
                  onChange={(e) => {
                    let value = e.target.value;

                    // Handle different number types
                    switch (numberType) {
                      case "phone":
                        value = formatPhoneNumber(
                          value,
                          defaultCountry,
                          internationalFormat,
                        );
                        break;
                      case "percentage":
                        const numValue = parseFloat(value) || 0;
                        if (numValue >= 0 && numValue <= 100) {
                          handleInputChange(id, numValue);
                        }
                        return;
                      case "currency":
                        // Store raw number, format for display
                        const rawValue =
                          parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
                        handleInputChange(id, rawValue);
                        return;
                      default:
                        handleInputChange(id, parseFloat(value) || 0);
                        return;
                    }

                    handleInputChange(id, value);
                  }}
                  className={`${inputClasses} flex-1 ${
                    numberType === "calculated" && formula
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      : ""
                  }`}
                />
              </div>
            ) : (
              /* Regular Number Input */
              <div className="relative">
                <Input
                  id={id}
                  type={inputType}
                  placeholder={
                    numberType === "calculated" && formula
                      ? "Auto-calculated"
                      : numberType === "percentage"
                        ? "Enter percentage (0-100)"
                        : numberType === "currency"
                          ? `Enter amount in ${currency}`
                          : placeholder
                  }
                  value={
                    numberType === "calculated" && formula
                      ? displayValue
                      : undefined
                  }
                  defaultValue={
                    numberType !== "calculated" || !formula
                      ? defaultValue
                      : undefined
                  }
                  min={numberType === "percentage" ? 0 : properties.min}
                  max={numberType === "percentage" ? 100 : properties.max}
                  step={properties.step}
                  required={properties.validation?.required}
                  readOnly={
                    numberType === "calculated" && formula && readOnlyCalculated
                  }
                  onChange={(e) => {
                    // Skip onChange handling for calculated fields when they're readonly
                    if (
                      numberType === "calculated" &&
                      formula &&
                      readOnlyCalculated
                    ) {
                      return;
                    }

                    let value = e.target.value;

                    // Handle different number types
                    switch (numberType) {
                      case "phone":
                        value = formatPhoneNumber(
                          value,
                          defaultCountry,
                          internationalFormat,
                        );
                        handleInputChange(id, value);
                        break;
                      case "percentage":
                        const numValue = parseFloat(value) || 0;
                        if (numValue >= 0 && numValue <= 100) {
                          handleInputChange(id, numValue);
                        }
                        break;
                      case "currency":
                        // Store raw number, format for display
                        const rawValue =
                          parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
                        handleInputChange(id, rawValue);
                        break;
                      case "calculated":
                        // Don't handle manual input for calculated fields
                        // The useEffect will handle the calculation
                        break;
                      default:
                        handleInputChange(id, parseFloat(value) || 0);
                        break;
                    }
                  }}
                  className={`${inputClasses} ${
                    numberType === "calculated" && formula
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      : ""
                  }`}
                />

                {/* Display formatted value only for calculated fields */}
                {numberType === "calculated" && formula && currentValue > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Calculated: {displayValue}
                  </div>
                )}
              </div>
            )}

            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "email":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id={id}
              type="email"
              placeholder={placeholder}
              defaultValue={defaultValue}
              required={properties.validation?.required}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className={inputClasses}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "password":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id={id}
              type="password"
              placeholder={placeholder}
              defaultValue={defaultValue}
              required={properties.validation?.required}
              onChange={(e) => handleInputChange(id, e.target.value)}
              className={inputClasses}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <div className="space-y-2">
              {(options && options.length > 0
                ? options
                : [effectiveLabel || "Option"]
              ).map((option, i) => (
                <div
                  key={`${id}-option-${i}`}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${id}-option-${i}`}
                    onCheckedChange={(checked) => {
                      const currentSelections =
                        (formData[id] as string[]) || [];
                      const newSelections = checked
                        ? [...currentSelections, option]
                        : currentSelections.filter(
                            (item: string) => item !== option,
                          );
                      handleInputChange(id, newSelections);
                    }}
                  />
                  <Label htmlFor={`${id}-option-${i}`} className={labelClasses}>
                    {option}
                  </Label>
                </div>
              ))}
            </div>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "radio":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <RadioGroup
              defaultValue={defaultValue}
              onValueChange={(value) => handleInputChange(id, value)}
            >
              {options &&
                options.map((option, i) => (
                  <div
                    key={`${id}-option-${i}`}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option} id={`${id}-option-${i}`} />
                    <Label
                      htmlFor={`${id}-option-${i}`}
                      className={labelClasses}
                    >
                      {option}
                    </Label>
                  </div>
                ))}
            </RadioGroup>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "dropdown":
      case "apidropdown":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <select
              id={id}
              className={`${inputClasses} h-10 px-3 py-2 rounded-md`}
              defaultValue={defaultValue}
              onChange={(e) => handleInputChange(id, e.target.value)}
            >
              <option value="" disabled>
                {placeholder || "Select option"}
              </option>
              {(options as string[]) && (options as string[]).length > 0 ? (
                (options as string[]).map((option, i) => (
                  <option key={`${id}-option-${i}`} value={option}>
                    {option}
                  </option>
                ))
              ) : (
                <option value="none" disabled>
                  No options available
                </option>
              )}
            </select>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      // Add the case for dependent dropdown
      case "dependentDropdown":
        const parentDropdown = properties.parentDropdown;
        const parentElement = elements.find((e) => e.id === parentDropdown);
        const parentValue = parentDropdown
          ? getStringValue(parentDropdown, formData)
          : "";
        const currentOptions = parentValue
          ? properties.optionsMap?.[parentValue] || []
          : [];

        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Select
              value={getStringValue(id, formData)}
              onValueChange={(value) => handleInputChange(id, value)}
              disabled={!parentValue || currentOptions.length === 0}
            >
              <SelectTrigger id={id} className={inputClasses}>
                <SelectValue
                  placeholder={
                    !parentValue
                      ? `Select ${getElementDisplayLabel(parentElement) || "parent"} first`
                      : properties.placeholder || "Select option"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {currentOptions.length > 0 ? (
                  currentOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {parentValue
                      ? "No options available for this selection"
                      : `Select ${getElementDisplayLabel(parentElement) || "parent"} first`}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {parentValue && (
              <p className="text-xs text-gray-500">
                Based on {getElementDisplayLabel(parentElement)}: {parentValue}
              </p>
            )}
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "datepicker":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <input
              id={id}
              type="date"
              className={`${inputClasses} h-10 px-3 py-2 rounded-md`}
              defaultValue={isString(defaultValue) ? defaultValue : ""}
              placeholder={placeholder}
              min={properties.minDate}
              max={properties.maxDate}
              required={properties.validation?.required}
              onChange={(e) => {
                const dateValue = e.target.value
                  ? new Date(e.target.value)
                  : new Date();
                handleInputChange(id, dateValue);
              }}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "timepicker":
        const defaultTimeValue = isString(defaultValue) ? defaultValue : "";
        const [defaultHour, defaultMinute] = defaultTimeValue.includes(":")
          ? defaultTimeValue.split(":")
          : ["", ""];
        const minTime = isString(properties.minTime) ? properties.minTime : "";
        const maxTime = isString(properties.maxTime) ? properties.maxTime : "";
        const [minHour, minMinute] = minTime.includes(":")
          ? minTime.split(":")
          : ["0", "0"];
        const [maxHour, maxMinute] = maxTime.includes(":")
          ? maxTime.split(":")
          : ["23", "59"];

        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <div className="flex space-x-2">
              <Input
                id={`${id}-hour`}
                type="number"
                placeholder="HH"
                min={Number(minHour) || 0}
                max={Number(maxHour) || 23}
                className="w-20"
                defaultValue={defaultHour}
                onChange={(e) => {
                  const hour = e.target.value;
                  const minute = formData[`${id}-minute`] || "00";
                  handleInputChange(id, `${hour}:${minute}`);
                  handleInputChange(`${id}-hour`, hour);
                }}
              />
              <span className="text-xl self-center">:</span>
              <Input
                id={`${id}-minute`}
                type="number"
                placeholder="MM"
                min={Number(minMinute) || 0}
                max={Number(maxMinute) || 59}
                className="w-20"
                defaultValue={defaultMinute}
                onChange={(e) => {
                  const minute = e.target.value;
                  const hour = formData[`${id}-hour`] || "00";
                  handleInputChange(id, `${hour}:${minute}`);
                  handleInputChange(`${id}-minute`, minute);
                }}
              />
            </div>
            {(minTime || maxTime) && (
              <p className={`text-xs ${labelClasses}`}>
                Allowed range: {minTime || "00:00"} - {maxTime || "23:59"}
              </p>
            )}
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "fileupload":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id={id}
              type="file"
              className="cursor-pointer"
              accept={properties.acceptedTypes}
              multiple={Boolean(properties.allowMultipleUploads)}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const maxFileSizeMb = Number(properties.maxFileSizeMb || 0);
                  if (maxFileSizeMb > 0) {
                    const maxBytes = maxFileSizeMb * 1024 * 1024;
                    if (file.size > maxBytes) {
                      console.warn(
                        `File exceeds configured max size (${maxFileSizeMb}MB)`,
                      );
                      return;
                    }
                  }
                  handleInputChange(id, file);
                }
              }}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "toggle":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <div className="flex items-center space-x-2">
              <Switch
                id={id}
                onCheckedChange={(checked) => handleInputChange(id, checked)}
              />
              <Label htmlFor={id} className={labelClasses}>
                {effectiveLabel}{" "}
                {properties.validation?.required && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
            </div>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "slider":
        const {
          min: sliderMin = 0,
          max: sliderMax = 100,
          step: sliderStep = 1,
        } = properties;
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <div className="flex items-center justify-between">
              <Label htmlFor={id} className={labelClasses}>
                {effectiveLabel}{" "}
                {properties.validation?.required && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <span>
                {getNumberValue(id, formData) || defaultValue || sliderMin}
              </span>
            </div>
            <Slider
              id={id}
              defaultValue={[
                parseInt(defaultValue?.toString() || "0") || sliderMin || 0,
              ]}
              min={sliderMin || 0}
              max={sliderMax || 100}
              step={sliderStep || 1}
              value={[getNumberValue(id, formData)]}
              onValueChange={(value) => handleInputChange(id, value[0])}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "hidden":
        return (
          <Input key={id} id={id} type="hidden" value={defaultValue || ""} />
        );

      case "sessionLookup":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id={id}
              value={
                getStringValue(id, formData) ||
                properties.sessionFallbackValue ||
                defaultValue ||
                ""
              }
              readOnly
              placeholder={placeholder || "Session-derived value"}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "button":
        if (buttonType === "submit") {
          return (
            <div key={id} className={`space-y-2 ${colSpanClass}`}>
              <Button type="submit">{buttonText || "Submit"}</Button>
            </div>
          );
        } else if (buttonType === "reset") {
          return (
            <div key={id} className={`space-y-2 ${colSpanClass}`}>
              <Button
                type="reset"
                variant="outline"
                onClick={() => updateFormData({})}
              >
                {buttonText || "Reset"}
              </Button>
            </div>
          );
        } else {
          return (
            <div key={id} className={`space-y-2 ${colSpanClass}`}>
              <Button type="button">{buttonText || "Button"}</Button>
            </div>
          );
        }

      case "endpointSubmission":
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Button type="submit">{buttonText || "Submit to Endpoint"}</Button>
            {properties.apiEndpoint && (
              <p className={`text-xs ${labelClasses} truncate`}>
                Endpoint: {properties.apiEndpoint}
              </p>
            )}
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "rating":
        const { ratingType, maxRating } = properties;
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <Label htmlFor={id} className={labelClasses}>
              {effectiveLabel}{" "}
              {properties.validation?.required && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Rating
              type={ratingType || "star"}
              max={maxRating || 5}
              value={getNumberValue(id, formData)}
              onChange={(value) => handleInputChange(id, value)}
            />
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "header":
        const HeaderTag = (headerSize as keyof JSX.IntrinsicElements) || "h2";
        console.log(`📋 [HEADER RENDER] Rendering header:`, {
          id,
          label: effectiveLabel,
          headerSize,
          HeaderTag,
          textAlign,
          colSpanClass,
          labelClasses,
          helpText,
        });
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <HeaderTag
              className={cn(
                "font-bold",
                labelClasses,
                {
                  "text-3xl": HeaderTag === "h1",
                  "text-2xl": HeaderTag === "h2",
                  "text-xl": HeaderTag === "h3",
                  "text-lg": HeaderTag === "h4",
                  "text-base": HeaderTag === "h5",
                  "text-sm": HeaderTag === "h6",
                },
                {
                  "text-left": !textAlign || textAlign === "left",
                  "text-center": textAlign === "center",
                  "text-right": textAlign === "right",
                  "text-justify": textAlign === "justify",
                },
              )}
            >
              {effectiveLabel || "Form Header"}
            </HeaderTag>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      case "paragraph":
        console.log(`📄 [PARAGRAPH RENDER] Rendering paragraph:`, {
          id,
          label: effectiveLabel,
          paragraphText,
          textAlign,
          colSpanClass,
          labelClasses,
          helpText,
        });
        return (
          <div key={id} className={`space-y-2 ${colSpanClass}`}>
            <p
              className={cn("text-base leading-relaxed", labelClasses, {
                "text-left": !textAlign || textAlign === "left",
                "text-center": textAlign === "center",
                "text-right": textAlign === "right",
                "text-justify": textAlign === "justify",
              })}
            >
              {paragraphText || effectiveLabel || "Paragraph text goes here"}
            </p>
            {helpText && (
              <p className={`text-sm ${labelClasses}`}>{helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const currentElements = formSteps[currentStep] || [];
  const hasSubmitButton = currentElements.some(
    (e) => e.type === "button" && e.properties.buttonType === "submit",
  );
  const isLastStep = currentStep === formSteps.length - 1;

  // Find all next/back buttons in the current step (to prevent duplication)
  const nextButtonInStep = currentElements.find(
    (e) => e.type === "button" && e.properties.buttonType === "next",
  );
  const backButtonInStep = currentElements.find(
    (e) => e.type === "button" && e.properties.buttonType === "back",
  );

  return (
    <div
      className={`h-full overflow-y-auto border ${formStyle.borderRadius} ${formStyle.background} form-preview`}
    >
      {formSteps.length > 1 && (
        <div className="mb-4 flex justify-between items-center p-4 border-b">
          <div className={`text-sm ${formStyle.labelText}`}>
            Step {currentStep + 1} of {formSteps.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={moveToPreviousStep}
              disabled={currentStep === 0}
              className="text-sm"
            >
              Previous
            </Button>
            <Button
              onClick={moveToNextStep}
              disabled={currentStep === formSteps.length - 1}
              className="text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <div className={formStyle.padding}>
        <div className="grid grid-cols-4 gap-4 w-full">
          {currentElements.map(renderField)}

          {currentElements.length === 0 && (
            <div
              className={`text-center p-8 col-span-4 ${formStyle.labelText}`}
            >
              Your form preview will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
