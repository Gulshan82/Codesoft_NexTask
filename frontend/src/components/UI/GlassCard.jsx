import React from 'react';

const GlassCard = ({ children, className = '', onClick, hover = false }) => {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-md rounded-2xl border transition-[background-color,border-color,box-shadow,transform] duration-200
        ${
          hover
            ? 'hover:translate-y-[-4px] hover:shadow-xl dark:hover:shadow-violet-950/20'
            : 'shadow-md'
        }
        ${
          onClick ? 'cursor-pointer' : ''
        }
        /* Dark Mode: semi-transparent slate + subtle purple/indigo glow borders */
        dark:bg-slate-900/60 dark:border-slate-800/80 dark:shadow-slate-950/40
        /* Light Mode: semi-transparent white + subtle gray borders */
        bg-white/70 border-slate-200/80 shadow-slate-200/50
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
