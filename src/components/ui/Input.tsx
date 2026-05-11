import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-bold text-black/60 mb-2 uppercase tracking-[0.1em]">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-[#F9F9F9] border border-black/5 rounded-sm px-4 py-3 text-sm text-black placeholder:text-[#BBB] focus:outline-none focus:border-black/20 transition-stak',
          error && 'border-[#FF4444]/50 focus:border-[#FF4444]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-2 text-[10px] font-bold text-[#FF4444] uppercase tracking-widest">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
