import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export function SearchInput({
  className = '',
  onSearch,
  onChange,
  ...props
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onSearch?.(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
        <MagnifyingGlassIcon className="w-4 h-4" />
      </span>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-gray-border rounded-input text-nav font-sans bg-white transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={handleChange}
        {...props}
      />
    </div>
  );
}
