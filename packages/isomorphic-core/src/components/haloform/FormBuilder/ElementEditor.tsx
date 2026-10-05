"use client";
import React, { useState, useEffect } from "react";
import { Input } from "@haloform/ui/input";
import { Label } from "@haloform/ui/label";
import { Textarea } from "@haloform/ui/textarea";
import { Checkbox } from "@haloform/ui/checkbox";
import { Separator } from "@haloform/ui/separator";
import { Switch } from "@haloform/ui/switch";
import { FormElementType } from "@haloform/types/form-builder";
import { ScrollArea } from "@haloform/ui/scroll-area";
import { Button } from "@haloform/ui/button";
import {
  PlusCircle,
  X,
  Database,
  List,
  Search,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import NumberFieldEditor from "./NumberFieldEditor";
import CalculatedFieldBuilder from "./CalculatedFieldBuilder";
import { RadioGroup, RadioGroupItem } from "@haloform/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@haloform/ui/select";
import ElementSettingsPanel from "./settings/ElementSettingsPanel";
import { SettingsTabKey } from "./settings/types";
import BasicSettingsSection from "./settings/sections/BasicSettingsSection";
import DataSettingsSection from "./settings/sections/DataSettingsSection";
import LogicSettingsSection from "./settings/sections/LogicSettingsSection";
import AutomationSettingsSection from "./settings/sections/AutomationSettingsSection";
import PermissionsSettingsSection from "./settings/sections/PermissionsSettingsSection";

interface ElementEditorProps {
  element: FormElementType | null;
  onElementUpdate: (element: FormElementType) => void;
  elements: FormElementType[]; // Added for conditional logic
  wizardMode?: boolean; // Add wizardMode as an optional prop
}

interface ValidationProperties {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

const ElementEditor = ({
  element,
  onElementUpdate,
  elements,
  wizardMode = false,
}: ElementEditorProps) => {
  const [apiUrl, setApiUrl] = useState<string>(
    element?.properties?.apiUrl || "",
  );
  const [apiValueField, setApiValueField] = useState<string>(
    element?.properties?.apiValueField || "value",
  );
  const [apiLabelField, setApiLabelField] = useState<string>(
    element?.properties?.apiLabelField || "label",
  );
  const [apiMethod, setApiMethod] = useState<string>(
    element?.properties?.apiMethod || "GET",
  );
  const [apiHeaders, setApiHeaders] = useState<string>(
    element?.properties?.apiHeadersRaw ||
      (typeof element?.properties?.apiHeaders === "string"
        ? element?.properties?.apiHeaders
        : ""),
  );
  const [apiParams, setApiParams] = useState<string>(
    element?.properties?.apiParamsRaw ||
      (typeof element?.properties?.apiParams === "string"
        ? element?.properties?.apiParams
        : ""),
  );
  const [apiResultsPath, setApiResultsPath] = useState<string>(
    element?.properties?.apiResultsPath || "results",
  );
  const [selectedParentOption, setSelectedParentOption] = useState<string>("");
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<SettingsTabKey>("basic");

  // Dropdown elements that could be parents (excluding the current element)
  const dropdownElements = elements.filter(
    (elem) => elem.type === "dropdown" && elem.id !== element?.id,
  );

  useEffect(() => {
    if (element?.properties?.parentDropdown) {
      const parent = elements.find(
        (elem) => elem.id === element.properties.parentDropdown,
      );
      if (parent?.properties?.options && parent.properties.options.length > 0) {
        setSelectedParentOption(parent.properties.options[0]);
      }
    }
  }, [element?.properties?.parentDropdown, elements]);

  useEffect(() => {
    setApiUrl(element?.properties?.apiUrl || "");
    setApiValueField(element?.properties?.apiValueField || "value");
    setApiLabelField(element?.properties?.apiLabelField || "label");
    setApiMethod(element?.properties?.apiMethod || "GET");
    setApiHeaders(
      element?.properties?.apiHeadersRaw ||
        (typeof element?.properties?.apiHeaders === "string"
          ? element?.properties?.apiHeaders
          : ""),
    );
    setApiParams(
      element?.properties?.apiParamsRaw ||
        (typeof element?.properties?.apiParams === "string"
          ? element?.properties?.apiParams
          : ""),
    );
    setApiResultsPath(element?.properties?.apiResultsPath || "results");
    setActiveSettingsTab("basic");
    setSelectedParentOption("");
  }, [element?.id]);

  if (!element) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select an element to edit its properties
      </div>
    );
  }

  const handlePropertyChange = (
    property: string,
    value: any,
    isNested: boolean = false,
  ) => {
    const updatedElement = { ...element };

    if (isNested) {
      const [parent, child] = property.split(".");
      updatedElement.properties[parent] = {
        ...updatedElement.properties[parent],
        [child]: value,
      };
    } else {
      updatedElement.properties[property] = value;
    }

    // Update the element immediately
    onElementUpdate(updatedElement);
  };

  const handleLabelChange = (value: string) => {
    const updatedElement = { ...element, label: value };
    onElementUpdate(updatedElement);
  };

  const handleRequiredChange = (checked: boolean) => {
    const updatedElement = {
      ...element,
      properties: {
        ...element.properties,
        validation: {
          ...element.properties.validation,
          required: checked,
        },
      },
    };
    onElementUpdate(updatedElement);
  };

  const handleTextAlignChange = (align: "left" | "center" | "right") => {
    const updatedElement = {
      ...element,
      properties: {
        ...element.properties,
        textAlign: align,
      },
    };
    onElementUpdate(updatedElement);
  };

  const handleHeaderSizeChange = (size: string) => {
    const updatedElement = {
      ...element,
      properties: {
        ...element.properties,
        headerSize: size,
      },
    };
    onElementUpdate(updatedElement);
  };

  const handleValidationChange = (
    key: keyof ValidationProperties,
    value: any,
  ) => {
    onElementUpdate({
      ...element,
      properties: {
        ...element.properties,
        validation: {
          ...element.properties.validation,
          [key]: value,
        },
      },
    });
  };

  const addOption = () => {
    const currentOptions = element.properties.options || [];
    handlePropertyChange("options", [
      ...currentOptions,
      `Option ${currentOptions.length + 1}`,
    ]);
  };

  const removeOption = (index: number) => {
    const currentOptions = [...(element.properties.options || [])];
    currentOptions.splice(index, 1);
    handlePropertyChange("options", currentOptions);
  };

  const updateOption = (index: number, value: string) => {
    const currentOptions = [...(element.properties.options || [])];
    currentOptions[index] = value;
    handlePropertyChange("options", currentOptions);
  };

  const handleApiIntegration = () => {
    const parseJsonLike = (rawValue: string) => {
      const trimmed = rawValue.trim();
      if (!trimmed) return {};
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        console.warn("Invalid API JSON config, storing raw value", error);
        return trimmed;
      }
    };

    // Save API settings to element properties
    onElementUpdate({
      ...element,
      properties: {
        ...element.properties,
        apiUrl,
        apiMethod,
        apiHeaders: parseJsonLike(apiHeaders),
        apiHeadersRaw: apiHeaders,
        apiParams: parseJsonLike(apiParams),
        apiParamsRaw: apiParams,
        apiResultsPath,
        apiValueField,
        apiLabelField,
        useApiData: true,
      },
    });
  };

  // Functions for handling dependent dropdown configuration
  const handleParentChange = (parentId: string) => {
    // Get the parent dropdown element
    const parent = elements.find((elem) => elem.id === parentId);

    // Initialize the options map with empty arrays for each parent option
    const optionsMap: Record<string, string[]> = {};
    if (parent?.properties?.options) {
      parent.properties.options.forEach((option) => {
        // Initialize with existing values or empty array
        optionsMap[option] = element.properties.optionsMap?.[option] || [];
      });
    }

    // Update the element with the new parent and options map
    onElementUpdate({
      ...element,
      properties: {
        ...element.properties,
        parentDropdown: parentId,
        optionsMap,
      },
    });

    // Select the first parent option
    if (parent?.properties?.options && parent.properties.options.length > 0) {
      setSelectedParentOption(parent.properties.options[0]);
    }
  };

  const addChildOption = (parentOption: string) => {
    const optionsMap = { ...(element.properties.optionsMap || {}) };
    const currentOptions = optionsMap[parentOption] || [];
    optionsMap[parentOption] = [
      ...currentOptions,
      `Child ${currentOptions.length + 1}`,
    ];

    handlePropertyChange("optionsMap", optionsMap);
  };

  const updateChildOption = (
    parentOption: string,
    index: number,
    value: string,
  ) => {
    const optionsMap = { ...(element.properties.optionsMap || {}) };
    const currentOptions = [...(optionsMap[parentOption] || [])];
    currentOptions[index] = value;
    optionsMap[parentOption] = currentOptions;

    handlePropertyChange("optionsMap", optionsMap);
  };

  const removeChildOption = (parentOption: string, index: number) => {
    const optionsMap = { ...(element.properties.optionsMap || {}) };
    const currentOptions = [...(optionsMap[parentOption] || [])];
    currentOptions.splice(index, 1);
    optionsMap[parentOption] = currentOptions;

    handlePropertyChange("optionsMap", optionsMap);
  };

  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const parseDomainList = (rawValue: string): string[] =>
    rawValue
      .split(",")
      .map((entry) => entry.trim().toLowerCase().replace(/^@/, ""))
      .filter(Boolean)
      .map(escapeRegExp);

  const buildEmailDomainPattern = (
    allowedRaw: string,
    blockedRaw: string,
  ): string => {
    const allowedDomains = parseDomainList(allowedRaw);
    const blockedDomains = parseDomainList(blockedRaw);

    if (allowedDomains.length === 0 && blockedDomains.length === 0) {
      return "";
    }

    const localPartPattern = "[^@\\s]+";
    const anyDomainPattern = "[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";
    const blockedGuard =
      blockedDomains.length > 0
        ? `(?!${localPartPattern}@(?:${blockedDomains.join("|")})$)`
        : "";
    const domainPart =
      allowedDomains.length > 0
        ? `(?:${allowedDomains.join("|")})`
        : anyDomainPattern;

    return `^${blockedGuard}${localPartPattern}@${domainPart}$`;
  };

  const buildPasswordStrengthPattern = (): string => {
    const minLength = Math.max(
      1,
      Number(element.properties.validation?.minLength || 8),
    );
    const maxLength = element.properties.validation?.maxLength;
    const lookaheads: string[] = [];

    if (element.properties.passwordRequireUppercase) {
      lookaheads.push("(?=.*[A-Z])");
    }
    if (element.properties.passwordRequireLowercase) {
      lookaheads.push("(?=.*[a-z])");
    }
    if (element.properties.passwordRequireNumber) {
      lookaheads.push("(?=.*\\d)");
    }
    if (element.properties.passwordRequireSpecial) {
      lookaheads.push("(?=.*[^A-Za-z0-9])");
    }

    const quantifier =
      typeof maxLength === "number" && maxLength >= minLength
        ? `{${minLength},${maxLength}}`
        : `{${minLength},}`;

    return `^${lookaheads.join("")}.${quantifier}$`;
  };

  const applyEmailDomainRules = () => {
    const pattern = buildEmailDomainPattern(
      element.properties.emailAllowedDomains || "",
      element.properties.emailBlockedDomains || "",
    );
    handleValidationChange("pattern", pattern || undefined);
  };

  const applyPasswordStrengthRules = () => {
    const pattern = buildPasswordStrengthPattern();
    handleValidationChange("pattern", pattern);
  };

  const emailPatternPreview = buildEmailDomainPattern(
    element.properties.emailAllowedDomains || "",
    element.properties.emailBlockedDomains || "",
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <ElementSettingsPanel
          elementType={element.type}
          activeTab={activeSettingsTab}
          onActiveTabChange={setActiveSettingsTab}
          basicContent={
            <BasicSettingsSection>
              <div>
                <Label>Label</Label>
                <Input
                  value={element.label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="Enter element label"
                />
              </div>

              {(element.type === "header" || element.type === "paragraph") && (
                <div className="space-y-2">
                  <Label>Text Alignment</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        element.properties.textAlign === "left"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleTextAlignChange("left")}
                      className="flex-1"
                    >
                      Left
                    </Button>
                    <Button
                      variant={
                        element.properties.textAlign === "center"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleTextAlignChange("center")}
                      className="flex-1"
                    >
                      Center
                    </Button>
                    <Button
                      variant={
                        element.properties.textAlign === "right"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleTextAlignChange("right")}
                      className="flex-1"
                    >
                      Right
                    </Button>
                  </div>
                </div>
              )}

              {element.type === "header" && (
                <div className="space-y-2">
                  <Label>Header Size</Label>
                  <Select
                    value={element.properties.headerSize || "h2"}
                    onValueChange={handleHeaderSizeChange}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select header size" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                      <SelectItem
                        value="h1"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H1
                      </SelectItem>
                      <SelectItem
                        value="h2"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H2
                      </SelectItem>
                      <SelectItem
                        value="h3"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H3
                      </SelectItem>
                      <SelectItem
                        value="h4"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H4
                      </SelectItem>
                      <SelectItem
                        value="h5"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H5
                      </SelectItem>
                      <SelectItem
                        value="h6"
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        H6
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Element Width</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePropertyChange(
                        "colSpan",
                        Math.max(1, (element.properties.colSpan || 1) - 1),
                      )
                    }
                    disabled={(element.properties.colSpan || 1) <= 1}
                    className="flex-1"
                  >
                    <ArrowLeft size={14} className="mr-1" />
                    Decrease
                  </Button>
                  <div className="px-2 text-sm font-medium">
                    {element.properties.colSpan || 1} column
                    {(element.properties.colSpan || 1) > 1 ? "s" : ""}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePropertyChange(
                        "colSpan",
                        Math.min(4, (element.properties.colSpan || 1) + 1),
                      )
                    }
                    disabled={(element.properties.colSpan || 1) >= 4}
                    className="flex-1"
                  >
                    Increase
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Control how many columns this element spans (1-4)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={element.properties.validation?.required || false}
                  onCheckedChange={(value) =>
                    handleRequiredChange(Boolean(value))
                  }
                />
                <Label htmlFor="required">Required Field</Label>
              </div>

              {(element.type === "text" ||
                element.type === "textarea" ||
                element.type === "number" ||
                element.type === "email" ||
                element.type === "password" ||
                element.type === "dropdown" ||
                element.type === "apidropdown" ||
                element.type === "datepicker" ||
                element.type === "timepicker" ||
                element.type === "fileupload" ||
                element.type === "dependentDropdown" ||
                element.type === "searchLookup" ||
                element.type === "sessionLookup" ||
                element.type === "hidden" ||
                element.type === "slider") && (
                <div className="grid grid-cols-2 gap-3">
                  {(element.type === "text" ||
                    element.type === "textarea" ||
                    element.type === "number" ||
                    element.type === "email" ||
                    element.type === "password" ||
                    element.type === "dropdown" ||
                    element.type === "apidropdown" ||
                    element.type === "datepicker" ||
                    element.type === "timepicker" ||
                    element.type === "fileupload" ||
                    element.type === "dependentDropdown" ||
                    element.type === "searchLookup" ||
                    element.type === "sessionLookup") && (
                    <div>
                      <Label htmlFor="placeholder">Placeholder</Label>
                      <Input
                        id="placeholder"
                        value={element.properties.placeholder || ""}
                        onChange={(e) =>
                          handlePropertyChange("placeholder", e.target.value)
                        }
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  {(element.type === "text" ||
                    element.type === "textarea" ||
                    element.type === "number" ||
                    element.type === "dropdown" ||
                    element.type === "apidropdown" ||
                    element.type === "hidden" ||
                    element.type === "slider" ||
                    element.type === "dependentDropdown") && (
                    <div>
                      <Label htmlFor="defaultValue">Default Value</Label>
                      <Input
                        id="defaultValue"
                        value={element.properties.defaultValue || ""}
                        onChange={(e) =>
                          handlePropertyChange("defaultValue", e.target.value)
                        }
                        placeholder="Enter default value"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="description">Help Text</Label>
                <Textarea
                  id="description"
                  value={element.properties.helpText || ""}
                  onChange={(e) =>
                    handlePropertyChange("helpText", e.target.value)
                  }
                  placeholder="Help text displayed below the field"
                  rows={2}
                />
              </div>
            </BasicSettingsSection>
          }
          dataContent={
            <DataSettingsSection>
              {element.type === "number" && (
                <NumberFieldEditor
                  element={element}
                  elements={elements}
                  onPropertyChange={handlePropertyChange}
                />
              )}

              {(element.type === "datepicker" ||
                element.type === "timepicker") && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  {element.type === "datepicker" ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="date-default">Default Date</Label>
                          <Input
                            id="date-default"
                            type="date"
                            value={element.properties.defaultValue || ""}
                            onChange={(e) =>
                              handlePropertyChange(
                                "defaultValue",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="date-format">Date Format</Label>
                          <Select
                            value={
                              element.properties.dateFormat || "YYYY-MM-DD"
                            }
                            onValueChange={(value) =>
                              handlePropertyChange("dateFormat", value)
                            }
                          >
                            <SelectTrigger id="date-format">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YYYY-MM-DD">
                                YYYY-MM-DD
                              </SelectItem>
                              <SelectItem value="DD/MM/YYYY">
                                DD/MM/YYYY
                              </SelectItem>
                              <SelectItem value="MM/DD/YYYY">
                                MM/DD/YYYY
                              </SelectItem>
                              <SelectItem value="MMMM D, YYYY">
                                MMMM D, YYYY
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="date-min">Min Date</Label>
                          <Input
                            id="date-min"
                            type="date"
                            value={element.properties.minDate || ""}
                            onChange={(e) =>
                              handlePropertyChange("minDate", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="date-max">Max Date</Label>
                          <Input
                            id="date-max"
                            type="date"
                            value={element.properties.maxDate || ""}
                            onChange={(e) =>
                              handlePropertyChange("maxDate", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="date-timezone">Timezone</Label>
                        <Select
                          value={element.properties.timezone || "local"}
                          onValueChange={(value) =>
                            handlePropertyChange("timezone", value)
                          }
                        >
                          <SelectTrigger id="date-timezone">
                            <SelectValue placeholder="Select timezone mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local Browser</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Africa/Lagos">
                              Africa/Lagos
                            </SelectItem>
                            <SelectItem value="America/New_York">
                              America/New_York
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Stored as metadata for downstream processing and
                          reporting.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="time-default">Default Time</Label>
                          <Input
                            id="time-default"
                            type="time"
                            value={element.properties.defaultValue || ""}
                            onChange={(e) =>
                              handlePropertyChange(
                                "defaultValue",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-step">Step (minutes)</Label>
                          <Select
                            value={String(element.properties.timeStep || 15)}
                            onValueChange={(value) =>
                              handlePropertyChange("timeStep", Number(value))
                            }
                          >
                            <SelectTrigger id="time-step">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                              <SelectItem value="60">60</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="time-min">Min Time</Label>
                          <Input
                            id="time-min"
                            type="time"
                            value={element.properties.minTime || ""}
                            onChange={(e) =>
                              handlePropertyChange("minTime", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="time-max">Max Time</Label>
                          <Input
                            id="time-max"
                            type="time"
                            value={element.properties.maxTime || ""}
                            onChange={(e) =>
                              handlePropertyChange("maxTime", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {element.type === "email" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="email-default">Default Value</Label>
                      <Input
                        id="email-default"
                        type="email"
                        value={element.properties.defaultValue || ""}
                        onChange={(e) =>
                          handlePropertyChange("defaultValue", e.target.value)
                        }
                        placeholder="name@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-autocomplete">Autocomplete</Label>
                      <Select
                        value={element.properties.autocomplete || "email"}
                        onValueChange={(value) =>
                          handlePropertyChange("autocomplete", value)
                        }
                      >
                        <SelectTrigger id="email-autocomplete">
                          <SelectValue placeholder="Select autocomplete hint" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="username">Username</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email-domain-hint">
                      Preferred Domain Hint
                    </Label>
                    <Input
                      id="email-domain-hint"
                      value={element.properties.emailDomainHint || ""}
                      onChange={(e) =>
                        handlePropertyChange("emailDomainHint", e.target.value)
                      }
                      placeholder="e.g. @sotsm.org"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Display hint only, no validation is applied here.
                    </p>
                  </div>
                </div>
              )}

              {element.type === "password" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Allow default password
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Keep off for production forms unless this is a seeded
                        setup flow.
                      </p>
                    </div>
                    <Switch
                      id="allowPasswordDefault"
                      checked={Boolean(element.properties.allowPasswordDefault)}
                      onCheckedChange={(value) => {
                        handlePropertyChange("allowPasswordDefault", value);
                        if (!value) {
                          handlePropertyChange("defaultValue", "");
                        }
                      }}
                    />
                  </div>

                  {element.properties.allowPasswordDefault && (
                    <div>
                      <Label htmlFor="password-default">Default Value</Label>
                      <Input
                        id="password-default"
                        type="password"
                        value={element.properties.defaultValue || ""}
                        onChange={(e) =>
                          handlePropertyChange("defaultValue", e.target.value)
                        }
                        placeholder="Set only for controlled test flows"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="mb-2 block text-sm">
                      Strength Requirements
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between rounded-md border border-border p-2">
                        <Label htmlFor="password-require-uppercase">
                          Uppercase
                        </Label>
                        <Switch
                          id="password-require-uppercase"
                          checked={Boolean(
                            element.properties.passwordRequireUppercase,
                          )}
                          onCheckedChange={(value) =>
                            handlePropertyChange(
                              "passwordRequireUppercase",
                              value,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border p-2">
                        <Label htmlFor="password-require-lowercase">
                          Lowercase
                        </Label>
                        <Switch
                          id="password-require-lowercase"
                          checked={Boolean(
                            element.properties.passwordRequireLowercase,
                          )}
                          onCheckedChange={(value) =>
                            handlePropertyChange(
                              "passwordRequireLowercase",
                              value,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border p-2">
                        <Label htmlFor="password-require-number">Number</Label>
                        <Switch
                          id="password-require-number"
                          checked={Boolean(
                            element.properties.passwordRequireNumber,
                          )}
                          onCheckedChange={(value) =>
                            handlePropertyChange("passwordRequireNumber", value)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border p-2">
                        <Label htmlFor="password-require-special">
                          Special char
                        </Label>
                        <Switch
                          id="password-require-special"
                          checked={Boolean(
                            element.properties.passwordRequireSpecial,
                          )}
                          onCheckedChange={(value) =>
                            handlePropertyChange(
                              "passwordRequireSpecial",
                              value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="password-min-length">Min Length</Label>
                      <Input
                        id="password-min-length"
                        type="number"
                        value={element.properties.validation?.minLength || 8}
                        onChange={(e) =>
                          handleValidationChange(
                            "minLength",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="password-max-length">Max Length</Label>
                      <Input
                        id="password-max-length"
                        type="number"
                        value={element.properties.validation?.maxLength || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          handleValidationChange("maxLength", value);
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyPasswordStrengthRules}
                  >
                    Apply Strength Rules To Pattern
                  </Button>
                </div>
              )}

              {element.type === "rating" && (
                <>
                  <div>
                    <Label htmlFor="rating-type">Rating Type</Label>
                    <RadioGroup
                      defaultValue={element.properties.ratingType || "star"}
                      onValueChange={(value) =>
                        handlePropertyChange("ratingType", value)
                      }
                      className="mt-2 flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="star" id="rating-star" />
                        <Label htmlFor="rating-star">Stars</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="emoji" id="rating-emoji" />
                        <Label htmlFor="rating-emoji">Emojis</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="max-rating">Maximum Rating</Label>
                    <Input
                      id="max-rating"
                      type="number"
                      min={1}
                      max={10}
                      value={element.properties.maxRating || 5}
                      onChange={(e) =>
                        handlePropertyChange(
                          "maxRating",
                          Number(e.target.value),
                        )
                      }
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Maximum number of stars or emojis (1-10)
                    </p>
                  </div>
                </>
              )}

              {(element.type === "dropdown" ||
                element.type === "apidropdown" ||
                element.type === "checkbox" ||
                element.type === "radio") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="flex items-center gap-1"
                    >
                      <PlusCircle size={14} />
                      Add Option
                    </Button>
                  </div>

                  <div className="max-h-[200px] space-y-2 overflow-y-auto">
                    {(element.properties.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="h-8 w-8"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                    {(element.properties.options || []).length === 0 && (
                      <div className="py-2 text-center text-sm text-muted-foreground">
                        No options added yet. Click &quot;Add Option&quot; to
                        create options.
                      </div>
                    )}
                  </div>

                  {(element.type === "dropdown" ||
                    element.type === "apidropdown") && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Database size={16} />
                          <h4 className="font-medium">API Data Integration</h4>
                        </div>

                        <div>
                          <Label htmlFor="apiUrl">API URL</Label>
                          <Input
                            id="apiUrl"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://api.example.com/data"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            URL to fetch dropdown options
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="apiMethod">Method</Label>
                            <Select
                              value={apiMethod}
                              onValueChange={(value) => setApiMethod(value)}
                            >
                              <SelectTrigger id="apiMethod">
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="apiResultsPath">Results Path</Label>
                            <Input
                              id="apiResultsPath"
                              value={apiResultsPath}
                              onChange={(e) =>
                                setApiResultsPath(e.target.value)
                              }
                              placeholder="results or data.items"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="apiHeaders">Headers (JSON)</Label>
                            <Textarea
                              id="apiHeaders"
                              rows={3}
                              value={apiHeaders}
                              onChange={(e) => setApiHeaders(e.target.value)}
                              placeholder='{"Authorization":"Bearer token"}'
                            />
                          </div>
                          <div>
                            <Label htmlFor="apiParams">Params (JSON)</Label>
                            <Textarea
                              id="apiParams"
                              rows={3}
                              value={apiParams}
                              onChange={(e) => setApiParams(e.target.value)}
                              placeholder='{"status":"active"}'
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="valueField">Value Field</Label>
                            <Input
                              id="valueField"
                              value={apiValueField}
                              onChange={(e) => setApiValueField(e.target.value)}
                              placeholder="id"
                            />
                          </div>
                          <div>
                            <Label htmlFor="labelField">Label Field</Label>
                            <Input
                              id="labelField"
                              value={apiLabelField}
                              onChange={(e) => setApiLabelField(e.target.value)}
                              placeholder="name"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleApiIntegration}
                          className="w-full"
                        >
                          Sync API Mapping
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {element.type === "dependentDropdown" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="flex items-center gap-2">
                    <List size={16} />
                    <h4 className="font-medium">
                      Dependent Dropdown Configuration
                    </h4>
                  </div>

                  <div>
                    <Label htmlFor="parent-dropdown">Parent Dropdown</Label>
                    <Select
                      value={element.properties.parentDropdown || ""}
                      onValueChange={handleParentChange}
                    >
                      <SelectTrigger
                        id="parent-dropdown"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      >
                        <SelectValue placeholder="Select parent dropdown" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                        {dropdownElements.length === 0 ? (
                          <SelectItem
                            value="none"
                            disabled
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            No dropdown fields available
                          </SelectItem>
                        ) : (
                          dropdownElements.map((dropdown) => (
                            <SelectItem
                              key={dropdown.id}
                              value={dropdown.id}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {dropdown.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select which dropdown&apos;s value will determine this
                      dropdown&apos;s options
                    </p>
                  </div>

                  {element.properties.parentDropdown && (
                    <div className="space-y-2">
                      <Label>Configure Child Options</Label>

                      <div className="rounded-md border border-border p-2">
                        <Label className="mb-2 block text-sm font-medium">
                          For each parent option, define the child options:
                        </Label>

                        <Select
                          value={selectedParentOption}
                          onValueChange={setSelectedParentOption}
                          disabled={!element.properties.parentDropdown}
                        >
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectValue placeholder="Select parent option" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                            {(
                              elements.find(
                                (elem) =>
                                  elem.id === element.properties.parentDropdown,
                              )?.properties?.options || []
                            ).map((option) => (
                              <SelectItem
                                key={option}
                                value={option}
                                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedParentOption && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">
                                Child options for &quot;{selectedParentOption}
                                &quot;
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  addChildOption(selectedParentOption)
                                }
                                className="flex items-center gap-1"
                              >
                                <PlusCircle size={14} />
                                Add Option
                              </Button>
                            </div>

                            <div className="max-h-[200px] space-y-2 overflow-y-auto">
                              {(
                                (element.properties.optionsMap || {})[
                                  selectedParentOption
                                ] || []
                              ).map((option, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    value={option}
                                    onChange={(e) =>
                                      updateChildOption(
                                        selectedParentOption,
                                        index,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={`Child option ${index + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeChildOption(
                                        selectedParentOption,
                                        index,
                                      )
                                    }
                                    className="h-8 w-8"
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ))}

                              {!(element.properties.optionsMap || {})[
                                selectedParentOption
                              ]?.length && (
                                <div className="py-2 text-center text-sm text-muted-foreground">
                                  No child options added yet. Click &quot;Add
                                  Option&quot; to create options.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {element.type === "sessionLookup" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="session-source">Session Source</Label>
                      <Select
                        value={element.properties.sessionSource || "user"}
                        onValueChange={(value) =>
                          handlePropertyChange("sessionSource", value)
                        }
                      >
                        <SelectTrigger id="session-source">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                          <SelectItem value="role">Role</SelectItem>
                          <SelectItem value="session">Session</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="session-attribute">Attribute Key</Label>
                      <Input
                        id="session-attribute"
                        value={element.properties.sessionAttribute || ""}
                        onChange={(e) =>
                          handlePropertyChange(
                            "sessionAttribute",
                            e.target.value,
                          )
                        }
                        placeholder="email, tenantId, role"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="session-fallback">Fallback Value</Label>
                    <Input
                      id="session-fallback"
                      value={element.properties.sessionFallbackValue || ""}
                      onChange={(e) =>
                        handlePropertyChange(
                          "sessionFallbackValue",
                          e.target.value,
                        )
                      }
                      placeholder="Used when session value is unavailable"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">Read-only in form</p>
                      <p className="text-xs text-muted-foreground">
                        Session values are typically system-provided and not
                        user editable.
                      </p>
                    </div>
                    <Switch
                      id="session-readonly"
                      checked={element.properties.readOnly !== false}
                      onCheckedChange={(value) =>
                        handlePropertyChange("readOnly", value)
                      }
                    />
                  </div>
                </div>
              )}

              {(element.type === "button" ||
                element.type === "endpointSubmission") && (
                <>
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={element.properties.buttonText || "Submit"}
                      onChange={(e) =>
                        handlePropertyChange("buttonText", e.target.value)
                      }
                    />
                  </div>

                  {element.type === "button" && (
                    <div>
                      <Label htmlFor="buttonType">Button Type</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {(wizardMode
                          ? ["submit", "reset", "next", "back"]
                          : ["submit", "reset"]
                        ).map((type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2"
                          >
                            <Input
                              type="radio"
                              id={`button-${type}`}
                              name="buttonType"
                              value={type}
                              checked={element.properties.buttonType === type}
                              onChange={() =>
                                handlePropertyChange("buttonType", type)
                              }
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={`button-${type}`}
                              className="text-sm capitalize"
                            >
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="apiEndpoint">
                      {element.type === "endpointSubmission"
                        ? "Submission Endpoint"
                        : "API Endpoint (Optional)"}
                    </Label>
                    <Input
                      id="apiEndpoint"
                      value={element.properties.apiEndpoint || ""}
                      onChange={(e) =>
                        handlePropertyChange("apiEndpoint", e.target.value)
                      }
                      placeholder="https://api.example.com/submit"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {element.type === "endpointSubmission"
                        ? "Form payload destination for this endpoint node"
                        : "Where form data will be submitted when this button is clicked"}
                    </p>
                  </div>

                  {element.type === "endpointSubmission" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="endpointName">Endpoint Name</Label>
                          <Input
                            id="endpointName"
                            value={element.properties.endpointName || ""}
                            onChange={(e) =>
                              handlePropertyChange(
                                "endpointName",
                                e.target.value,
                              )
                            }
                            placeholder="Primary Submission Endpoint"
                          />
                        </div>
                        <div>
                          <Label htmlFor="endpointMethod">Method</Label>
                          <Select
                            value={element.properties.endpointMethod || "POST"}
                            onValueChange={(value) =>
                              handlePropertyChange("endpointMethod", value)
                            }
                          >
                            <SelectTrigger id="endpointMethod">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="payloadMapping">
                          Payload Mapping (JSON)
                        </Label>
                        <Textarea
                          id="payloadMapping"
                          rows={3}
                          value={element.properties.payloadMapping || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "payloadMapping",
                              e.target.value,
                            )
                          }
                          placeholder='{"name":"{{field_1}}","email":"{{field_2}}"}'
                        />
                      </div>

                      <div>
                        <Label htmlFor="endpointHeaders">Headers (JSON)</Label>
                        <Textarea
                          id="endpointHeaders"
                          rows={3}
                          value={element.properties.endpointHeaders || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "endpointHeaders",
                              e.target.value,
                            )
                          }
                          placeholder='{"Authorization":"Bearer token"}'
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {element.type === "fileupload" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div>
                    <Label htmlFor="accepted-types">Accepted File Types</Label>
                    <Input
                      id="accepted-types"
                      value={element.properties.acceptedTypes || ""}
                      onChange={(e) =>
                        handlePropertyChange("acceptedTypes", e.target.value)
                      }
                      placeholder="e.g. .jpg, .pdf, .doc"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Comma separated list of file extensions
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="max-file-size">Max Size (MB)</Label>
                      <Input
                        id="max-file-size"
                        type="number"
                        min={1}
                        value={element.properties.maxFileSizeMb || 10}
                        onChange={(e) =>
                          handlePropertyChange(
                            "maxFileSizeMb",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="storage-policy">Storage Policy</Label>
                      <Select
                        value={element.properties.storagePolicy || "default"}
                        onValueChange={(value) =>
                          handlePropertyChange("storagePolicy", value)
                        }
                      >
                        <SelectTrigger id="storage-policy">
                          <SelectValue placeholder="Select storage policy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Default Bucket
                          </SelectItem>
                          <SelectItem value="secure">
                            Secure Encrypted
                          </SelectItem>
                          <SelectItem value="archive">Archive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        Allow multiple uploads
                      </p>
                      <p className="text-xs text-muted-foreground">
                        UI-level support enabled; backend workflow can process
                        as configured.
                      </p>
                    </div>
                    <Switch
                      id="allowMultipleUploads"
                      checked={Boolean(element.properties.allowMultipleUploads)}
                      onCheckedChange={(value) =>
                        handlePropertyChange("allowMultipleUploads", value)
                      }
                    />
                  </div>
                </div>
              )}

              {element.type === "searchLookup" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    <h4 className="font-medium">
                      Live Database Lookup Configuration
                    </h4>
                  </div>

                  <div>
                    <Label htmlFor="searchEndpoint">API Endpoint</Label>
                    <Input
                      id="searchEndpoint"
                      value={element.properties.searchEndpoint || ""}
                      onChange={(e) =>
                        handlePropertyChange("searchEndpoint", e.target.value)
                      }
                      placeholder="https://api.example.com/search"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      URL to query as user types
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="searchKey">Search Parameter Name</Label>
                    <Input
                      id="searchKey"
                      value={element.properties.searchKey || "query"}
                      onChange={(e) =>
                        handlePropertyChange("searchKey", e.target.value)
                      }
                      placeholder="query"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Parameter name for search term (e.g., &quot;query&quot;,
                      &quot;search&quot;, &quot;term&quot;)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="searchResultsKey">Results Path</Label>
                    <Input
                      id="searchResultsKey"
                      value={element.properties.searchResultsKey || "results"}
                      onChange={(e) =>
                        handlePropertyChange("searchResultsKey", e.target.value)
                      }
                      placeholder="results"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Path to results array in response (e.g.,
                      &quot;data.results&quot;)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="searchLabelKey">Label Field</Label>
                      <Input
                        id="searchLabelKey"
                        value={element.properties.searchLabelKey || "name"}
                        onChange={(e) =>
                          handlePropertyChange("searchLabelKey", e.target.value)
                        }
                        placeholder="name"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Field to show in dropdown
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="searchValueKey">Value Field</Label>
                      <Input
                        id="searchValueKey"
                        value={element.properties.searchValueKey || "id"}
                        onChange={(e) =>
                          handlePropertyChange("searchValueKey", e.target.value)
                        }
                        placeholder="id"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Field for actual value
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="minChars">Min. Characters</Label>
                      <Input
                        id="minChars"
                        type="number"
                        value={element.properties.minChars || 2}
                        onChange={(e) =>
                          handlePropertyChange(
                            "minChars",
                            Number(e.target.value),
                          )
                        }
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Start search after X chars
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="debounceMs">Debounce (ms)</Label>
                      <Input
                        id="debounceMs"
                        type="number"
                        value={element.properties.debounceMs || 300}
                        onChange={(e) =>
                          handlePropertyChange(
                            "debounceMs",
                            Number(e.target.value),
                          )
                        }
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Wait time between searches
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {element.type === "captcha" && (
                <div className="space-y-4 rounded-md border border-border p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <h4 className="font-medium">CAPTCHA Configuration</h4>
                  </div>

                  <div>
                    <Label htmlFor="captchaType">CAPTCHA Type</Label>
                    <RadioGroup
                      defaultValue={
                        element.properties.captchaType || "recaptcha"
                      }
                      onValueChange={(value) =>
                        handlePropertyChange("captchaType", value)
                      }
                      className="mt-2 flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="recaptcha"
                          id="captcha-recaptcha"
                        />
                        <Label htmlFor="captcha-recaptcha">
                          Google reCAPTCHA
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="turnstile"
                          id="captcha-turnstile"
                        />
                        <Label htmlFor="captcha-turnstile">
                          Cloudflare Turnstile
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="captcha-custom" />
                        <Label htmlFor="captcha-custom">Custom CAPTCHA</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="siteKey">Site Key</Label>
                    <Input
                      id="siteKey"
                      value={element.properties.siteKey || ""}
                      onChange={(e) =>
                        handlePropertyChange("siteKey", e.target.value)
                      }
                      placeholder="Your site key from Google/Cloudflare"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Public key for CAPTCHA service
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="captchaTheme">Theme</Label>
                      <Select
                        value={element.properties.captchaTheme || "light"}
                        onValueChange={(value) =>
                          handlePropertyChange("captchaTheme", value)
                        }
                      >
                        <SelectTrigger
                          id="captchaTheme"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                          <SelectItem
                            value="light"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Light
                          </SelectItem>
                          <SelectItem
                            value="dark"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Dark
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="captchaSize">Size</Label>
                      <Select
                        value={element.properties.captchaSize || "normal"}
                        onValueChange={(value) =>
                          handlePropertyChange("captchaSize", value)
                        }
                      >
                        <SelectTrigger
                          id="captchaSize"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        >
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-lg">
                          <SelectItem
                            value="normal"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Normal
                          </SelectItem>
                          <SelectItem
                            value="compact"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Compact
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </DataSettingsSection>
          }
          logicContent={
            <LogicSettingsSection>
              {element.type === "number" &&
                element.properties.numberType === "calculated" && (
                  <div className="mt-1">
                    <CalculatedFieldBuilder
                      element={element}
                      elements={elements}
                      onPropertyChange={handlePropertyChange}
                    />
                  </div>
                )}

              {(element.type === "text" ||
                element.type === "textarea" ||
                element.type === "email") && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="minLength">Min Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={element.properties.validation?.minLength || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          handleValidationChange("minLength", value);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLength">Max Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        value={element.properties.validation?.maxLength || ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? Number(e.target.value)
                            : undefined;
                          handleValidationChange("maxLength", value);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pattern">Pattern (Regex)</Label>
                    <Input
                      id="pattern"
                      value={element.properties.validation?.pattern || ""}
                      onChange={(e) =>
                        handleValidationChange("pattern", e.target.value)
                      }
                      placeholder="e.g. ^[a-zA-Z0-9]+$"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Regular expression for validation
                    </p>
                  </div>
                </>
              )}

              {element.type === "email" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">Domain Rules</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="email-allow-domains">
                        Allowed Domains
                      </Label>
                      <Input
                        id="email-allow-domains"
                        value={element.properties.emailAllowedDomains || ""}
                        onChange={(e) =>
                          handlePropertyChange(
                            "emailAllowedDomains",
                            e.target.value,
                          )
                        }
                        placeholder="sotsm.org, saby.ai"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-block-domains">
                        Blocked Domains
                      </Label>
                      <Input
                        id="email-block-domains"
                        value={element.properties.emailBlockedDomains || ""}
                        onChange={(e) =>
                          handlePropertyChange(
                            "emailBlockedDomains",
                            e.target.value,
                          )
                        }
                        placeholder="gmail.com, yahoo.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyEmailDomainRules}
                    >
                      Apply Domain Rules To Pattern
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleValidationChange("pattern", undefined)
                      }
                    >
                      Clear Pattern
                    </Button>
                  </div>

                  {emailPatternPreview && (
                    <p className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                      Generated Pattern: {emailPatternPreview}
                    </p>
                  )}
                </div>
              )}

              {element.type === "password" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">
                    Confirm Password Linkage
                  </Label>
                  <Select
                    value={element.properties.confirmWithField || "none"}
                    onValueChange={(value) =>
                      handlePropertyChange(
                        "confirmWithField",
                        value === "none" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select confirm field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked field</SelectItem>
                      {elements
                        .filter(
                          (candidate) =>
                            candidate.type === "password" &&
                            candidate.id !== element.id,
                        )
                        .map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.label ||
                              `Password field ${candidate.id}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use this reference in custom workflow validation to enforce
                    password confirmation.
                  </p>
                </div>
              )}

              {(element.type === "datepicker" ||
                element.type === "timepicker") && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">
                    {element.type === "datepicker"
                      ? "Date Compare Rules"
                      : "Time Compare Rules"}
                  </Label>
                  <Select
                    value={element.properties.dateCompareMode || "none"}
                    onValueChange={(value) =>
                      handlePropertyChange("dateCompareMode", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compare rule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No compare rule</SelectItem>
                      <SelectItem value="before">Must be before</SelectItem>
                      <SelectItem value="after">Must be after</SelectItem>
                      <SelectItem value="between">Must be between</SelectItem>
                    </SelectContent>
                  </Select>

                  {element.properties.dateCompareMode &&
                    element.properties.dateCompareMode !== "none" && (
                      <>
                        <div>
                          <Label htmlFor="compare-source">
                            Compare Against
                          </Label>
                          <Select
                            value={
                              element.properties.dateCompareSource || "fixed"
                            }
                            onValueChange={(value) =>
                              handlePropertyChange("dateCompareSource", value)
                            }
                          >
                            <SelectTrigger id="compare-source">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed value</SelectItem>
                              <SelectItem value="field">
                                Another field
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {element.properties.dateCompareSource === "field" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="compare-field">
                                Primary Field
                              </Label>
                              <Select
                                value={
                                  element.properties.dateCompareField || "none"
                                }
                                onValueChange={(value) =>
                                  handlePropertyChange(
                                    "dateCompareField",
                                    value === "none" ? "" : value,
                                  )
                                }
                              >
                                <SelectTrigger id="compare-field">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Select field
                                  </SelectItem>
                                  {elements
                                    .filter(
                                      (candidate) =>
                                        candidate.id !== element.id &&
                                        (candidate.type === "datepicker" ||
                                          candidate.type === "timepicker"),
                                    )
                                    .map((candidate) => (
                                      <SelectItem
                                        key={candidate.id}
                                        value={candidate.id}
                                      >
                                        {candidate.label ||
                                          `${candidate.type} ${candidate.id}`}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {element.properties.dateCompareMode ===
                              "between" && (
                              <div>
                                <Label htmlFor="compare-end-field">
                                  End Field
                                </Label>
                                <Select
                                  value={
                                    element.properties.dateCompareEndField ||
                                    "none"
                                  }
                                  onValueChange={(value) =>
                                    handlePropertyChange(
                                      "dateCompareEndField",
                                      value === "none" ? "" : value,
                                    )
                                  }
                                >
                                  <SelectTrigger id="compare-end-field">
                                    <SelectValue placeholder="Select end field" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      Select field
                                    </SelectItem>
                                    {elements
                                      .filter(
                                        (candidate) =>
                                          candidate.id !== element.id &&
                                          (candidate.type === "datepicker" ||
                                            candidate.type === "timepicker"),
                                      )
                                      .map((candidate) => (
                                        <SelectItem
                                          key={candidate.id}
                                          value={candidate.id}
                                        >
                                          {candidate.label ||
                                            `${candidate.type} ${candidate.id}`}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="compare-value">
                                {element.properties.dateCompareMode ===
                                "between"
                                  ? "Start Value"
                                  : "Compare Value"}
                              </Label>
                              <Input
                                id="compare-value"
                                type={
                                  element.type === "datepicker"
                                    ? "date"
                                    : "time"
                                }
                                value={
                                  element.properties.dateCompareValue || ""
                                }
                                onChange={(e) =>
                                  handlePropertyChange(
                                    "dateCompareValue",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            {element.properties.dateCompareMode ===
                              "between" && (
                              <div>
                                <Label htmlFor="compare-end-value">
                                  End Value
                                </Label>
                                <Input
                                  id="compare-end-value"
                                  type={
                                    element.type === "datepicker"
                                      ? "date"
                                      : "time"
                                  }
                                  value={
                                    element.properties.dateCompareEndValue || ""
                                  }
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      "dateCompareEndValue",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                </div>
              )}

              {element.type === "fileupload" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="required-if">Conditional requirement</Label>
                    <Switch
                      id="required-if"
                      checked={Boolean(element.properties.requiredIfEnabled)}
                      onCheckedChange={(value) =>
                        handlePropertyChange("requiredIfEnabled", value)
                      }
                    />
                  </div>

                  {element.properties.requiredIfEnabled && (
                    <>
                      <div>
                        <Label htmlFor="required-if-field">
                          Required when field equals
                        </Label>
                        <Select
                          value={element.properties.requiredIfField || "none"}
                          onValueChange={(value) =>
                            handlePropertyChange(
                              "requiredIfField",
                              value === "none" ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger id="required-if-field">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select field</SelectItem>
                            {elements
                              .filter(
                                (candidate) => candidate.id !== element.id,
                              )
                              .map((candidate) => (
                                <SelectItem
                                  key={candidate.id}
                                  value={candidate.id}
                                >
                                  {candidate.label || `${candidate.type}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="required-if-value">Match Value</Label>
                        <Input
                          id="required-if-value"
                          value={element.properties.requiredIfValue || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "requiredIfValue",
                              e.target.value,
                            )
                          }
                          placeholder="Value that makes upload required"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {element.type === "searchLookup" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">
                    Lookup Filter Logic
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lookup-filter-mode">Filter Mode</Label>
                      <Select
                        value={
                          element.properties.lookupFilterMode || "contains"
                        }
                        onValueChange={(value) =>
                          handlePropertyChange("lookupFilterMode", value)
                        }
                      >
                        <SelectTrigger id="lookup-filter-mode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="startsWith">
                            Starts With
                          </SelectItem>
                          <SelectItem value="exact">Exact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lookup-dependent-field">
                        Depends On Field
                      </Label>
                      <Select
                        value={element.properties.lookupDependsOn || "none"}
                        onValueChange={(value) =>
                          handlePropertyChange(
                            "lookupDependsOn",
                            value === "none" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger id="lookup-dependent-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {elements
                            .filter((candidate) => candidate.id !== element.id)
                            .map((candidate) => (
                              <SelectItem
                                key={candidate.id}
                                value={candidate.id}
                              >
                                {candidate.label || `${candidate.type}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {element.type === "apidropdown" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="api-conditional-call">
                      Conditional API call
                    </Label>
                    <Switch
                      id="api-conditional-call"
                      checked={Boolean(
                        element.properties.apiConditionalEnabled,
                      )}
                      onCheckedChange={(value) =>
                        handlePropertyChange("apiConditionalEnabled", value)
                      }
                    />
                  </div>

                  {element.properties.apiConditionalEnabled && (
                    <div>
                      <Label htmlFor="api-trigger-field">Trigger Field</Label>
                      <Select
                        value={element.properties.apiTriggerField || "none"}
                        onValueChange={(value) =>
                          handlePropertyChange(
                            "apiTriggerField",
                            value === "none" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger id="api-trigger-field">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select field</SelectItem>
                          {elements
                            .filter((candidate) => candidate.id !== element.id)
                            .map((candidate) => (
                              <SelectItem
                                key={candidate.id}
                                value={candidate.id}
                              >
                                {candidate.label || `${candidate.type}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {element.type === "sessionLookup" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">
                    Session Visibility Logic
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="session-logic-mode">Mode</Label>
                      <Select
                        value={element.properties.sessionLogicMode || "always"}
                        onValueChange={(value) =>
                          handlePropertyChange("sessionLogicMode", value)
                        }
                      >
                        <SelectTrigger id="session-logic-mode">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Always</SelectItem>
                          <SelectItem value="ifEquals">
                            If session value equals
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {element.properties.sessionLogicMode === "ifEquals" && (
                      <div>
                        <Label htmlFor="session-logic-match">Match Value</Label>
                        <Input
                          id="session-logic-match"
                          value={element.properties.sessionLogicMatch || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "sessionLogicMatch",
                              e.target.value,
                            )
                          }
                          placeholder="admin"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {element.type === "endpointSubmission" && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <Label className="text-sm font-medium">
                    Submission Logic
                  </Label>
                  <div>
                    <Label htmlFor="submitConditionMode">Condition Mode</Label>
                    <Select
                      value={element.properties.submitConditionMode || "always"}
                      onValueChange={(value) =>
                        handlePropertyChange("submitConditionMode", value)
                      }
                    >
                      <SelectTrigger id="submitConditionMode">
                        <SelectValue placeholder="Select condition mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">Always submit</SelectItem>
                        <SelectItem value="fieldEquals">
                          Field equals
                        </SelectItem>
                        <SelectItem value="fieldNotEmpty">
                          Field is not empty
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {element.properties.submitConditionMode !== "always" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="submitConditionField">
                          Condition Field
                        </Label>
                        <Select
                          value={
                            element.properties.submitConditionField || "none"
                          }
                          onValueChange={(value) =>
                            handlePropertyChange(
                              "submitConditionField",
                              value === "none" ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger id="submitConditionField">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select field</SelectItem>
                            {elements
                              .filter(
                                (candidate) => candidate.id !== element.id,
                              )
                              .map((candidate) => (
                                <SelectItem
                                  key={candidate.id}
                                  value={candidate.id}
                                >
                                  {candidate.label || `${candidate.type}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {element.properties.submitConditionMode ===
                        "fieldEquals" && (
                        <div>
                          <Label htmlFor="submitConditionValue">
                            Match Value
                          </Label>
                          <Input
                            id="submitConditionValue"
                            value={
                              element.properties.submitConditionValue || ""
                            }
                            onChange={(e) =>
                              handlePropertyChange(
                                "submitConditionValue",
                                e.target.value,
                              )
                            }
                            placeholder="approved"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="payloadTransformTemplate">
                      Payload Transform Template
                    </Label>
                    <Textarea
                      id="payloadTransformTemplate"
                      rows={3}
                      value={element.properties.payloadTransformTemplate || ""}
                      onChange={(e) =>
                        handlePropertyChange(
                          "payloadTransformTemplate",
                          e.target.value,
                        )
                      }
                      placeholder='{"email":"{{email}}","amount":"{{amount}}"}'
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="conditional"
                    checked={element.properties.conditional || false}
                    onCheckedChange={(value) =>
                      handlePropertyChange("conditional", value)
                    }
                  />
                  <Label htmlFor="conditional" className="text-sm">
                    Enable conditional display
                  </Label>
                </div>

                {element.properties.conditional && (
                  <div className="mt-2 space-y-2 rounded-md border border-input p-3">
                    <div>
                      <Label htmlFor="dependsOn">Show this field when</Label>
                      <select
                        id="dependsOn"
                        className="mt-1 w-full rounded-md border border-input p-2"
                        value={
                          element.properties.conditionalLogic?.dependsOn || ""
                        }
                        onChange={(e) => {
                          const dependsOn = e.target.value;
                          handlePropertyChange("conditionalLogic", {
                            ...element.properties.conditionalLogic,
                            dependsOn,
                          });
                        }}
                      >
                        <option value="">Select a field</option>
                        {elements
                          .filter((e) => e.id !== element.id)
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.label || `Unnamed ${e.type}`}
                            </option>
                          ))}
                      </select>
                    </div>

                    {element.properties.conditionalLogic?.dependsOn && (
                      <div>
                        <Label htmlFor="showWhen">Has value</Label>
                        <Input
                          id="showWhen"
                          value={
                            element.properties.conditionalLogic?.showWhen || ""
                          }
                          onChange={(e) => {
                            handlePropertyChange("conditionalLogic", {
                              ...element.properties.conditionalLogic,
                              showWhen: e.target.value,
                            });
                          }}
                          placeholder="Value that triggers display"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </LogicSettingsSection>
          }
          automationContent={
            <AutomationSettingsSection>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Enable automation hooks</p>
                  <p className="text-xs text-muted-foreground">
                    Prepare event-based actions for this element.
                  </p>
                </div>
                <Switch
                  id="automationEnabled"
                  checked={Boolean(element.properties.automationEnabled)}
                  onCheckedChange={(value) =>
                    handlePropertyChange("automationEnabled", value)
                  }
                />
              </div>

              {element.properties.automationEnabled && (
                <>
                  <div>
                    <Label htmlFor="automationTrigger">Trigger</Label>
                    <Select
                      value={element.properties.automationTrigger || "onChange"}
                      onValueChange={(value) =>
                        handlePropertyChange("automationTrigger", value)
                      }
                    >
                      <SelectTrigger id="automationTrigger">
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onChange">On Change</SelectItem>
                        <SelectItem value="onLoad">On Load</SelectItem>
                        {element.type === "email" && (
                          <SelectItem value="onBlur">On Blur</SelectItem>
                        )}
                        {element.type === "fileupload" && (
                          <SelectItem value="onUpload">On Upload</SelectItem>
                        )}
                        {element.type === "searchLookup" && (
                          <SelectItem value="onFocus">On Focus</SelectItem>
                        )}
                        {element.type === "sessionLookup" && (
                          <SelectItem value="onSessionRefresh">
                            On Session Refresh
                          </SelectItem>
                        )}
                        {element.type === "apidropdown" && (
                          <>
                            <SelectItem value="onFocus">On Focus</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </>
                        )}
                        {element.type === "endpointSubmission" && (
                          <SelectItem value="manual">Manual</SelectItem>
                        )}
                        {(element.type === "datepicker" ||
                          element.type === "timepicker") && (
                          <SelectItem value="onSchedule">
                            On Schedule
                          </SelectItem>
                        )}
                        <SelectItem value="onSubmit">On Submit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="automationAction">Action</Label>
                    <Select
                      value={element.properties.automationAction || "notify"}
                      onValueChange={(value) =>
                        handlePropertyChange("automationAction", value)
                      }
                    >
                      <SelectTrigger id="automationAction">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notify">Notify</SelectItem>
                        <SelectItem value="updateField">
                          Update Field
                        </SelectItem>
                        <SelectItem value="lockField">Lock Field</SelectItem>
                        <SelectItem value="refreshLookup">
                          Refresh Lookup
                        </SelectItem>
                        {element.type === "email" && (
                          <SelectItem value="normalizeLowercase">
                            Normalize Lowercase
                          </SelectItem>
                        )}
                        {element.type === "password" && (
                          <SelectItem value="strengthFeedback">
                            Strength Feedback
                          </SelectItem>
                        )}
                        {(element.type === "datepicker" ||
                          element.type === "timepicker") && (
                          <>
                            <SelectItem value="sendReminder">
                              Send Reminder
                            </SelectItem>
                            <SelectItem value="flagExpiry">
                              Flag Expiry
                            </SelectItem>
                          </>
                        )}
                        {element.type === "fileupload" && (
                          <>
                            <SelectItem value="processUpload">
                              Process Upload
                            </SelectItem>
                            <SelectItem value="requestApproval">
                              Request Approval
                            </SelectItem>
                          </>
                        )}
                        {element.type === "searchLookup" && (
                          <SelectItem value="prefetchLookup">
                            Prefetch Lookup
                          </SelectItem>
                        )}
                        {element.type === "sessionLookup" && (
                          <>
                            <SelectItem value="autofillSession">
                              Autofill Session
                            </SelectItem>
                            <SelectItem value="refreshSession">
                              Refresh Session
                            </SelectItem>
                          </>
                        )}
                        {element.type === "apidropdown" && (
                          <>
                            <SelectItem value="fetchOptions">
                              Fetch Options
                            </SelectItem>
                            <SelectItem value="retryFetch">
                              Retry Fetch
                            </SelectItem>
                          </>
                        )}
                        {element.type === "endpointSubmission" && (
                          <>
                            <SelectItem value="submitEndpoint">
                              Submit Endpoint
                            </SelectItem>
                            <SelectItem value="queueSubmission">
                              Queue Submission
                            </SelectItem>
                            <SelectItem value="webhookChain">
                              Webhook Chain
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {(element.type === "datepicker" ||
                    element.type === "timepicker") &&
                    (element.properties.automationAction === "sendReminder" ||
                      element.properties.automationAction === "flagExpiry") && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="automationLeadDays">
                            Lead Offset
                          </Label>
                          <Input
                            id="automationLeadDays"
                            type="number"
                            value={element.properties.automationLeadDays || 0}
                            onChange={(e) =>
                              handlePropertyChange(
                                "automationLeadDays",
                                Number(e.target.value),
                              )
                            }
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Days (date) or minutes (time) before target.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="automationCadence">Cadence</Label>
                          <Select
                            value={
                              element.properties.automationCadence || "once"
                            }
                            onValueChange={(value) =>
                              handlePropertyChange("automationCadence", value)
                            }
                          >
                            <SelectTrigger id="automationCadence">
                              <SelectValue placeholder="Select cadence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">Once</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                  {element.type === "searchLookup" && (
                    <div>
                      <Label htmlFor="lookup-refresh-ms">
                        Refresh Window (ms)
                      </Label>
                      <Input
                        id="lookup-refresh-ms"
                        type="number"
                        value={element.properties.lookupRefreshMs || 10000}
                        onChange={(e) =>
                          handlePropertyChange(
                            "lookupRefreshMs",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}

                  {element.type === "apidropdown" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="api-retry-count">Retry Count</Label>
                        <Input
                          id="api-retry-count"
                          type="number"
                          value={element.properties.apiRetryCount || 0}
                          onChange={(e) =>
                            handlePropertyChange(
                              "apiRetryCount",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="api-retry-backoff">
                          Retry Backoff (ms)
                        </Label>
                        <Input
                          id="api-retry-backoff"
                          type="number"
                          value={element.properties.apiRetryBackoffMs || 500}
                          onChange={(e) =>
                            handlePropertyChange(
                              "apiRetryBackoffMs",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  {element.type === "sessionLookup" && (
                    <div>
                      <Label htmlFor="session-refresh-ms">
                        Session Refresh Interval (ms)
                      </Label>
                      <Input
                        id="session-refresh-ms"
                        type="number"
                        value={element.properties.sessionRefreshMs || 60000}
                        onChange={(e) =>
                          handlePropertyChange(
                            "sessionRefreshMs",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}

                  {element.type === "endpointSubmission" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="retry-policy">Retry Policy</Label>
                        <Select
                          value={element.properties.retryPolicy || "none"}
                          onValueChange={(value) =>
                            handlePropertyChange("retryPolicy", value)
                          }
                        >
                          <SelectTrigger id="retry-policy">
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="exponential">
                              Exponential Backoff
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="webhook-chain-url">
                          Webhook Chain URL
                        </Label>
                        <Input
                          id="webhook-chain-url"
                          value={element.properties.webhookChainUrl || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "webhookChainUrl",
                              e.target.value,
                            )
                          }
                          placeholder="https://hooks.example.com/next"
                        />
                      </div>
                    </div>
                  )}

                  {(element.type === "email" ||
                    element.type === "password") && (
                    <p className="text-xs text-muted-foreground">
                      Keep automation for credential fields lightweight and
                      avoid logging sensitive values.
                    </p>
                  )}
                </>
              )}
            </AutomationSettingsSection>
          }
          permissionsContent={
            <PermissionsSettingsSection>
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="readOnly">Read-only</Label>
                  <Switch
                    id="readOnly"
                    checked={Boolean(element.properties.readOnly)}
                    onCheckedChange={(value) =>
                      handlePropertyChange("readOnly", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hidden">Hidden</Label>
                  <Switch
                    id="hidden"
                    checked={Boolean(element.properties.hidden)}
                    onCheckedChange={(value) =>
                      handlePropertyChange("hidden", value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auditTracking">Audit tracking</Label>
                  <Switch
                    id="auditTracking"
                    checked={Boolean(element.properties.auditTracking)}
                    onCheckedChange={(value) =>
                      handlePropertyChange("auditTracking", value)
                    }
                  />
                </div>

                {(element.type === "datepicker" ||
                  element.type === "timepicker") && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="readOnlyAfterSubmission">
                      Read-only after submission
                    </Label>
                    <Switch
                      id="readOnlyAfterSubmission"
                      checked={Boolean(
                        element.properties.readOnlyAfterSubmission,
                      )}
                      onCheckedChange={(value) =>
                        handlePropertyChange("readOnlyAfterSubmission", value)
                      }
                    />
                  </div>
                )}

                {element.type === "fileupload" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
                      <Label htmlFor="canUpload" className="text-xs">
                        Upload
                      </Label>
                      <Switch
                        id="canUpload"
                        checked={element.properties.canUpload !== false}
                        onCheckedChange={(value) =>
                          handlePropertyChange("canUpload", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
                      <Label htmlFor="canView" className="text-xs">
                        View
                      </Label>
                      <Switch
                        id="canView"
                        checked={element.properties.canView !== false}
                        onCheckedChange={(value) =>
                          handlePropertyChange("canView", value)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-border px-2 py-1.5">
                      <Label htmlFor="canDelete" className="text-xs">
                        Delete
                      </Label>
                      <Switch
                        id="canDelete"
                        checked={Boolean(element.properties.canDelete)}
                        onCheckedChange={(value) =>
                          handlePropertyChange("canDelete", value)
                        }
                      />
                    </div>
                  </div>
                )}

                {element.type === "searchLookup" && (
                  <div>
                    <Label htmlFor="lookupRowScope">Row Scope Rule</Label>
                    <Input
                      id="lookupRowScope"
                      value={element.properties.lookupRowScope || ""}
                      onChange={(e) =>
                        handlePropertyChange("lookupRowScope", e.target.value)
                      }
                      placeholder="e.g. tenantId={{session.tenantId}}"
                    />
                  </div>
                )}

                {element.type === "apidropdown" && (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="restrictApiByRole">
                        Restrict API by roles
                      </Label>
                      <Switch
                        id="restrictApiByRole"
                        checked={Boolean(element.properties.restrictApiByRole)}
                        onCheckedChange={(value) =>
                          handlePropertyChange("restrictApiByRole", value)
                        }
                      />
                    </div>
                    {element.properties.restrictApiByRole && (
                      <div>
                        <Label htmlFor="allowedApiRoles">
                          Allowed Roles (CSV)
                        </Label>
                        <Input
                          id="allowedApiRoles"
                          value={element.properties.allowedApiRoles || ""}
                          onChange={(e) =>
                            handlePropertyChange(
                              "allowedApiRoles",
                              e.target.value,
                            )
                          }
                          placeholder="admin, manager"
                        />
                      </div>
                    )}
                  </div>
                )}

                {element.type === "sessionLookup" && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maskSensitiveSession">
                      Mask sensitive session value
                    </Label>
                    <Switch
                      id="maskSensitiveSession"
                      checked={Boolean(element.properties.maskSensitiveSession)}
                      onCheckedChange={(value) =>
                        handlePropertyChange("maskSensitiveSession", value)
                      }
                    />
                  </div>
                )}

                {element.type === "endpointSubmission" && (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireApiKey">Require API key</Label>
                      <Switch
                        id="requireApiKey"
                        checked={Boolean(element.properties.requireApiKey)}
                        onCheckedChange={(value) =>
                          handlePropertyChange("requireApiKey", value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="triggerRoles">Trigger Roles (CSV)</Label>
                      <Input
                        id="triggerRoles"
                        value={element.properties.triggerRoles || ""}
                        onChange={(e) =>
                          handlePropertyChange("triggerRoles", e.target.value)
                        }
                        placeholder="admin, approver, operator"
                      />
                    </div>
                  </div>
                )}

                {(element.type === "email" || element.type === "password") && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maskValue">Mask value</Label>
                    <Switch
                      id="maskValue"
                      checked={Boolean(element.properties.maskValue)}
                      onCheckedChange={(value) =>
                        handlePropertyChange("maskValue", value)
                      }
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="editableRoles">Editable Roles (CSV)</Label>
                  <Input
                    id="editableRoles"
                    value={element.properties.editableRoles || ""}
                    onChange={(e) =>
                      handlePropertyChange("editableRoles", e.target.value)
                    }
                    placeholder="admin, manager"
                  />
                </div>

                <div>
                  <Label htmlFor="visibleRoles">Visible Roles (CSV)</Label>
                  <Input
                    id="visibleRoles"
                    value={element.properties.visibleRoles || ""}
                    onChange={(e) =>
                      handlePropertyChange("visibleRoles", e.target.value)
                    }
                    placeholder="admin, reviewer, owner"
                  />
                </div>
              </div>
            </PermissionsSettingsSection>
          }
        />
      </div>
    </ScrollArea>
  );
};

export default ElementEditor;
