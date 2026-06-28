import React from "react";

type SpinnerSize = "sm" | "md" | "lg";
type SpinnerColor = "cyan" | "slate" | "white";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  text?: string;
  fullScreen?: boolean;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const colorMap: Record<SpinnerColor, string> = {
  cyan: "border-cyan-500",
  slate: "border-slate-900",
  white: "border-white",
};

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "cyan",
  text,
  fullScreen = false,
}) => {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-2 border-transparent rounded-full animate-spin ${colorMap[color]} border-t-current`}
      />
      {text && <p className="text-sm text-slate-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Dark variant for dark backgrounds
export const SpinnerDark: React.FC<Omit<SpinnerProps, "fullScreen">> = ({
  size = "md",
  color = "cyan",
  text,
}) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-2 border-transparent rounded-full animate-spin ${colorMap[color]} border-t-current`}
      />
      {text && <p className="text-sm text-slate-400">{text}</p>}
    </div>
  );
};

export default Spinner;
