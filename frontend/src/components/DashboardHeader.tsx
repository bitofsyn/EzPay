import { FiMenu } from "react-icons/fi";

interface DashboardHeaderProps {
    userName?: string;
    onMenuOpen: () => void;
}

const DashboardHeader = ({ userName, onMenuOpen }: DashboardHeaderProps) => {
    return (
        <header className="flex w-full max-w-4xl items-center justify-between rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">EzPay</p>
              <h2 className="text-lg font-semibold text-slate-900">{userName || '사용자'} 님</h2>
            </div>
            <button onClick={onMenuOpen}>
                <FiMenu size={24} className="text-slate-700" />
            </button>
        </header>
    );
};

export default DashboardHeader;
