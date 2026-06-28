import React, { useCallback } from "react";
import { useForm } from "react-hook-form";

export interface TermsValues {
  isServiceAgreed: boolean;
  isPrivacyAgreed: boolean;
  isMarketingAgreed: boolean;
}

interface TermsItem {
  key: keyof TermsValues;
  label: string;
  badge: string;
  isRequired: boolean;
}

const TERMS_ITEMS: TermsItem[] = [
  { key: "isServiceAgreed", label: "이용약관 동의", badge: "필수", isRequired: true },
  { key: "isPrivacyAgreed", label: "개인정보처리방침 동의", badge: "필수", isRequired: true },
  { key: "isMarketingAgreed", label: "마케팅 정보 수신 동의", badge: "선택", isRequired: false },
];

interface StepTermsProps {
  onBack: () => void;
  onSubmit: (data: TermsValues) => Promise<void>;
  isSubmitting: boolean;
  onLoginClick: () => void;
}

const StepTerms: React.FC<StepTermsProps> = ({
  onBack,
  onSubmit,
  isSubmitting,
  onLoginClick,
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<TermsValues>({
    defaultValues: {
      isServiceAgreed: false,
      isPrivacyAgreed: false,
      isMarketingAgreed: false,
    },
  });

  const values = watch();
  const isAllAgreed =
    values.isServiceAgreed && values.isPrivacyAgreed && values.isMarketingAgreed;
  const isRequiredAgreed = values.isServiceAgreed && values.isPrivacyAgreed;

  const handleAllAgreedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      setValue("isServiceAgreed", checked);
      setValue("isPrivacyAgreed", checked);
      setValue("isMarketingAgreed", checked);
    },
    [setValue]
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">약관 동의</h1>
        <p className="text-sm text-gray-500 mt-1">서비스 이용 약관을 확인해주세요.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
        {/* 전체 동의 */}
        <label
          className={[
            "flex items-center gap-3 px-4 py-4 rounded-xl border cursor-pointer transition-colors",
            isAllAgreed
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 bg-white hover:bg-gray-50",
          ].join(" ")}
        >
          <input
            type="checkbox"
            checked={isAllAgreed}
            onChange={handleAllAgreedChange}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            aria-label="전체 동의"
          />
          <span className="font-semibold text-sm text-gray-900">전체 동의</span>
        </label>

        <div className="border-t border-gray-100 my-2" />

        {/* 개별 약관 항목 */}
        {TERMS_ITEMS.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-100 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register(item.key)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                aria-label={item.label}
              />
              <span className="text-sm text-gray-700">
                {item.label}{" "}
                <span
                  className={[
                    "text-xs px-1.5 py-0.5 rounded font-medium",
                    item.isRequired
                      ? "text-red-500 bg-red-50"
                      : "text-gray-500 bg-gray-100",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2 focus:outline-none"
              aria-label={`${item.label} 내용 보기`}
            >
              보기
            </button>
          </label>
        ))}

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onBack}
            className="w-20 flex-shrink-0 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            이전
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isRequiredAgreed}
            className={[
              "flex-1 py-3 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
              isSubmitting || !isRequiredAgreed
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]",
            ].join(" ")}
            aria-label={isSubmitting ? "가입 진행 중" : "가입 완료"}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                가입 중...
              </span>
            ) : (
              "가입 완료"
            )}
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

export default StepTerms;
