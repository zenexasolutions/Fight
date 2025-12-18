
import React from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "" }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -z-10 text-red-600 animate-pulse opacity-50" style={{ transform: 'translate(2px, 1px)' }}>{text}</span>
      <span className="absolute top-0 left-0 -z-10 text-cyan-400 animate-pulse opacity-50" style={{ transform: 'translate(-2px, -1px)' }}>{text}</span>
    </div>
  );
};
