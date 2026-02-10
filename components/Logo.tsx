'use client';

export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      {/* Speedometer arc */}
      <path
        d="M6 28a16 16 0 0 1 28 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Needle */}
      <line
        x1="20" y1="28" x2="28" y2="14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="20" cy="28" r="2.5" fill="currentColor" />
      {/* Data dots on arc */}
      <circle cx="8" cy="22" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="11" cy="15" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="17" cy="10.5" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="23" cy="10.5" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="29" cy="15" r="1.5" fill="currentColor" opacity="0.9" />
      {/* Trend line through data dots */}
      <polyline
        points="8,22 11,15 17,10.5 23,10.5 29,15"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
