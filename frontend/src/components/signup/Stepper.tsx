import React from "react";

type StepNumber = 1 | 2 | 3;

interface StepperProps {
  currentStep: StepNumber;
}

const STEPS: { number: StepNumber; label: string }[] = [
  { number: 1, label: "기본 정보" },
  { number: 2, label: "본인 확인" },
  { number: 3, label: "약관 동의" },
];

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <nav aria-label="회원가입 진행 단계" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={step.number}>
              <li className="flex flex-col items-center flex-shrink-0">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isCompleted
                      ? "bg-blue-600 text-white"
                      : isActive
                      ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2"
                      : "border-2 border-gray-300 text-gray-400 bg-white",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? <CheckIcon /> : step.number}
                </div>
                <span
                  className={[
                    "mt-1.5 text-xs font-medium whitespace-nowrap",
                    isActive
                      ? "text-gray-900"
                      : isCompleted
                      ? "text-blue-600"
                      : "text-gray-400",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </li>

              {!isLast && (
                <div className="flex-1 mx-2 mb-5">
                  <div className="h-0.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: step.number < currentStep ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;
