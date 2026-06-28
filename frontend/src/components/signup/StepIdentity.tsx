import React from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export type Gender = "MALE" | "FEMALE" | "NONE";

export interface IdentityValues {
  phoneNumber: string;
  birthDate: string;
  gender: Gender;
}

interface StepIdentityProps {
  defaultValues?: Partial<IdentityValues>;
  onBack: () => void;
  onNext: (data: IdentityValues) => void;
  onLoginClick: () => void;
}

const identitySchema = yup
  .object({
    phoneNumber: yup
      .string()
      .required("휴대폰 번호를 입력해주세요")
      .matches(/^01[0-9]{9}$/, "유효한 휴대폰 번호를 입력해주세요 (예: 01012345678)"),
    birthDate: yup
      .string()
      .required("생년월일을 입력해주세요")
      .test("is-past-date", "유효한 생년월일을 입력해주세요", (value) => {
        if (!value) return false;
        return new Date(value) < new Date();
      }),
    gender: yup
      .string()
      .oneOf(["MALE", "FEMALE", "NONE"] as const)
      .required("성별을 선택해주세요"),
  })
  .required();

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
  { value: "NONE", label: "선택 안 함" },
];

const inputBase =
  "w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:border-transparent";
const inputNormal = "border-gray-200 hover:border-gray-300 bg-white focus:ring-gray-900";
const inputError = "border-red-400 bg-red-50 focus:ring-red-400";

const StepIdentity: React.FC<StepIdentityProps> = ({
  defaultValues,
  onBack,
  onNext,
  onLoginClick,
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: yupResolver(identitySchema) as any,
    defaultValues: { gender: "NONE", ...defaultValues },
  });

  const { ref: phoneRef, onChange: phoneRhfChange, ...phoneRest } = register("phoneNumber");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11);
    phoneRhfChange(e);
  };

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">본인 확인</h1>
        <p className="text-sm text-gray-500 mt-1">휴대폰 번호와 생년월일을 확인합니다.</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
        {/* 휴대폰 번호 */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
            휴대폰 번호 <span className="text-red-500">*</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            inputMode="numeric"
            placeholder="01012345678"
            ref={phoneRef}
            onChange={handlePhoneChange}
            {...phoneRest}
            aria-invalid={!!errors.phoneNumber}
            className={`${inputBase} ${errors.phoneNumber ? inputError : inputNormal}`}
          />
          {errors.phoneNumber && (
            <p role="alert" className="mt-1.5 text-xs text-red-500">
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* 생년월일 */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1.5">
            생년월일 <span className="text-red-500">*</span>
          </label>
          <input
            id="birthDate"
            type="date"
            max={todayIso}
            {...register("birthDate")}
            aria-invalid={!!errors.birthDate}
            className={`${inputBase} ${errors.birthDate ? inputError : inputNormal}`}
          />
          {errors.birthDate && (
            <p role="alert" className="mt-1.5 text-xs text-red-500">
              {errors.birthDate.message}
            </p>
          )}
        </div>

        {/* 성별 */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">성별</p>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="성별 선택">
                {GENDER_OPTIONS.map(({ value, label }) => {
                  const isSelected = field.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      aria-pressed={isSelected}
                      className={[
                        "py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900",
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-400",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* 보안 안내 */}
        <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            className="flex-shrink-0 mt-0.5"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            입력하신 정보는 본인 확인 목적으로만 사용되며 256bit 암호화로 안전하게 보호됩니다.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="w-20 flex-shrink-0 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            이전
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
          >
            다음
          </button>
        </div>
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

export default StepIdentity;
