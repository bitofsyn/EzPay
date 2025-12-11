/**
 * 계좌번호를 XX-XXXX-XXXXXX 형식으로 포맷팅
 */
export const formatAccountNumber = (number: string): string => {
  if (!number || number.length < 6) return number;
  return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
};

/**
 * 금액을 3자리 콤마로 포맷팅
 */
export const formatAmount = (amount: number | string): string => {
  if (!amount) return '0';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.floor(numAmount).toLocaleString();
};

/**
 * 금액을 원 단위로 포맷팅
 */
export const formatCurrency = (amount: number | string): string => {
  return `${formatAmount(amount)} 원`;
};

/**
 * 날짜를 로케일 문자열로 포맷팅
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};

/**
 * 상대 시간으로 변환 (예: "방금 전", "5분 전")
 */
export const getRelativeTime = (timestamp: string | Date): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
};

/**
 * 활동 설명 내 금액을 포맷팅
 */
export const formatActivityDescription = (description: string): string => {
  if (!description) return '';

  // 숫자 패턴 찾기 (콤마가 있거나 없는 숫자, 소수점 포함)
  return description.replace(/(\d+),?(\d+),?(\d+)(\.\d+)?|(\d{4,})(\.\d+)?/g, (match) => {
    // 콤마와 소수점 제거 후 숫자로 변환
    const number = match.replace(/[,.]\d*/g, '').replace(/,/g, '');
    return parseInt(number).toLocaleString() + '원';
  });
};

/**
 * 활동 타입과 상태에 따라 색상 결정
 */
export const getActivityColor = (type: string, status?: string): string => {
  if (status === 'failed') return 'red';
  if (status === 'warning') return 'yellow';

  switch (type) {
    case 'user': return 'cyan';
    case 'transaction': return 'green';
    case 'error': return 'red';
    case 'system': return 'blue';
    default: return 'gray';
  }
};
