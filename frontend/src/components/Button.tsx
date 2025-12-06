import React from 'react';

interface ButtonProps {
    text: string;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    text,
    onClick,
    className = '',
    type = 'button',
    disabled = false
}) => {
    return (
        <button
            type={type}
            className={`px-6 py-2 text-white rounded-lg transition ${className} bg-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed`}
            onClick={onClick}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default Button;
