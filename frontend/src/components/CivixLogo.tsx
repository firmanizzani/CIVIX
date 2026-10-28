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
  const dimensions = {
    sm: 'h-8 w-6',
    md: 'h-9 w-7',
    lg: 'h-11 w-9',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg className={`${dimensions} shrink-0`} viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 1C6.82 1 1 6.61 1 13.53C1 22.3 14 35 14 35S27 22.3 27 13.53C27 6.61 21.18 1 14 1Z" fill="#008558" />
        <path d="M14 3C8.05 3 3.2 7.69 3.2 13.5C3.2 20.17 11.12 29.49 14 32.7V3Z" fill="#079B68" />
        <circle cx="14" cy="13" r="7.3" fill="white" />
        <circle cx="14" cy="12" r="3.3" fill="#008558" />
        <path d="M12.6 14H15.4V24.5L14 26L12.6 24.5V14Z" fill="#008558" />
      </svg>
      {showText && <span className="font-extrabold tracking-tight" style={{ color: '#07533e' }}>CIVIX</span>}
    </div>
  );
}
