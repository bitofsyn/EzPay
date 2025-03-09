import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-2xl font-bold">회원가입</h2>
      <button
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
        onClick={() => navigate("/login")}
      >
        로그인 페이지로 이동
      </button>
    </div>
  );
};

export default Signup;
