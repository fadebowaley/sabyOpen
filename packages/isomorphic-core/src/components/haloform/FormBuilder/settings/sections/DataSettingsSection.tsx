import React from "react";

interface DataSettingsSectionProps {
  children: React.ReactNode;
}

const DataSettingsSection = ({ children }: DataSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
        <h4 className="text-sm font-semibold text-emerald-800">
          Data Settings
        </h4>
        <p className="text-xs text-emerald-700/80">
          Field type behavior, values, and source configuration.
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default DataSettingsSection;
