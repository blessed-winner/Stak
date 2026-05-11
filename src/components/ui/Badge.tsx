import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'progress' | 'approval' | 'success' | 'archived' | 'warning';
  className?: string;
}

export function Badge({ children, variant = 'progress', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
        (variant === 'progress' || variant === 'warning') && 'bg-warning/10 text-warning',
        variant === 'approval' && 'bg-brand-primary text-text-inverse',
        variant === 'success' && 'bg-success/10 text-success',
        variant === 'archived' && 'bg-surface-hover text-text-tertiary',
        className
      )}
    >
      {children}
    </span>
  );
}
