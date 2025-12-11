import { useNavigate } from "react-router-dom";

interface HeaderProps {
    title: string;
}

const Header = ({ title }: HeaderProps) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <header className="flex justify-between items-center p-4 bg-blue-500 text-white">
            <h1 className="text-xl font-bold">{title}</h1>
            <button
                onClick={handleLogout}
                className="bg-white text-blue-500 px-3 py-1 rounded-lg font-semibold hover:bg-gray-100"
            >
                로그아웃
            </button>
        </header>
    );
};

export default Header;
