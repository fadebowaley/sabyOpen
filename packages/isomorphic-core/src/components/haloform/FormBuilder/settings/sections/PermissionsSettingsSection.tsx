import React from "react";

interface PermissionsSettingsSectionProps {
  children: React.ReactNode;
}

const PermissionsSettingsSection = ({
  children,
}: PermissionsSettingsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <h4 className="text-sm font-semibold text-slate-800">
          Permissions Settings
        </h4>
        <p className="text-xs text-slate-700/80">
          Access controls, visibility rules, and audit metadata.
        </p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export default PermissionsSettingsSection;
