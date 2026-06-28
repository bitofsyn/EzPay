/**
 * 로컬 스토리지와 세션 스토리지를 위한 유틸리티 함수들
 */

import { UserRole } from '../types';

export interface UserData {
  userId: number;
  email: string;
  name: string;
  phoneNumber?: string;
  role?: UserRole;
}

/**
 * 사용자 데이터를 스토리지에 저장
 */
export const saveUserData = (userData: UserData, keepLogin: boolean = false): void => {
  const storage = keepLogin ? localStorage : sessionStorage;
  storage.setItem('user', JSON.stringify(userData));
};

/**
 * 사용자 데이터를 스토리지에서 가져오기
 */
export const getUserData = (): UserData | null => {
  const localData = localStorage.getItem('user');
  const sessionData = sessionStorage.getItem('user');

  const data = localData || sessionData;
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as UserData;
  } catch {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    return null;
  }
};

export const updateStoredUserData = (partial: Partial<UserData>): void => {
  const storages = [localStorage, sessionStorage];

  storages.forEach((storage) => {
    const raw = storage.getItem("user");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as UserData;
      storage.setItem("user", JSON.stringify({ ...parsed, ...partial }));
    } catch {
      storage.removeItem("user");
    }
  });
};

/**
 * 사용자 데이터 삭제 (로그아웃)
 */
export const clearUserData = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('userToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('userToken');
};

/**
 * 토큰 저장
 */
export const saveToken = (token: string, keepLogin: boolean = false): void => {
  const storage = keepLogin ? localStorage : sessionStorage;
  storage.setItem('userToken', token);
};

/**
 * 토큰 가져오기
 */
export const getToken = (): string | null => {
  return localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
};

/**
 * 사용자 역할 조회
 */
export const getUserRole = (): UserRole | null => {
  const userData = getUserData();
  return userData?.role || null;
};

/**
 * 관리자 여부 확인
 */
export const isAdmin = (): boolean => {
  return getUserRole() === 'ADMIN';
};
