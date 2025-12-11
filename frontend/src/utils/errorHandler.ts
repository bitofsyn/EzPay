import { AxiosError } from 'axios';

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const serverMessage = axiosError.response.data?.message;

      // 서버 메시지가 있으면 우선 사용
      if (serverMessage) {
        return serverMessage;
      }

      // 상태 코드별 기본 메시지
      if (status === 401) {
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (status === 403) {
        return '접근 권한이 없습니다.';
      } else if (status === 404) {
        return '요청한 리소스를 찾을 수 없습니다.';
      } else if (status >= 500) {
        return '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        return '알 수 없는 오류가 발생했습니다.';
      }
    } else if (axiosError.request) {
      return '서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.';
    }
  }

  return '요청 중 오류가 발생했습니다.';
};

/**
 * 송금 관련 에러 메시지 매핑
 */
export const handleTransferError = (error: unknown): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const serverMessage = axiosError.response?.data?.message;

    const knownMessages: Record<string, string> = {
      '송금 한도 정보를 찾을 수 없습니다.': '송금 한도 설정이 되어 있지 않습니다. 관리자에게 문의해주세요.',
      '잔액이 부족합니다.': '출금 계좌에 잔액이 부족합니다.',
      '계좌가 존재하지 않습니다.': '존재하지 않는 계좌입니다.',
    };

    if (serverMessage && knownMessages[serverMessage]) {
      return knownMessages[serverMessage];
    }

    return serverMessage || '송금에 실패했습니다. 다시 시도해주세요.';
  }

  return handleApiError(error);
};
