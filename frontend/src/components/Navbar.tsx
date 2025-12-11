import { FiMenu } from "react-icons/fi";

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <header className="flex justify-between items-center w-full max-w-lg bg-white shadow-md p-4 rounded-lg">
      <h2 className="text-xl font-semibold">EzPay</h2>
      <button onClick={onMenuClick}>
        <FiMenu size={28} className="text-gray-700" />
      </button>
    </header>
  );
};

export default Navbar;
