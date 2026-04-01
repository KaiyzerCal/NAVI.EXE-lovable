import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const DatastreamNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="ds-body" x1="70" y1="88" x2="130" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0d9488" />
            <stop offset="1" stopColor="#042f2e" />
          </linearGradient>
          <linearGradient id="ds-stream" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#5eead4" stopOpacity="0.8" />
            <stop offset="1" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Data stream particles */}
        {[0, 0.4, 0.8, 1.2].map((delay, i) => (
          <motion.rect key={i} x={78 + i * 14} y="50" width="4" height="20" rx="2" fill="#5eead4" opacity="0.6"
            animate={animated ? { y: [50, 80, 50], opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay, ease: 'easeOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#042f2e" opacity="0.4" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Data stream trails */}
          <motion.path d="M65 118 Q55 128 48 145 Q58 135 64 118" fill="url(#ds-stream)"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M135 118 Q145 128 152 145 Q142 135 136 118" fill="url(#ds-stream)"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="30" ry="26" fill="url(#ds-body)" />
          {/* Data bits pattern */}
          {['1', '0', '1', '1', '0', '1'].map((bit, i) => (
            <motion.text key={i} x={78 + (i % 3) * 12} y={122 + Math.floor(i / 3) * 12} fontSize="7" fill="#5eead4" fontFamily="monospace" opacity="0.7"
              animate={animated ? { opacity: [0.7, 0.2, 0.7] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}>{bit}</motion.text>
          ))}
          {/* Arms */}
          <motion.rect x="62" y="118" width="12" height="28" rx="5" fill="#0f766e"
            animate={animated ? { rotate: [0, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '68px', originY: '118px' }} />
          <motion.rect x="126" y="118" width="12" height="28" rx="5" fill="#0f766e"
            animate={animated ? { rotate: [0, 5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '132px', originY: '118px' }} />
          {/* Head */}
          <ellipse cx="100" cy="98" rx="22" ry="20" fill="#0d9488" />
          {/* Data head lines */}
          <motion.path d="M82 88 Q100 82 118 88" stroke="#5eead4" strokeWidth="1.5" fill="none"
            animate={animated ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M80 95 Q100 89 120 95" stroke="#5eead4" strokeWidth="1" fill="none"
            animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="98" r="5.5" fill="#5eead4"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="98" r="5.5" fill="#5eead4"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="97" r="2.5" fill="#042f2e" />
          <circle cx="109" cy="97" r="2.5" fill="#042f2e" />
          {/* Mouth - binary */}
          <motion.text x="88" y="110" fontSize="7" fill="#5eead4" fontFamily="monospace"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>10110</motion.text>
        </motion.g>
        {/* Legs */}
        <rect x="85" y="152" width="10" height="22" rx="4" fill="#0f766e" />
        <rect x="105" y="152" width="10" height="22" rx="4" fill="#0f766e" />
      </motion.svg>
    </div>
  );
};

export default DatastreamNavi;
