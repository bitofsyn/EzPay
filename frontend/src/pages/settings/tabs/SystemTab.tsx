import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

type Theme = "light" | "dark" | "system";
type Language = "ko" | "en";

const SystemTab: React.FC = () => {
    const [theme, setTheme] = useState<Theme>("light");
    const [language, setLanguage] = useState<Language>("ko");
    const [compactMode, setCompactMode] = useState<boolean>(false);

    useEffect(() => {
        // 로컬 스토리지에서 설정 불러오기
        const savedTheme = localStorage.getItem("ezpay_theme") as Theme;
        const savedLanguage = localStorage.getItem("ezpay_language") as Language;
        const savedCompactMode = localStorage.getItem("ezpay_compact_mode");

        if (savedTheme) setTheme(savedTheme);
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedCompactMode) setCompactMode(savedCompactMode === "true");
    }, []);

    const handleThemeChange = (newTheme: Theme): void => {
        setTheme(newTheme);
        localStorage.setItem("ezpay_theme", newTheme);
        toast.success("테마가 변경되었습니다.");
    };

    const handleLanguageChange = (newLanguage: Language): void => {
        setLanguage(newLanguage);
        localStorage.setItem("ezpay_language", newLanguage);
        toast.success("언어가 변경되었습니다.");
    };

    const handleCompactModeToggle = (): void => {
        const newValue = !compactMode;
        setCompactMode(newValue);
        localStorage.setItem("ezpay_compact_mode", String(newValue));
        toast.success(newValue ? "간결한 보기가 활성화되었습니다." : "간결한 보기가 비활성화되었습니다.");
    };

    return (
        <div className="space-y-6">
            {/* 테마 설정 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-purple-600">🎨</span> 테마 설정
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => handleThemeChange("light")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            theme === "light"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="text-2xl mb-2">☀️</div>
                        <p className="text-sm font-medium">라이트</p>
                    </button>
                    <button
                        onClick={() => handleThemeChange("dark")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            theme === "dark"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="text-2xl mb-2">🌙</div>
                        <p className="text-sm font-medium">다크</p>
                    </button>
                    <button
                        onClick={() => handleThemeChange("system")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                            theme === "system"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="text-2xl mb-2">💻</div>
                        <p className="text-sm font-medium">시스템</p>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    * 다크 모드는 추후 지원 예정입니다.
                </p>
            </section>

            {/* 언어 설정 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-green-600">🌐</span> 언어 설정
                </h2>
                <div className="space-y-3">
                    <label
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            language === "ko"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <input
                            type="radio"
                            name="language"
                            value="ko"
                            checked={language === "ko"}
                            onChange={() => handleLanguageChange("ko")}
                            className="hidden"
                        />
                        <span className="text-lg mr-3">🇰🇷</span>
                        <span className="font-medium">한국어</span>
                    </label>
                    <label
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            language === "en"
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <input
                            type="radio"
                            name="language"
                            value="en"
                            checked={language === "en"}
                            onChange={() => handleLanguageChange("en")}
                            className="hidden"
                        />
                        <span className="text-lg mr-3">🇺🇸</span>
                        <span className="font-medium">English</span>
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    * 영어는 추후 지원 예정입니다.
                </p>
            </section>

            {/* 화면 설정 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-orange-600">📱</span> 화면 설정
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800">간결한 보기</p>
                        <p className="text-sm text-gray-500">더 많은 정보를 한 화면에 표시합니다.</p>
                    </div>
                    <label htmlFor="compactMode" aria-label="간결한 보기" className="relative inline-flex items-center cursor-pointer">
                        <input
                            id="compactMode"
                            type="checkbox"
                            checked={compactMode}
                            onChange={handleCompactModeToggle}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </section>

            {/* 앱 정보 */}
            <section className="bg-gray-50 rounded-xl p-4">
                <div className="text-center text-sm text-gray-500">
                    <p className="font-medium">EzPay</p>
                    <p>버전 1.0.0</p>
                </div>
            </section>
        </div>
    );
};

export default SystemTab;
