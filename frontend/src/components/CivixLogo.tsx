import React from 'react';

interface CitySkylineIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function CitySkylineIcon({ size = 20, className = '', ...props }: CitySkylineIconProps) {
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
      <path d="M3 20V11H8V20H3Z" fill="currentColor" />
      <path d="M9.5 20V5H15.5V20H9.5Z" fill="currentColor" />
      <path d="M17 20V9H21V20H17Z" fill="currentColor" />
      <path d="M4.75 13H6.25V14.5H4.75V13ZM11.25 7.5H12.75V9H11.25V7.5ZM11.25 11H12.75V12.5H11.25V11ZM11.25 14.5H12.75V16H11.25V14.5ZM17.75 11H19.25V12.5H17.75V11ZM17.75 14.5H19.25V16H17.75V14.5Z" fill="#A3E635" />
      <path d="M2 20H22V22H2V20Z" fill="#ECFCCB" />
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
        className={`flex ${tileDimensions} items-center justify-center rounded-lg bg-gradient-to-br from-civix-forest via-civix-primary to-civix-success shadow-sm ring-1 ring-civix-emerald/30 text-white`}
      >
        <CitySkylineIcon size={iconSizes} className="drop-shadow-sm" />
      </div>
      {showText && <span className="font-extrabold tracking-tight">CIVIX</span>}
    </div>
  );
}
