import { useNavigate } from "react-router-dom";
import { useEffect , useState } from "react";
import axios from "axios";
import {FaSignInAlt, FaUserPlus, FaWallet } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

  console.log("============== ", API_URL , "===========");

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if(!token) return;

    axios.get(`${API_URL}/users/me`, {
      headers : {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      setUserInfo(res.data.data);
    })
    .catch((err) => {
      console.error("사용자 정보 조회 실패 : ", err);
      localStorage.removeItem("userToken");
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4"> EzPay 송금 시스템</h1>
        <p className="text-gray-600 mb-6">
          {userInfo 
            ? `#${userInfo.name}님, 환영합니다.`
            : "쉽고 빠른 송금 EzPay와 함께 하세요."}
        </p>

        {userInfo ? (
          <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-xl font-semibold transition hover:bg-blue-700"
          onClick={() => navigate("/dashboard")}
          >
            <FaWallet size={20}/>
            <span>대시보드로 이동</span>
          </button>
        ) : (
          <div className="mt-4 space-y-6">
            <button className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-xl font-semibold transition hover:bg-green-600"
            onClick={() => navigate("/login")}
            >
              <FaSignInAlt size={20}/>
              <span>로그인</span>
            </button>
            
            <button className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white py-3 rounded-xl font-semibold transition hover:bg-gray-800"
            onClick={() => navigate("/signup")}
            >
              <FaUserPlus size={20}/>
              <span>회원가입</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


export default Home;
