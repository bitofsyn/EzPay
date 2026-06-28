import React from "react";
import { InboxIcon } from "lucide-react";

type EmptyStateVariant = "default" | "compact";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: EmptyStateVariant;
  fullHeight?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = "default",
  fullHeight = false,
}) => {
  const containerClass = fullHeight ? "min-h-[400px]" : "";
  const contentClass = variant === "compact" ? "py-4" : "py-12";

  return (
    <div
      className={`flex items-center justify-center ${contentClass} ${containerClass} bg-slate-50 rounded-lg border border-slate-200`}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {icon ? (
            <div className="text-slate-400">{icon}</div>
          ) : (
            <InboxIcon className="w-12 h-12 text-slate-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

// Dark variant for dark backgrounds
export const EmptyStateDark: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = "default",
  fullHeight = false,
}) => {
  const containerClass = fullHeight ? "min-h-[400px]" : "";
  const contentClass = variant === "compact" ? "py-4" : "py-12";

  return (
    <div
      className={`flex items-center justify-center ${contentClass} ${containerClass} bg-slate-800 rounded-lg border border-slate-700`}
    >
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {icon ? (
            <div className="text-slate-500">{icon}</div>
          ) : (
            <InboxIcon className="w-12 h-12 text-slate-500" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">{title}</h3>
        {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
