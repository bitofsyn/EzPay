import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
            // 토큰 만료
            localStorage.removeItem("userToken");
            sessionStorage.removeItem("userToken");
            return <Navigate to="/login" replace />;
        }
    } catch (err) {
        console.error("토큰 디코딩 실패", err);
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;
