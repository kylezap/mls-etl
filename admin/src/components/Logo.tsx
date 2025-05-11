import React from 'react'

export default function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className="flex items-center gap-2">
      <svg
        className={className}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mls-etl-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F46E5" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        {/* House base */}
        <path
          d="M20 8L8 18V32H32V18L20 8Z"
          fill="url(#mls-etl-gradient)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Door */}
        <rect x="18" y="22" width="4" height="10" rx="1" fill="white" fillOpacity="0.9" />
        {/* Windows */}
        <rect x="12" y="22" width="4" height="4" rx="1" fill="white" fillOpacity="0.8" />
        <rect x="24" y="22" width="4" height="4" rx="1" fill="white" fillOpacity="0.8" />
        {/* Roof */}
        <path
          d="M8 18L20 8L32 18"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent select-none">
        MLS-ETL
      </span>
    </span>
  )
} 