import { ElementType } from "@haloform/types/form-builder";
import { ElementSettingsCapabilities } from "./types";

const FULL_CAPABILITIES: ElementSettingsCapabilities = {
  basic: true,
  data: true,
  logic: true,
  automation: true,
  permissions: true,
};

const BASIC_ONLY_CAPABILITIES: ElementSettingsCapabilities = {
  basic: true,
  data: false,
  logic: false,
  automation: false,
  permissions: true,
};

const ELEMENT_SETTINGS_REGISTRY: Partial<
  Record<ElementType, ElementSettingsCapabilities>
> = {
  header: BASIC_ONLY_CAPABILITIES,
  paragraph: BASIC_ONLY_CAPABILITIES,
};

export const getElementSettingsCapabilities = (
  elementType: ElementType,
): ElementSettingsCapabilities => {
  return ELEMENT_SETTINGS_REGISTRY[elementType] || FULL_CAPABILITIES;
};
