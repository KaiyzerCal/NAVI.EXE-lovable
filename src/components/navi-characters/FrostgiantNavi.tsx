import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const FrostgiantNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="fg-body" x1="55" y1="80" x2="145" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e0f2fe" />
            <stop offset="0.5" stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
          <linearGradient id="fg-ice" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#bae6fd" />
            <stop offset="1" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        {/* Frost breath particles */}
        <motion.ellipse cx="100" cy="128" rx="54" ry="46" fill="#bae6fd" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="182" rx="52" ry="11" fill="#0c4a6e" opacity="0.35" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -1.5, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Ice crystal decorations */}
          <motion.polygon points="62,112 58,100 54,112 58,124" fill="#bae6fd" opacity="0.7"
            animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="138,112 142,100 146,112 142,124" fill="#bae6fd" opacity="0.7"
            animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="148" rx="50" ry="34" fill="url(#fg-body)" />
          {/* Ice armor plates */}
          <path d="M76 130 Q80 122 84 130 Q80 135 76 130" fill="#e0f2fe" opacity="0.7" />
          <path d="M100 126 Q104 118 108 126 Q104 131 100 126" fill="#e0f2fe" opacity="0.7" />
          <path d="M116 130 Q120 122 124 130 Q120 135 116 130" fill="#e0f2fe" opacity="0.7" />
          {/* Arms */}
          <motion.rect x="40" y="108" width="22" height="48" rx="9" fill="#7dd3fc"
            animate={animated ? { rotate: [0, -4, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '51px', originY: '108px' }} />
          <motion.rect x="138" y="108" width="22" height="48" rx="9" fill="#7dd3fc"
            animate={animated ? { rotate: [0, 4, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '149px', originY: '108px' }} />
          {/* Fists / ice clubs */}
          <ellipse cx="51" cy="160" rx="14" ry="11" fill="#38bdf8" />
          <ellipse cx="149" cy="160" rx="14" ry="11" fill="#38bdf8" />
          {/* Ice spikes on fists */}
          <polygon points="42,152 51,140 60,152" fill="#e0f2fe" opacity="0.9" />
          <polygon points="140,152 149,140 158,152" fill="#e0f2fe" opacity="0.9" />
          {/* Head */}
          <ellipse cx="100" cy="102" rx="32" ry="28" fill="#7dd3fc" />
          {/* Ice crown */}
          <motion.path d="M75 90 L80 72 L87 88 L96 68 L105 88 L112 72 L117 88 L125 88" stroke="#e0f2fe" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="88" cy="100" rx="8" ry="7" fill="#e0f2fe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 6 }} />
          <motion.ellipse cx="112" cy="100" rx="8" ry="7" fill="#e0f2fe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 6 }} />
          <circle cx="88" cy="99" r="4" fill="#0369a1" />
          <circle cx="112" cy="99" r="4" fill="#0369a1" />
          <circle cx="86" cy="97" r="1.5" fill="white" />
          <circle cx="110" cy="97" r="1.5" fill="white" />
          {/* Nose */}
          <ellipse cx="100" cy="110" rx="5" ry="4" fill="#38bdf8" />
          {/* Frosty breath */}
          <motion.path d="M90 118 Q100 122 110 118" stroke="#bae6fd" strokeWidth="2" fill="none" opacity="0.8" strokeLinecap="round"
            animate={animated ? { opacity: [0.8, 0.3, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="76" y="178" width="18" height="14" rx="5" fill="#0369a1" />
        <rect x="106" y="178" width="18" height="14" rx="5" fill="#0369a1" />
      </motion.svg>
    </div>
  );
};

export default FrostgiantNavi;
