import React from "react";

interface AutomationSettingsSectionProps {
  children: React.ReactNode;
}

const AutomationSettingsSection = ({
  children,
}: AutomationSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2">
        <h4 className="text-sm font-semibold text-violet-800">
          Automation Settings
        </h4>
        <p className="text-xs text-violet-700/80">
          Trigger-based actions on load, change, upload, or submit.
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default AutomationSettingsSection;
