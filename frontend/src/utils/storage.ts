/**
 * 로컬 스토리지와 세션 스토리지를 위한 유틸리티 함수들
 */

export interface UserData {
  userId: number;
  email: string;
  name: string;
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
  return data ? JSON.parse(data) : null;
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
