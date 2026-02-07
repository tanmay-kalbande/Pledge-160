import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-noir-base disabled:opacity-50 disabled:cursor-not-allowed rounded-lg active:scale-95";

  const variants = {
    // Gold background, Noir text. High contrast.
    primary: "bg-gold hover:bg-gold-dim text-noir-base focus:ring-gold shadow-[0_4px_12px_rgba(251,191,36,0.3)] hover:shadow-[0_4px_16px_rgba(251,191,36,0.4)]",

    // Transparent background, Gold border, Gold text.
    secondary: "bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-noir-base focus:ring-gold",

    // Red background for danger.
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-[0_4px_12px_rgba(220,38,38,0.2)]",

    // Subtle text button.
    ghost: "bg-transparent hover:bg-noir-surface text-zinc-500 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs tracking-wide",
    md: "px-6 py-3 text-sm tracking-wide",
    lg: "px-8 py-4 text-base tracking-wide"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};