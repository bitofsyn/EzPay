const Button = ({ text, onClick, className = "" }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg font-semibold transition ${className}`}
        >
            {text}
        </button>
    );
};

export default Button;
