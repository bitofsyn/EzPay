import React from "react";

// ─── Status Badge ────────────────────────────────────────────────────────────

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === "활성" || status === "완료"
      ? "bg-emerald-50 text-emerald-700"
      : status === "정지" || status === "실패"
      ? "bg-red-50 text-red-600"
      : status === "처리중"
      ? "bg-amber-50 text-amber-600"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
};

// ─── Risk Badge ───────────────────────────────────────────────────────────────

export const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => {
  const cls =
    risk === "안전"
      ? "bg-emerald-50 text-emerald-600"
      : risk === "주의"
      ? "bg-amber-50 text-amber-600"
      : risk === "위험"
      ? "bg-red-50 text-red-500"
      : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {risk}
    </span>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────

export const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span className={`text-sm ${role === "ADMIN" ? "text-purple-600 font-semibold" : "text-slate-500"}`}>
    {role}
  </span>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? "bg-cyan-500" : "bg-slate-200"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ─── Admin Slider ─────────────────────────────────────────────────────────────

interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  gradientColors?: [string, string];
}

export const AdminSlider: React.FC<SliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  color = "#06b6d4",
  gradientColors,
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  const bg = gradientColors
    ? `linear-gradient(to right, ${gradientColors[0]}, ${gradientColors[1]} ${pct}%, #e5e7eb ${pct}%)`
    : `linear-gradient(to right, ${color} ${pct}%, #e5e7eb ${pct}%)`;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-4
        [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-white
        [&::-webkit-slider-thumb]:border-2
        [&::-webkit-slider-thumb]:border-slate-400
        [&::-webkit-slider-thumb]:shadow-sm"
      style={{ background: bg }}
    />
  );
};

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

interface FilterTabsProps<T extends string> {
  options: T[];
  active: T;
  onChange: (v: T) => void;
}

export function FilterTabs<T extends string>({ options, active, onChange }: FilterTabsProps<T>) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 text-sm font-semibold transition ${
            active === opt
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
