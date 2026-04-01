import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const WarriorNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="wr-armor" x1="65" y1="90" x2="135" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef4444" />
            <stop offset="1" stopColor="#7f1d1d" />
          </linearGradient>
          <linearGradient id="wr-metal" x1="65" y1="90" x2="135" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d1d5db" />
            <stop offset="1" stopColor="#374151" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="44" ry="10" fill="#450a0a" opacity="0.3" />
        {/* Body */}
        <motion.g animate={animated ? { y: [0, -1.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Pauldrons (shoulder guards) */}
          <motion.ellipse cx="64" cy="118" rx="16" ry="12" fill="url(#wr-armor)"
            animate={animated ? { rotate: [0, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '64px', originY: '118px' }} />
          <motion.ellipse cx="136" cy="118" rx="16" ry="12" fill="url(#wr-armor)"
            animate={animated ? { rotate: [0, 5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '136px', originY: '118px' }} />
          {/* Chest plate */}
          <rect x="74" y="115" width="52" height="50" rx="8" fill="url(#wr-armor)" />
          {/* Chest emblem */}
          <path d="M94 130 L100 122 L106 130 L100 138 Z" fill="#fca5a5" opacity="0.8" />
          {/* Belt */}
          <rect x="74" y="160" width="52" height="8" rx="3" fill="#374151" />
          {/* Arms */}
          <rect x="56" y="126" width="14" height="32" rx="6" fill="#b91c1c" />
          <rect x="130" y="126" width="14" height="32" rx="6" fill="#b91c1c" />
          {/* Gauntlets */}
          <rect x="55" y="150" width="16" height="12" rx="4" fill="url(#wr-metal)" />
          <rect x="129" y="150" width="16" height="12" rx="4" fill="url(#wr-metal)" />
          {/* Sword */}
          <motion.g animate={animated ? { rotate: [0, -8, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '145px', originY: '155px' }}>
            <rect x="143" y="100" width="4" height="55" rx="1" fill="#d1d5db" />
            <rect x="138" y="150" width="14" height="4" rx="1" fill="#9ca3af" />
            <rect x="143" y="154" width="4" height="10" rx="2" fill="#92400e" />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="100" rx="25" ry="22" fill="#b91c1c" />
          {/* Helmet crest */}
          <path d="M88 84 L100 68 L112 84" fill="#ef4444" />
          <rect x="96" y="68" width="8" height="16" rx="2" fill="#fca5a5" />
          {/* Visor */}
          <rect x="82" y="94" width="36" height="10" rx="4" fill="#1f2937" />
          {/* Eyes */}
          <motion.rect x="84" y="96" width="13" height="6" rx="2" fill="#ef4444"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.rect x="103" y="96" width="13" height="6" rx="2" fill="#ef4444"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Chin guard */}
          <rect x="88" y="107" width="24" height="10" rx="4" fill="#991b1b" />
        </motion.g>
        {/* Legs / greaves */}
        <rect x="82" y="163" width="14" height="22" rx="5" fill="#7f1d1d" />
        <rect x="104" y="163" width="14" height="22" rx="5" fill="#7f1d1d" />
      </motion.svg>
    </div>
  );
};

export default WarriorNavi;
