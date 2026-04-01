import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const PaladinNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="pl-armor" x1="65" y1="90" x2="135" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef9c3" />
            <stop offset="0.5" stopColor="#fbbf24" />
            <stop offset="1" stopColor="#92400e" />
          </linearGradient>
          <radialGradient id="pl-holy" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Holy aura */}
        <motion.ellipse cx="100" cy="110" rx="55" ry="50" fill="url(#pl-holy)"
          animate={animated ? { opacity: [0.5, 0.9, 0.5] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="42" ry="10" fill="#78350f" opacity="0.2" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Cape */}
          <motion.path d="M72 118 Q62 152 72 172 Q86 178 100 175 Q114 178 128 172 Q138 152 128 118" fill="#fbbf24" opacity="0.8"
            animate={animated ? { d: ['M72 118 Q62 152 72 172 Q86 178 100 175 Q114 178 128 172 Q138 152 128 118', 'M72 118 Q60 155 70 175 Q85 180 100 177 Q115 180 130 175 Q140 155 128 118', 'M72 118 Q62 152 72 172 Q86 178 100 175 Q114 178 128 172 Q138 152 128 118'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Chest */}
          <rect x="74" y="114" width="52" height="48" rx="8" fill="url(#pl-armor)" />
          {/* Holy cross emblem */}
          <rect x="97" y="122" width="6" height="22" rx="2" fill="#fef9c3" opacity="0.9" />
          <rect x="89" y="128" width="22" height="6" rx="2" fill="#fef9c3" opacity="0.9" />
          {/* Pauldrons */}
          <ellipse cx="65" cy="118" rx="14" ry="10" fill="#fbbf24" />
          <ellipse cx="135" cy="118" rx="14" ry="10" fill="#fbbf24" />
          {/* Shield */}
          <motion.path d="M52 120 Q44 135 52 155 Q60 165 68 155 Q76 135 68 120 Z" fill="#fbbf24"
            animate={animated ? { rotate: [0, -3, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '60px', originY: '137px' }} />
          <path d="M56 128 Q52 140 56 152 Q62 158 66 152 Q70 140 66 128 Z" fill="#92400e" opacity="0.5" />
          {/* Arms */}
          <rect x="128" y="122" width="13" height="30" rx="6" fill="#d97706" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="24" ry="22" fill="#fbbf24" />
          {/* Helmet wings */}
          <path d="M78 90 L68 78 L80 86" fill="#fef9c3" opacity="0.9" />
          <path d="M122 90 L132 78 L120 86" fill="#fef9c3" opacity="0.9" />
          {/* Visor */}
          <rect x="83" y="94" width="34" height="10" rx="4" fill="#92400e" />
          {/* Eye glows */}
          <motion.rect x="85" y="96" width="12" height="6" rx="2" fill="#fef08a"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.rect x="103" y="96" width="12" height="6" rx="2" fill="#fef08a"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Crown / halo */}
          <motion.ellipse cx="100" cy="79" rx="20" ry="5" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.8"
            animate={animated ? { opacity: [0.8, 0.3, 0.8] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="83" y="158" width="13" height="24" rx="5" fill="#d97706" />
        <rect x="104" y="158" width="13" height="24" rx="5" fill="#d97706" />
      </motion.svg>
    </div>
  );
};

export default PaladinNavi;
