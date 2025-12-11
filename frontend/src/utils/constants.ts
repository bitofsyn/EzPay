/**
 * 애플리케이션 전역 상수
 */

// 카테고리 목록
export const TRANSACTION_CATEGORIES = [
  { value: '식비', label: '식비' },
  { value: '교통', label: '교통' },
  { value: '주거', label: '주거' },
  { value: '가족', label: '가족' },
  { value: '기타', label: '기타' },
] as const;

// 공통 스타일 클래스
export const COMMON_STYLES = {
  input: 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
  button: {
    primary: 'bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-md',
    secondary: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all',
    danger: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold transition-all',
  },
  label: 'block text-gray-700 font-semibold',
  errorText: 'text-red-500 text-sm mt-1',
} as const;

// API 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.',
  UNAUTHORIZED: '이메일 또는 비밀번호가 올바르지 않습니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;
