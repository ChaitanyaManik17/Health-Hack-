import React from 'react';

const ShieldLogo = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Shield */}
      <path
        d="M50 5 L90 20 L90 50 Q90 80 50 95 Q10 80 10 50 L10 20 Z"
        fill="url(#shieldGradient)"
        stroke="#1474bc"
        strokeWidth="2"
      />
      
      {/* Inner Shield Detail */}
      <path
        d="M50 15 L80 27 L80 50 Q80 72 50 85 Q20 72 20 50 L20 27 Z"
        fill="#ffffff"
        fillOpacity="0.15"
      />
      
      {/* Medical Cross */}
      <rect x="46" y="30" width="8" height="40" fill="#ffffff" rx="2" />
      <rect x="30" y="46" width="40" height="8" fill="#ffffff" rx="2" />
      
      {/* Eagle Wings (simplified) */}
      <path
        d="M35 45 Q30 40 25 45 L30 50 Z"
        fill="#ffffff"
        fillOpacity="0.8"
      />
      <path
        d="M65 45 Q70 40 75 45 L70 50 Z"
        fill="#ffffff"
        fillOpacity="0.8"
      />
      
      {/* S.H.I.E.L.D. Text */}
      <text
        x="50"
        y="92"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="8"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
      >
        SHIELD
      </text>
      
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1991eb" />
          <stop offset="100%" stopColor="#0f578d" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ShieldLogo;
