import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-input transition-all duration-200 cursor-pointer border-none';

  const variantStyles = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white text-text-primary border-[1.5px] border-gray-border hover:bg-gray-bg hover:border-gray-300',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-nav',
    md: 'px-6 py-3 text-body',
    lg: 'px-8 py-4 text-base',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-none';

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || isLoading ? disabledStyles : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {rightIcon && !isLoading && rightIcon}
    </button>
  );
}
