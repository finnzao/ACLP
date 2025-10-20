import React from 'react';

interface InputGroupProps {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function InputGroup({ label, type = 'text', value, onChange, placeholder, error, className = '' }: InputGroupProps) {
  return (
    <div className={className}>
      {label && <label className="block font-medium mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}