import { useNavigate } from "react-router-dom";
import { useState} from "react";
import { login } from "../api/userAPI"; 

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({email: "", password:""});
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({...form, [e.target.name] : e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try{
      const res = await login(form);
      const token = res.data;
      // JWT 토큰 저장
      localStorage.setItem("userToken", token);

      alert("로그인 성공!");

      // 홈으로 이동
      navigate("/");
    } catch(err) {
      console.error("로그인 실패 :", err);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-center">로그인</h2>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="mt-6">
          {/* 이메일 입력 */}
          <div>
            <label className="block text-gray-700">이메일</label>
            <input
              type="email"
              name="email"
              className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="이메일을 입력하세요"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="mt-4">
            <label className="block text-gray-700">비밀번호</label>
            <input
              type="password"
              name="password"
              className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* 오류 메시지 */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full mt-6 bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            로그인
          </button>
        </form>

        {/* 회원가입 이동 */}
        <p className="text-center text-gray-600 mt-4">
          계정이 없으신가요?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            회원가입
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
