import React, { useEffect, useMemo } from "react";
import { Tabs, TabsContent } from "@haloform/ui/tabs";
import { ElementType } from "@haloform/types/form-builder";
import { getElementSettingsCapabilities } from "./elementSettingsRegistry";
import ElementSettingsTabs from "./ElementSettingsTabs";
import {
  SETTINGS_TAB_DEFINITIONS,
  SettingsTabDefinition,
  SettingsTabKey,
} from "./types";

interface ElementSettingsPanelProps {
  elementType: ElementType;
  activeTab: SettingsTabKey;
  onActiveTabChange: (tab: SettingsTabKey) => void;
  basicContent: React.ReactNode;
  dataContent: React.ReactNode;
  logicContent: React.ReactNode;
  automationContent: React.ReactNode;
  permissionsContent: React.ReactNode;
}

const ElementSettingsPanel = ({
  elementType,
  activeTab,
  onActiveTabChange,
  basicContent,
  dataContent,
  logicContent,
  automationContent,
  permissionsContent,
}: ElementSettingsPanelProps) => {
  const capabilities = getElementSettingsCapabilities(elementType);

  const availableTabs = useMemo<SettingsTabDefinition[]>(
    () =>
      SETTINGS_TAB_DEFINITIONS.filter(
        ({ key }) => capabilities[key as keyof typeof capabilities],
      ),
    [capabilities],
  );

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      const fallbackTab = availableTabs[0]?.key || "basic";
      onActiveTabChange(fallbackTab);
    }
  }, [activeTab, availableTabs, onActiveTabChange]);

  const selectedTab = availableTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : availableTabs[0]?.key || "basic";

  return (
    <Tabs
      value={selectedTab}
      onValueChange={(value) => onActiveTabChange(value as SettingsTabKey)}
      className="w-full"
    >
      <ElementSettingsTabs tabs={availableTabs} activeTab={selectedTab} />

      <TabsContent value="basic" className="m-0 space-y-4">
        {basicContent}
      </TabsContent>
      <TabsContent value="data" className="m-0 space-y-4">
        {dataContent}
      </TabsContent>
      <TabsContent value="logic" className="m-0 space-y-4">
        {logicContent}
      </TabsContent>
      <TabsContent value="automation" className="m-0 space-y-4">
        {automationContent}
      </TabsContent>
      <TabsContent value="permissions" className="m-0 space-y-4">
        {permissionsContent}
      </TabsContent>
    </Tabs>
  );
};

export default ElementSettingsPanel;
