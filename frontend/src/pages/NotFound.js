import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-6xl fonxt-bold text-gray-800">404</h1>
            <p className="text-xl text-gray-600 mt-4">페이지를 찾을 수 없습니다.</p>
            <p className="text-gray-500">입력하신 주소를 다시 확인해주세요.</p>

            <button 
                className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                onClick={() => navigate("/")}
            >
                홈으로 이동
            </button>
        </div>
    );
};


export default NotFound;