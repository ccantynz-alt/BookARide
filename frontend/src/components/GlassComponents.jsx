import React from 'react';
import { cn } from '../lib/utils';

// Glassmorphism Card Component
export const GlassCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  glow = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-white/10 backdrop-blur-xl border border-white/20',
    light: 'bg-white/80 backdrop-blur-xl border border-white/40',
    dark: 'bg-black/40 backdrop-blur-xl border border-white/10',
    gold: 'bg-gold/10 backdrop-blur-xl border border-gold/30',
    premium: 'bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border border-white/20',
  };

  return (
    <div
      className={cn(
        'rounded-2xl shadow-xl',
        variants[variant],
        hover && 'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-white/30',
        glow && 'shadow-[0_0_30px_rgba(212,175,55,0.3)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Glassmorphism Button Component
export const GlassButton = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  ...props 
}) => {
  const variants = {
    default: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
    gold: 'bg-gold/80 backdrop-blur-md border border-gold text-black hover:bg-gold',
    outline: 'bg-transparent backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/10',
    dark: 'bg-black/50 backdrop-blur-md border border-white/10 text-white hover:bg-black/70',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={cn(
        'rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Glassmorphism Input Component
export const GlassInput = ({ 
  className = '', 
  ...props 
}) => {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 rounded-xl',
        'bg-white/10 backdrop-blur-md border border-white/20',
        'text-white placeholder-white/50',
        'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50',
        'transition-all duration-300',
        className
      )}
      {...props}
    />
  );
};

// Glassmorphism Badge Component
export const GlassBadge = ({ 
  children, 
  className = '', 
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white/20 backdrop-blur-sm border border-white/30 text-white',
    gold: 'bg-gold/20 backdrop-blur-sm border border-gold/40 text-gold',
    success: 'bg-green-500/20 backdrop-blur-sm border border-green-500/40 text-green-400',
    error: 'bg-red-500/20 backdrop-blur-sm border border-red-500/40 text-red-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default GlassCard;
