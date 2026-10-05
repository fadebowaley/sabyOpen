import React from "react";
import { TabsList, TabsTrigger } from "@haloform/ui/tabs";
import { SettingsTabDefinition, SettingsTabKey } from "./types";

interface ElementSettingsTabsProps {
  tabs: SettingsTabDefinition[];
  activeTab: SettingsTabKey;
}

const ElementSettingsTabs = ({ tabs, activeTab }: ElementSettingsTabsProps) => {
  return (
    <div className="sticky top-0 z-10 mb-4 border-b border-border bg-background pb-3 pt-1">
      <TabsList
        className={`grid w-full gap-1 ${
          tabs.length <= 1
            ? "grid-cols-1"
            : tabs.length === 2
              ? "grid-cols-2"
              : tabs.length === 3
                ? "grid-cols-3"
                : tabs.length === 4
                  ? "grid-cols-4"
                  : "grid-cols-5"
        }`}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            aria-selected={activeTab === tab.key}
            className="text-xs sm:text-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};

export default ElementSettingsTabs;
