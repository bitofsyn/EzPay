import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/UserAPI";
import { handleApiError } from "../utils/errorHandler";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "" // 🔵 추가
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("회원 가입 정보 : ", formData);

    try {
      const response = await signup(formData);
      console.log("회원가입 성공 :", response.data);
      alert("회원가입이 완료되었습니다");
      navigate("/login");
    } catch (error) {
      console.log("회원가입 오류 : ", error);
      const errorMessage = handleApiError(error);
      alert(`회원가입 실패: ${errorMessage}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">회원가입</h2>

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
            <label className="block text-gray-700 font-semibold">이메일</label>
            <input 
              type="email" 
              name="email"
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold">비밀번호</label>
            <input 
              type="password" 
              name="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
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
              placeholder="핸드폰 번호를 입력하세요 (01012345678)"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold transition hover:bg-blue-700"
          >
            회원가입
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
