import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/UserAPI";

const FindPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await requestPasswordReset(email);
      const token = res.data;

      sessionStorage.setItem("resetToken", token);

      navigate("/reset-password");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("비밀번호 재설정 요청에 실패했습니다.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">비밀번호 재설정 요청</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="가입한 이메일을 입력하세요"
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold transition hover:bg-gray-700"
          >
            요청하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default FindPassword;
