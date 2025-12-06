import * as yup from 'yup';

// 송금 스키마
export const transferSchema = yup.object({
  fromAccountId: yup
    .number()
    .required('송금할 계좌를 선택해주세요')
    .positive('유효한 계좌를 선택해주세요'),
  toAccountNumber: yup
    .string()
    .required('받는 사람 계좌번호를 입력해주세요')
    .matches(/^[0-9]{10,14}$/, '계좌번호는 10-14자리 숫자여야 합니다'),
  amount: yup
    .number()
    .required('송금 금액을 입력해주세요')
    .positive('송금 금액은 0보다 커야 합니다')
    .min(1000, '최소 송금 금액은 1,000원입니다')
    .max(10000000, '1회 최대 송금 금액은 10,000,000원입니다'),
  memo: yup
    .string()
    .max(100, '메모는 최대 100자까지 입력 가능합니다'),
}).required();

// 계좌 개설 스키마
export const createAccountSchema = yup.object({
  accountName: yup
    .string()
    .required('계좌명을 입력해주세요')
    .min(2, '계좌명은 최소 2자 이상이어야 합니다')
    .max(20, '계좌명은 최대 20자까지 입력 가능합니다'),
  initialBalance: yup
    .number()
    .min(0, '초기 잔액은 0 이상이어야 합니다')
    .max(100000000, '초기 잔액은 최대 100,000,000원까지 가능합니다'),
}).required();
