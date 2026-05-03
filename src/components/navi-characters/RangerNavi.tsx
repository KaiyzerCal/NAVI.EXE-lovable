import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const RangerNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="rn-body" x1="68" y1="95" x2="132" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#16a34a" />
            <stop offset="1" stopColor="#14532d" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="36" ry="9" fill="#052e16" opacity="0.3" />
        {/* Body */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Quiver on back */}
          <rect x="122" y="105" width="10" height="35" rx="4" fill="#92400e" />
          <line x1="122" y1="112" x2="132" y2="112" stroke="#d97706" strokeWidth="1.5" />
          {/* Arrow shafts in quiver */}
          <line x1="125" y1="106" x2="127" y2="98" stroke="#d97706" strokeWidth="1.5" />
          <line x1="128" y1="107" x2="130" y2="99" stroke="#86efac" strokeWidth="1.5" />
          {/* Body */}
          <rect x="76" y="115" width="48" height="50" rx="8" fill="url(#rn-body)" />
          {/* Vest detail */}
          <path d="M90 118 L100 130 L110 118" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Belt + ammo pouch */}
          <rect x="76" y="158" width="48" height="7" rx="3" fill="#78350f" />
          <rect x="84" y="157" width="12" height="10" rx="2" fill="#92400e" />
          {/* Arms */}
          <rect x="60" y="115" width="12" height="36" rx="5" fill="#15803d" />
          <rect x="128" y="115" width="12" height="36" rx="5" fill="#15803d" />
          {/* Bow */}
          <motion.path d="M52 100 Q44 120 52 145" stroke="#92400e" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M52 100 Q44 120 52 145', 'M52 100 Q42 120 52 145', 'M52 100 Q44 120 52 145'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.line x1="52" y1="100" x2="52" y2="145" stroke="#d97706" strokeWidth="1" strokeDasharray="2,4"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#16a34a" />
          {/* Hood */}
          <path d="M80 96 Q80 72 100 68 Q120 72 120 96 Q108 88 100 89 Q92 88 80 96 Z" fill="#15803d" />
          {/* Eyes */}
          <motion.ellipse cx="92" cy="98" rx="5" ry="4.5" fill="#bbf7d0"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.ellipse cx="108" cy="98" rx="5" ry="4.5" fill="#bbf7d0"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="92" cy="97" r="2.5" fill="#052e16" />
          <circle cx="108" cy="97" r="2.5" fill="#052e16" />
          <circle cx="93" cy="96" r="1" fill="white" />
          <circle cx="109" cy="96" r="1" fill="white" />
          {/* Mouth */}
          <path d="M94 107 Q100 110 106 107" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="83" y="161" width="12" height="22" rx="4" fill="#166534" />
        <rect x="105" y="161" width="12" height="22" rx="4" fill="#166534" />
      </motion.svg>
    </div>
  );
};

export default RangerNavi;
