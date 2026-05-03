import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const MagnetarNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="mg-body" x1="65" y1="88" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef4444" />
            <stop offset="0.5" stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        {/* Magnetic field lines */}
        <motion.ellipse cx="100" cy="128" rx="58" ry="38" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.2"
          animate={animated ? { rx: [58, 65, 58], opacity: [0.2, 0.4, 0.2] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="100" cy="128" rx="44" ry="28" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.3"
          animate={animated ? { rx: [44, 52, 44], opacity: [0.3, 0.5, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        {/* Metal particles orbiting */}
        <motion.circle cx="100" cy="75" r="4" fill="#94a3b8"
          animate={animated ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '128px' }} />
        <motion.circle cx="100" cy="75" r="3" fill="#64748b"
          animate={animated ? { rotate: [0, -360] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '128px' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#0f172a" opacity="0.4" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Horseshoe magnet arms */}
          <motion.path d="M58 112 Q48 112 48 128 Q48 144 58 144" stroke="#ef4444" strokeWidth="10" fill="none" strokeLinecap="round"
            animate={animated ? { rotate: [0, -3, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '53px', originY: '128px' }} />
          <line x1="58" y1="107" x2="58" y2="112" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
          <line x1="58" y1="144" x2="58" y2="149" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" />
          <motion.path d="M142 112 Q152 112 152 128 Q152 144 142 144" stroke="#3b82f6" strokeWidth="10" fill="none" strokeLinecap="round"
            animate={animated ? { rotate: [0, 3, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '147px', originY: '128px' }} />
          <line x1="142" y1="107" x2="142" y2="112" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
          <line x1="142" y1="144" x2="142" y2="149" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" />
          {/* Body */}
          <ellipse cx="100" cy="138" rx="32" ry="26" fill="url(#mg-body)" />
          {/* Magnetic core */}
          <motion.circle cx="100" cy="138" r="10" fill="none" stroke="#ef4444" strokeWidth="2"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '138px' }} />
          <circle cx="100" cy="138" r="5" fill="#1e293b" />
          <motion.circle cx="100" cy="138" r="3" fill="#ef4444"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="102" rx="24" ry="22" fill="#1e293b" />
          {/* N/S poles on head */}
          <rect x="80" y="92" width="16" height="20" rx="4" fill="#ef4444" />
          <text x="83" y="107" fontSize="10" fill="white" fontFamily="monospace" fontWeight="bold">N</text>
          <rect x="104" y="92" width="16" height="20" rx="4" fill="#3b82f6" />
          <text x="107" y="107" fontSize="10" fill="white" fontFamily="monospace" fontWeight="bold">S</text>
          {/* Eyes */}
          <motion.circle cx="88" cy="96" r="4.5" fill="#fbbf24"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="112" cy="96" r="4.5" fill="#fbbf24"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="88" cy="95" r="2" fill="#0f172a" />
          <circle cx="112" cy="95" r="2" fill="#0f172a" />
          {/* Mouth */}
          <path d="M92 114 Q100 118 108 114" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="160" width="12" height="20" rx="4" fill="#0f172a" />
        <rect x="104" y="160" width="12" height="20" rx="4" fill="#0f172a" />
      </motion.svg>
    </div>
  );
};

export default MagnetarNavi;
