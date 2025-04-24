import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nuage */}
      <path 
        d="M18 10C18 7.23858 15.7614 5 13 5C10.2386 5 8 7.23858 8 10C8 10.5523 7.55228 11 7 11C4.23858 11 2 13.2386 2 16C2 18.7614 4.23858 21 7 21H18C20.7614 21 23 18.7614 23 16C23 13.2386 20.7614 11 18 11C17.4477 11 17 10.5523 17 10Z"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Cerveau */}
      <path 
        d="M12 5C10.5 5 9 6.5 9 8V10C9 11.5 10.5 13 12 13C13.5 13 15 11.5 15 10V8C15 6.5 13.5 5 12 5Z"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M9 8V10C9 11.5 10.5 13 12 13C13.5 13 15 11.5 15 10V8"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M12 13V15"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 15H14"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 17H14"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
} 