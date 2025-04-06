import { NavLink, Outlet } from "react-router-dom";

const LayoutSettings = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* 상단 헤더 */}
            <header className="bg-gray-800 text-white p-4 font-bold text-lg">
                EzPay
            </header>

            <div className="flex flex-1">
                {/* 좌측 메뉴 */}
                <aside className="w-60 bg-white border-r p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">설정 메뉴</h2>
                    <nav className="space-y-3">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `block hover:text-blue-600 ${isActive ? "text-blue-600 font-bold" : "text-gray-700"}`
                            }
                        >
                            사용자 정보
                        </NavLink>
                        <NavLink
                            to="/settings/password"
                            className={({ isActive }) =>
                                `block hover:text-blue-600 ${isActive ? "text-blue-600 font-bold" : "text-gray-700"}`
                            }
                        >
                            비밀번호 변경
                        </NavLink>
                        <NavLink
                            to="/settings/notification"
                            className={({ isActive }) =>
                                `block hover:text-blue-600 ${isActive ? "text-blue-600 font-bold" : "text-gray-700"}`
                            }
                        >
                            알림 설정
                        </NavLink>
                        <NavLink
                            to="/settings/transfer-limit"
                            className={({ isActive }) =>
                                `block hover:text-blue-600 ${isActive ? "text-blue-600 font-bold" : "text-gray-700"}`
                            }
                        >
                            송금 한도
                        </NavLink>
                        <NavLink
                            to="/settings/withdraw"
                            className={({ isActive }) =>
                                `block hover:text-red-500 ${isActive ? "font-bold" : "text-gray-700"}`
                            }
                        >
                            회원 탈퇴
                        </NavLink>
                    </nav>
                </aside>


                {/* 오른쪽 페이지 영역 */}
                <main className="flex-1 p-8 bg-white">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default LayoutSettings;
