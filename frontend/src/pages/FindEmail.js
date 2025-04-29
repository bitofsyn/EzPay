import { useState } from "react";
import { findEmail } from "../api/UserAPI";
import { useNavigate } from "react-router-dom";

const FindEmail = () => {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  });

  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage(""); 
    setResult(null);     
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 전화번호 유효성 검증
    const isValidPhone = /^01[016789][0-9]{7,8}$/.test(formData.phoneNumber);
    if (!isValidPhone) {
      setErrorMessage("올바른 핸드폰 번호 형식이 아닙니다.");
      return;
    }

    try {
      const email = await findEmail(formData);
      setResult(email.email);
      setErrorMessage("");
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("이메일 찾기에 실패했습니다.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          이메일 찾기
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold">이름</label>
            <input
              type="text"
              name="name"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">핸드폰 번호</label>
            <input
              type="text"
              name="phoneNumber"
              placeholder="01012345678"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
          )}

          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold transition hover:bg-gray-700"
          >
            이메일 찾기
          </button>
        </form>

        {result && (
          <div className="mt-8 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 shadow-inner">
            <p className="text-sm text-white">
              회원님의 이메일은: <span className="font-semibold text-blue-300">{result}</span>
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert("이메일이 복사되었습니다!");
              }}
              className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded-md transition"
            >
              복사
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-slate-400 hover:underline"
          >
            로그인 하러 가기 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindEmail;
