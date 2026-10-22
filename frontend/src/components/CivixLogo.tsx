import React from 'react';

interface MonasIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  monochrome?: boolean;
}

export function MonasIcon({ size = 20, monochrome = false, className = '', ...props }: MonasIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Lidah Api Kemerdekaan (Flame) */}
      <path
        d="M12 2C12.85 3.35 13.55 4.55 13.05 5.45C12.65 6.15 12 6.35 12 6.35C12 6.35 11.35 6.15 10.95 5.45C10.45 4.55 11.15 3.35 12 2Z"
        fill={monochrome ? 'currentColor' : '#FACC15'}
      />
      {/* Tiang Obelisk */}
      <path
        d="M11.15 7H12.85L13.4 13.8H10.6L11.15 7Z"
        fill="currentColor"
      />
      {/* Cawan (Observation Saucer) */}
      <path
        d="M7.2 14.3H16.8L15.6 16.7H8.4L7.2 14.3Z"
        fill="currentColor"
      />
      {/* Badan Bawah / Museum Pedestal */}
      <path
        d="M8.8 17.2H15.2V19H8.8V17.2Z"
        fill="currentColor"
      />
      {/* Pelataran Dasar (Foundation base) */}
      <path
        d="M4.5 19.6H19.5V21.6H4.5V19.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface CivixLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function CivixLogo({ size = 'md', showText = true, className = '' }: CivixLogoProps) {
  const tileDimensions = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  }[size];

  const iconSizes = {
    sm: 20,
    md: 23,
    lg: 28,
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex ${tileDimensions} items-center justify-center rounded-lg bg-gradient-to-br from-lime-600 via-lime-500 to-lime-400 shadow-sm ring-1 ring-lime-700/20 text-white`}
      >
        <MonasIcon size={iconSizes} className="drop-shadow-sm" />
      </div>
      {showText && <span className="font-extrabold tracking-tight">CIVIX</span>}
    </div>
  );
}
