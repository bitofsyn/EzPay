const Button = ({ text, onClick, className }) => {
    return (
        <button
            className={`px-6 py-2 text-white rounded-lg transition ${className} bg-primary hover:bg-secondary`}
            onClick={onClick}
        >
            {text}
        </button>
    );
};

export default Button;
