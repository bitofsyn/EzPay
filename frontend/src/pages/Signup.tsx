import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { signup } from "../api/UserAPI";
import { signupSchema } from "../validations/authSchemas";
import { handleApiError } from "../utils/errorHandler";

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = data;
      await signup(signupData);
      toast.success("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(`회원가입 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">회원가입</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-gray-700 font-semibold">
              이름
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-gray-700 font-semibold">
              이메일
            </label>
            <input
              id="email"
              type="email"
              {...register("email")}
              placeholder="이메일을 입력하세요"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-gray-700 font-semibold">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="비밀번호를 다시 입력하세요"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* 핸드폰 번호 */}
          <div>
            <label htmlFor="phoneNumber" className="block text-gray-700 font-semibold">
              핸드폰 번호 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              id="phoneNumber"
              type="text"
              {...register("phoneNumber")}
              placeholder="01012345678"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
            />
            {errors.phoneNumber && (
              <p id="phoneNumber-error" className="text-red-500 text-sm mt-1" role="alert">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold transition hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            aria-label={loading ? "회원가입 진행 중" : "회원가입"}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          이미 계정이 있나요?{" "}
          <span
            className="text-blue-600 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            로그인하기
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
