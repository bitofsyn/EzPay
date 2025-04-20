import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../api/UserAPI";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(form);
      console.log("로그인 API 응답:", res.data);

      const token = res.data; 
      console.log("token :", token);

      if (!token || token.split('.').length !== 3) {
        throw new Error("Invalid token format");
      }

      // ✅ 받은 토큰 바로 디코딩
      const decoded = jwtDecode(token);
      console.log("decoded :", decoded);

      // ✅ 디코딩 후 저장
      if (keepLogin) {
        localStorage.setItem("userToken", token);
      } else {
        sessionStorage.setItem("userToken", token);
      }
      localStorage.setItem("user", JSON.stringify(decoded));

      console.log("decoded userId : ", decoded.userId);
      // ✅ 로그인 성공 시 이동
      if (decoded.userId) {
        navigate("/dashboard");
      } else {
        setError("로그인 정보가 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("로그인 실패:", err);

      if (err.response) {
        const status = err.response.status;
        if (status === 401) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (status >= 500) {
          setError("서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } else if (err.request) {
        setError("서버에 연결할 수 없습니다. 인터넷 연결을 확인하세요.");
      } else {
        setError("요청 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
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

          {/* 로그인 유지 체크박스 */}
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="keepLogin"
              checked={keepLogin}
              onChange={(e) => setKeepLogin(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="keepLogin" className="text-sm text-gray-700">
              로그인 유지하기
            </label>
          </div>

          {/* 오류 메시지 */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 회원가입 | 아이디 찾기 | 비밀번호 찾기 링크 */}
        <div className="text-center text-sm text-gray-600 mt-4">
          <span
            className="text-gray-700 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            회원가입
          </span>
          <span className="mx-2 text-gray-400">|</span>
          <span
            className="text-gray-700 cursor-pointer hover:underline"
            onClick={() => navigate("/find-id")}
          >
            아이디 찾기
          </span>
          <span className="mx-2 text-gray-400">|</span>
          <span
            className="text-gray-700 cursor-pointer hover:underline"
            onClick={() => navigate("/find-password")}
          >
            비밀번호 찾기
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
