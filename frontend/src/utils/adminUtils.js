// 시간 차이를 상대 시간으로 변환하는 함수
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return `${Math.floor(diffInSeconds / 86400)}일 전`;
};

// 타입과 상태에 따라 색상 결정
export const getActivityColor = (type, status) => {
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

// 금액을 3자리 콤마로 포맷팅
export const formatActivityDescription = (description) => {
  if (!description) return '';

  // 숫자 패턴 찾기 (콤마가 있거나 없는 숫자, 소수점 포함)
  return description.replace(/(\d+),?(\d+),?(\d+)(\.\d+)?|(\d{4,})(\.\d+)?/g, (match) => {
    // 콤마와 소수점 제거 후 숫자로 변환 (소수점 버림)
    const number = match.replace(/[,\.]\d*/g, '').replace(/,/g, '');
    // 3자리 콤마 포맷팅 후 "원" 붙이기
    return parseInt(number).toLocaleString() + '원';
  });
};

// 금액 포맷팅 함수
export const formatAmount = (amount) => {
  if (!amount) return 0;
  // BigDecimal이 문자열로 올 경우를 대비
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.floor(numAmount).toLocaleString();
};
