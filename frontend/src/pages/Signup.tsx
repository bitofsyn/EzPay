import React, { useReducer } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { signup } from "../api/UserAPI";
import { handleApiError } from "../utils/errorHandler";
import AuthBanner from "../components/AuthBanner";
import Stepper from "../components/signup/Stepper";
import StepBasicInfo, { BasicInfoValues } from "../components/signup/StepBasicInfo";
import StepIdentity, { IdentityValues } from "../components/signup/StepIdentity";
import StepTerms, { TermsValues } from "../components/signup/StepTerms";

// ─── Types ────────────────────────────────────────────────────────────────────

type FunnelStep = 1 | 2 | 3;

interface FunnelState {
  currentStep: FunnelStep;
  basicInfo: Partial<BasicInfoValues>;
  identity: Partial<IdentityValues>;
  isSubmitting: boolean;
}

type FunnelAction =
  | { type: "ADVANCE_FROM_STEP1"; payload: BasicInfoValues }
  | { type: "ADVANCE_FROM_STEP2"; payload: IdentityValues }
  | { type: "GO_BACK" }
  | { type: "SET_SUBMITTING"; payload: boolean };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function funnelReducer(state: FunnelState, action: FunnelAction): FunnelState {
  switch (action.type) {
    case "ADVANCE_FROM_STEP1":
      return { ...state, currentStep: 2, basicInfo: action.payload };
    case "ADVANCE_FROM_STEP2":
      return { ...state, currentStep: 3, identity: action.payload };
    case "GO_BACK":
      return { ...state, currentStep: (state.currentStep - 1) as FunnelStep };
    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    default:
      return state;
  }
}

// ─── Signup (page) ────────────────────────────────────────────────────────────

const Signup: React.FC = () => {
  const navigate = useNavigate();

  const [state, dispatch] = useReducer(funnelReducer, {
    currentStep: 1,
    basicInfo: {},
    identity: {},
    isSubmitting: false,
  });

  const handleStep1Next = (data: BasicInfoValues) => {
    dispatch({ type: "ADVANCE_FROM_STEP1", payload: data });
  };

  const handleStep2Next = (data: IdentityValues) => {
    dispatch({ type: "ADVANCE_FROM_STEP2", payload: data });
  };

  const handleFinalSubmit = async (termsData: TermsValues) => {
    const { name, email, password } = state.basicInfo as BasicInfoValues;
    const { phoneNumber, birthDate, gender } = state.identity as IdentityValues;

    // Spring Boot API 페이로드 구조로 매핑
    const _apiPayload = {
      name,
      email,
      password,
      phoneNumber,
      birthDate,
      gender,
      termsAgreed: {
        service: termsData.isServiceAgreed,
        privacy: termsData.isPrivacyAgreed,
        marketing: termsData.isMarketingAgreed,
      },
    };

    dispatch({ type: "SET_SUBMITTING", payload: true });
    try {
      await signup({ name, email, password, phoneNumber });
      toast.success("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (err) {
      toast.error(`회원가입 실패: ${handleApiError(err)}`);
    } finally {
      dispatch({ type: "SET_SUBMITTING", payload: false });
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <StepBasicInfo
            defaultValues={state.basicInfo}
            onNext={handleStep1Next}
            onLoginClick={() => navigate("/login")}
          />
        );
      case 2:
        return (
          <StepIdentity
            defaultValues={state.identity}
            onBack={() => dispatch({ type: "GO_BACK" })}
            onNext={handleStep2Next}
            onLoginClick={() => navigate("/login")}
          />
        );
      case 3:
        return (
          <StepTerms
            onBack={() => dispatch({ type: "GO_BACK" })}
            onSubmit={handleFinalSubmit}
            isSubmitting={state.isSubmitting}
            onLoginClick={() => navigate("/login")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthBanner onLogoClick={() => navigate("/")} />
      <div className="flex flex-col justify-center px-8 sm:px-16 py-16 bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm mx-auto">
          <Stepper currentStep={state.currentStep} />
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Signup;
