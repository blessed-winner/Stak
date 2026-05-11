import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  id?: string;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  children, 
  className, 
  onClick,
  type = 'button',
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-semibold transition-stak focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed',
        size === 'sm' && 'px-4 py-2 text-xs',
        size === 'md' && 'px-6 py-2.5 text-sm',
        size === 'lg' && 'px-8 py-3 text-base',
        variant === 'primary' && 'bg-black text-white hover:bg-black/90 active:scale-[0.98]',
        variant === 'ghost' && 'bg-transparent border border-black/10 text-black hover:bg-black/5 active:scale-[0.98]',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="uppercase tracking-[0.1em] text-[10px]">Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
