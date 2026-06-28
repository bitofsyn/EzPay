// Admin UI Style Mapping Utilities
// Centralized style logic for status badges, log levels, risk levels, etc.

import type { TransactionStatus, LogLevel, RiskLevel } from "../../types";

// Transaction Status Colors
export const getStatusBadgeStyle = (status: TransactionStatus): string => {
  const styles: Record<TransactionStatus, string> = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    FAILED: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return styles[status];
};

export const getStatusBadgeDarkStyle = (status: TransactionStatus): string => {
  const styles: Record<TransactionStatus, string> = {
    SUCCESS: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    PENDING: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    FAILED: "bg-red-500/20 text-red-400 border border-red-500/30",
  };
  return styles[status];
};

// Log Level Colors
export const getLogLevelColor = (level: LogLevel): string => {
  const colors: Record<LogLevel, string> = {
    INFO: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    WARN: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    ERROR: "bg-red-500/20 text-red-400 border border-red-500/30",
    DEBUG: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  };
  return colors[level];
};

export const getLogLevelDotColor = (level: LogLevel): string => {
  const colors: Record<LogLevel, string> = {
    INFO: "bg-cyan-500",
    WARN: "bg-amber-500",
    ERROR: "bg-red-500",
    DEBUG: "bg-purple-500",
  };
  return colors[level];
};

// Risk Level Colors
export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    SAFE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    CAUTION: "bg-amber-50 text-amber-700 border border-amber-200",
    DANGER: "bg-red-50 text-red-700 border border-red-200",
  };
  return colors[level];
};

export const getRiskLevelDarkColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    SAFE: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    CAUTION: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    DANGER: "bg-red-500/20 text-red-400 border border-red-500/30",
  };
  return colors[level];
};

// Filter Tab Active Color
export const getFilterTabColor = (isActive: boolean, type: "status" | "level" | "risk"): string => {
  if (!isActive) {
    return "text-slate-500 hover:bg-slate-50";
  }

  const colorMap: Record<string, string> = {
    "status-SUCCESS": "bg-emerald-500 text-white",
    "status-PENDING": "bg-amber-500 text-white",
    "status-FAILED": "bg-red-500 text-white",
    "level-INFO": "bg-cyan-500 text-white",
    "level-WARN": "bg-amber-500 text-white",
    "level-ERROR": "bg-red-500 text-white",
    "level-DEBUG": "bg-purple-500 text-white",
    "risk-SAFE": "bg-emerald-500 text-white",
    "risk-CAUTION": "bg-amber-500 text-white",
    "risk-DANGER": "bg-red-500 text-white",
  };

  return colorMap[`${type}-`] || "bg-slate-900 text-white";
};

// User Status Colors
export const getUserStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-slate-50 text-slate-700",
    LOCKED: "bg-red-50 text-red-700",
    SUSPENDED: "bg-orange-50 text-orange-700",
  };
  return colors[status] || "bg-slate-50 text-slate-700";
};
