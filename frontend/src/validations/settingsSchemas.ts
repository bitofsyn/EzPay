import * as yup from 'yup';

// 비밀번호 변경 스키마
export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('현재 비밀번호를 입력해주세요'),
  newPassword: yup
    .string()
    .required('새 비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  confirmPassword: yup
    .string()
    .required('비밀번호 확인을 입력해주세요')
    .oneOf([yup.ref('newPassword')], '비밀번호가 일치하지 않습니다'),
}).required();

// 송금 한도 변경 스키마
export const transferLimitSchema = yup.object({
  perTransactionLimit: yup
    .number()
    .required('1회 송금 한도를 입력해주세요')
    .positive('송금 한도는 0보다 커야 합니다')
    .min(1000, '최소 송금 한도는 1,000원입니다')
    .max(10000000, '최대 1회 송금 한도는 10,000,000원입니다'),
  dailyLimit: yup
    .number()
    .required('일일 송금 한도를 입력해주세요')
    .positive('송금 한도는 0보다 커야 합니다')
    .min(1000, '최소 송금 한도는 1,000원입니다')
    .max(50000000, '최대 일일 송금 한도는 50,000,000원입니다')
    .test(
      'daily-greater-than-per',
      '일일 한도는 1회 한도보다 크거나 같아야 합니다',
      function (value) {
        const { perTransactionLimit } = this.parent;
        return !value || !perTransactionLimit || value >= perTransactionLimit;
      }
    ),
}).required();

// 사용자 정보 수정 스키마
export const updateUserInfoSchema = yup.object({
  name: yup
    .string()
    .required('이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다'),
  phoneNumber: yup
    .string()
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 휴대폰 번호를 입력해주세요'),
}).required();
