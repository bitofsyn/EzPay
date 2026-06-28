import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export interface BasicInfoValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface StepBasicInfoProps {
  defaultValues?: Partial<BasicInfoValues>;
  onNext: (data: BasicInfoValues) => void;
  onLoginClick: () => void;
}

const basicInfoSchema = yup
  .object({
    name: yup
      .string()
      .required("이름을 입력해주세요")
      .min(2, "이름은 최소 2자 이상이어야 합니다"),
    email: yup
      .string()
      .required("이메일을 입력해주세요")
      .email("유효한 이메일 주소를 입력해주세요"),
    password: yup
      .string()
      .required("비밀번호를 입력해주세요")
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "대소문자, 숫자, 특수문자를 포함해야 합니다"
      ),
    confirmPassword: yup
      .string()
      .required("비밀번호 확인을 입력해주세요")
      .oneOf([yup.ref("password")], "비밀번호가 일치하지 않습니다"),
  })
  .required();

function EyeToggleIcon({ isVisible }: { isVisible: boolean }) {
  return isVisible ? (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:border-transparent";
const inputNormal = "border-gray-200 hover:border-gray-300 bg-white focus:ring-gray-900";
const inputError = "border-red-400 bg-red-50 focus:ring-red-400";

const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  defaultValues,
  onNext,
  onLoginClick,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoValues>({
    resolver: yupResolver(basicInfoSchema),
    defaultValues,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">계정 만들기</h1>
        <p className="text-sm text-gray-500 mt-1">기본 정보를 입력해주세요.</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-4">
        {/* 이름 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="홍길동"
            {...register("name")}
            aria-invalid={!!errors.name}
            className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
          />
          {errors.name && (
            <p role="alert" className="mt-1.5 text-xs text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* 이메일 */}
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1.5">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="이메일 주소"
            {...register("email")}
            aria-invalid={!!errors.email}
            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-xs text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* 비밀번호 */}
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1.5">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="비밀번호 입력"
              {...register("password")}
              aria-invalid={!!errors.password}
              className={`${inputBase} pr-20 ${errors.password ? inputError : inputNormal}`}
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((v) => !v)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              aria-label={isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              <EyeToggleIcon isVisible={isPasswordVisible} />
              <span>{isPasswordVisible ? "숨기기" : "표시"}</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            8자 이상, 영문 대소문자, 숫자, 특수문자 포함 필요
          </p>
          {errors.password && (
            <p role="alert" className="mt-0.5 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={isConfirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="비밀번호 재입력"
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              className={`${inputBase} pr-20 ${errors.confirmPassword ? inputError : inputNormal}`}
            />
            <button
              type="button"
              onClick={() => setIsConfirmPasswordVisible((v) => !v)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              aria-label={
                isConfirmPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시"
              }
            >
              <EyeToggleIcon isVisible={isConfirmPasswordVisible} />
              <span>{isConfirmPasswordVisible ? "숨기기" : "표시"}</span>
            </button>
          </div>
          {errors.confirmPassword && (
            <p role="alert" className="mt-1.5 text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 mt-2"
        >
          다음
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        이미 계정이 있으신가요?{" "}
        <button
          type="button"
          onClick={onLoginClick}
          className="font-semibold text-blue-600 hover:underline focus:outline-none"
        >
          로그인
        </button>
      </p>
    </div>
  );
};

export default StepBasicInfo;
