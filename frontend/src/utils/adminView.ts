import type { NavigateFunction } from "react-router-dom";
import type { AxiosError } from "axios";
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

// 관리자 미리보기 모드에서 쓰기 액션이 403(권한 없음)을 반환한 경우인지 판별.
// 이 경우 UI는 낙관적으로 로컬 상태만 갱신한다.
export const isAdminPreviewForbiddenError = (error: unknown): boolean => {
  if (!hasAdminPreview()) {
    return false;
  }
  const status = (error as AxiosError)?.response?.status;
  return status === 403;
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
