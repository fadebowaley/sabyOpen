import React from "react";

interface LogicSettingsSectionProps {
  children: React.ReactNode;
}

const LogicSettingsSection = ({ children }: LogicSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
        <h4 className="text-sm font-semibold text-amber-800">Logic Settings</h4>
        <p className="text-xs text-amber-700/80">
          Conditional behavior, formulas, and validation rules.
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default LogicSettingsSection;
