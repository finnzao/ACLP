import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'alert' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const base = 'py-2 px-4 rounded font-medium transition';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-white text-primary border border-primary hover:bg-primary/10',
    alert: 'bg-warning text-text-base hover:opacity-90',
    danger: 'bg-danger text-white hover:opacity-90',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};