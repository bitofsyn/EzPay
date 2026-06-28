import React from "react";

type TabTheme = "default" | "status" | "level" | "risk";

interface FilterTabProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  theme?: TabTheme;
  className?: string;
}

const getColorForTab = (tab: string, isActive: boolean, theme: TabTheme): string => {
  if (!isActive) {
    return "text-slate-500 hover:bg-slate-50";
  }

  if (theme === "default") {
    return "bg-slate-900 text-white";
  }

  // Map tab values to colors by theme
  const colorMap: Record<string, string> = {
    // Status colors
    SUCCESS: "bg-emerald-500 text-white",
    PENDING: "bg-amber-500 text-white",
    FAILED: "bg-red-500 text-white",

    // Log level colors
    INFO: "bg-cyan-500 text-white",
    WARN: "bg-amber-500 text-white",
    ERROR: "bg-red-500 text-white",
    DEBUG: "bg-purple-500 text-white",

    // Risk colors
    SAFE: "bg-emerald-500 text-white",
    CAUTION: "bg-amber-500 text-white",
    DANGER: "bg-red-500 text-white",

    // Default
    "전체": "bg-slate-900 text-white",
  };

  return colorMap[tab] || "bg-slate-900 text-white";
};

const FilterTab: React.FC<FilterTabProps> = ({
  tabs,
  activeTab,
  onChange,
  theme = "default",
  className = "",
}) => {
  return (
    <div className={`flex rounded-xl border border-slate-200 bg-white overflow-hidden ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const color = getColorForTab(tab, isActive, theme);

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`px-4 py-2 text-sm font-semibold transition ${color}`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

export default FilterTab;
