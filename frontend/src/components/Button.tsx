import React from 'react';

interface ButtonProps {
    text: string;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
}

const Button: React.FC<ButtonProps> = ({
    text,
    onClick,
    className = '',
    type = 'button',
    disabled = false,
    ariaLabel,
    ariaDescribedBy
}) => {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 bg-slate-900 hover:bg-slate-800 ${className}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel || text}
            aria-describedby={ariaDescribedBy}
            aria-disabled={disabled}
        >
            {text}
        </button>
    );
};

export default Button;
