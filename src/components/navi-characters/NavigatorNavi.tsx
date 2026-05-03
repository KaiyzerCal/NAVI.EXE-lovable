import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const NavigatorNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="nav-body" x1="68" y1="95" x2="132" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e40af" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="nav-coat" x1="70" y1="110" x2="130" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1d4ed8" />
            <stop offset="1" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="38" ry="9" fill="#0f172a" opacity="0.3" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Captain coat */}
          <rect x="73" y="115" width="54" height="52" rx="8" fill="url(#nav-coat)" />
          {/* Gold trim */}
          <line x1="100" y1="115" x2="100" y2="167" stroke="#fbbf24" strokeWidth="2" />
          <rect x="73" y="115" width="54" height="8" rx="0" fill="#1d4ed8" />
          <line x1="73" y1="123" x2="127" y2="123" stroke="#fbbf24" strokeWidth="1.5" />
          {/* Buttons */}
          <circle cx="97" cy="130" r="2.5" fill="#fbbf24" />
          <circle cx="97" cy="142" r="2.5" fill="#fbbf24" />
          <circle cx="97" cy="154" r="2.5" fill="#fbbf24" />
          {/* Epaulettes */}
          <rect x="62" y="115" width="16" height="8" rx="3" fill="#1d4ed8" />
          <rect x="122" y="115" width="16" height="8" rx="3" fill="#1d4ed8" />
          <line x1="62" y1="117" x2="78" y2="117" stroke="#fbbf24" strokeWidth="1" />
          <line x1="122" y1="117" x2="138" y2="117" stroke="#fbbf24" strokeWidth="1" />
          {/* Arms */}
          <rect x="60" y="122" width="13" height="30" rx="5" fill="#1e40af" />
          <rect x="127" y="122" width="13" height="30" rx="5" fill="#1e40af" />
          {/* Compass in hand */}
          <motion.circle cx="143" cy="146" r="7" fill="#fbbf24" opacity="0.9"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '143px', originY: '146px' }} />
          <line x1="143" y1="140" x2="143" y2="146" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="143" y1="146" x2="148" y2="146" stroke="#374151" strokeWidth="1" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="21" fill="#1e40af" />
          {/* Captain hat */}
          <rect x="82" y="81" width="36" height="7" rx="2" fill="#1e3a8a" />
          <rect x="85" y="68" width="30" height="15" rx="3" fill="#1e3a8a" />
          <rect x="84" y="74" width="32" height="4" rx="1" fill="#fbbf24" />
          {/* Hat badge */}
          <circle cx="100" cy="71" r="4" fill="#fbbf24" />
          <path d="M97 71 L100 67 L103 71 L100 74 Z" fill="#1e3a8a" />
          {/* Eyes */}
          <motion.ellipse cx="92" cy="100" rx="5" ry="4.5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.ellipse cx="108" cy="100" rx="5" ry="4.5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="92" cy="99" r="2.5" fill="#0f172a" />
          <circle cx="108" cy="99" r="2.5" fill="#0f172a" />
          {/* Mustache */}
          <path d="M92 108 Q97 111 100 108 Q103 111 108 108" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="163" width="12" height="22" rx="4" fill="#1e3a8a" />
        <rect x="104" y="163" width="12" height="22" rx="4" fill="#1e3a8a" />
      </motion.svg>
    </div>
  );
};

export default NavigatorNavi;
