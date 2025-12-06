import * as yup from 'yup';

// 로그인 스키마
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('이메일을 입력해주세요')
    .email('유효한 이메일 주소를 입력해주세요'),
  password: yup
    .string()
    .required('비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
}).required();

// 회원가입 스키마
export const signupSchema = yup.object({
  email: yup
    .string()
    .required('이메일을 입력해주세요')
    .email('유효한 이메일 주소를 입력해주세요'),
  password: yup
    .string()
    .required('비밀번호를 입력해주세요')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  confirmPassword: yup
    .string()
    .required('비밀번호 확인을 입력해주세요')
    .oneOf([yup.ref('password')], '비밀번호가 일치하지 않습니다'),
  name: yup
    .string()
    .required('이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다'),
  phoneNumber: yup
    .string()
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 휴대폰 번호를 입력해주세요'),
}).required();

// 비밀번호 재설정 요청 스키마
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('이메일을 입력해주세요')
    .email('유효한 이메일 주소를 입력해주세요'),
}).required();

// 비밀번호 재설정 스키마
export const resetPasswordSchema = yup.object({
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

// 이메일 찾기 스키마
export const findEmailSchema = yup.object({
  name: yup
    .string()
    .required('이름을 입력해주세요')
    .min(2, '이름은 최소 2자 이상이어야 합니다'),
  phoneNumber: yup
    .string()
    .required('휴대폰 번호를 입력해주세요')
    .matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 휴대폰 번호를 입력해주세요'),
}).required();
