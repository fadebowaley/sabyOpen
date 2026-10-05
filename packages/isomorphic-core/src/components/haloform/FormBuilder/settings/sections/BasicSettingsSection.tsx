import React from "react";

interface BasicSettingsSectionProps {
  children: React.ReactNode;
}

const BasicSettingsSection = ({ children }: BasicSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2">
        <h4 className="text-sm font-semibold text-blue-800">Basic Settings</h4>
        <p className="text-xs text-blue-700/80">
          Core label, layout, and presentation options.
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default BasicSettingsSection;
