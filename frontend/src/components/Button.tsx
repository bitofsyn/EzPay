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
            className={`px-6 py-2 text-white rounded-lg transition ${className} bg-primary hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
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
