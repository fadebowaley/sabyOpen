export type SettingsTabKey =
  | "basic"
  | "data"
  | "logic"
  | "automation"
  | "permissions";

export interface ElementSettingsCapabilities {
  basic: boolean;
  data: boolean;
  logic: boolean;
  automation: boolean;
  permissions: boolean;
}

export interface SettingsTabDefinition {
  key: SettingsTabKey;
  label: string;
}

export const SETTINGS_TAB_DEFINITIONS: SettingsTabDefinition[] = [
  { key: "basic", label: "Basic" },
  { key: "data", label: "Data" },
  { key: "logic", label: "Logic" },
  { key: "automation", label: "Automation" },
  { key: "permissions", label: "Permissions" },
];
