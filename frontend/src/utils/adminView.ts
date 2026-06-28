import type { NavigateFunction } from "react-router-dom";
import { getUserData } from "./storage";

const ADMIN_PREVIEW_KEY = "ezpay_admin_preview";

export const enableAdminPreview = (): void => {
  sessionStorage.setItem(ADMIN_PREVIEW_KEY, "true");
};

export const disableAdminPreview = (): void => {
  sessionStorage.removeItem(ADMIN_PREVIEW_KEY);
};

export const hasAdminPreview = (): boolean => {
  return sessionStorage.getItem(ADMIN_PREVIEW_KEY) === "true";
};

export const navigateToAdminDashboard = (navigate: NavigateFunction): void => {
  const userData = getUserData();

  if (userData?.role === "ADMIN") {
    disableAdminPreview();
    navigate("/admin/dashboard");
    return;
  }

  enableAdminPreview();
  navigate("/admin/dashboard");
};
