import React from "react";
import type { ToggleSwitchProps } from "../../types";

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  description,
}) => {
  return (
    <div className="flex items-start justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition">
      <div className="flex-1">
        <label className="text-sm font-semibold text-slate-900 cursor-pointer block">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
          checked
            ? "bg-cyan-500"
            : "bg-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

// Compact variant (no background)
export const ToggleSwitchCompact: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-semibold text-slate-900">{label}</label>

      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
          checked
            ? "bg-cyan-500"
            : "bg-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
