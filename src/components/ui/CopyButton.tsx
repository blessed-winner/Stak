import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  variant?: 'primary' | 'ghost';
  className?: string;
}

export function CopyButton({ value, label = 'Copy link', variant = 'primary', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus:outline-none',
        variant === 'primary' && 'bg-brand-primary text-text-inverse hover:brightness-110',
        variant === 'ghost' && 'bg-transparent border border-border-default text-text-primary hover:bg-surface-hover',
        className
      )}
    >
      {copied ? (
        <>
          <Check size={14} className="text-success" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
