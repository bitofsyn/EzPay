import React from "react";
import type { TransactionStatus, LogLevel, RiskLevel } from "../../types";
import {
  getStatusBadgeStyle,
  getStatusBadgeDarkStyle,
  getLogLevelColor,
  getRiskLevelColor,
  getRiskLevelDarkColor,
} from "../../utils/admin/styleMapper";

type BadgeType = "status" | "level" | "risk";

interface BadgeDarkProps {
  variant: "status" | "level" | "risk";
  value: TransactionStatus | LogLevel | RiskLevel;
}

interface BadgeLightProps {
  variant: "status" | "risk";
  value: TransactionStatus | RiskLevel;
}

type BadgeProps = BadgeDarkProps | BadgeLightProps;

export const Badge: React.FC<BadgeProps> = ({ variant, value }) => {
  let style: string;

  if (variant === "status") {
    // Light theme for transaction status (used in tables on white backgrounds)
    const status = value as TransactionStatus;
    style = getStatusBadgeStyle(status);
  } else if (variant === "level") {
    // Dark theme for log levels (used in dark terminals)
    const level = value as LogLevel;
    style = getLogLevelColor(level);
  } else {
    // Risk level - detect if dark or light based on context (default dark)
    const risk = value as RiskLevel;
    style = getRiskLevelDarkColor(risk);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${style}`}>
      {value}
    </span>
  );
};

// Light variant for white backgrounds
export const BadgeLight: React.FC<{ variant: "status" | "risk"; value: TransactionStatus | RiskLevel }> = ({
  variant,
  value,
}) => {
  let style: string;

  if (variant === "status") {
    style = getStatusBadgeStyle(value as TransactionStatus);
  } else {
    style = getRiskLevelColor(value as RiskLevel);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${style}`}>
      {value}
    </span>
  );
};

// Dark variant for dark backgrounds
export const BadgeDark: React.FC<{ variant: "status" | "level" | "risk"; value: string }> = ({
  variant,
  value,
}) => {
  let style: string;

  if (variant === "status") {
    style = getStatusBadgeDarkStyle(value as TransactionStatus);
  } else if (variant === "level") {
    style = getLogLevelColor(value as LogLevel);
  } else {
    style = getRiskLevelDarkColor(value as RiskLevel);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${style}`}>
      {value}
    </span>
  );
};

export default Badge;
