import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const SoulbladeNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="sb-body" x1="65" y1="88" x2="135" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1c1917" />
            <stop offset="1" stopColor="#0c0a09" />
          </linearGradient>
          <linearGradient id="sb-blade" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#e2e8f0" />
            <stop offset="0.5" stopColor="#94a3b8" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0.8" />
          </linearGradient>
          <radialGradient id="sb-soul" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Soul aura */}
        <motion.ellipse cx="100" cy="118" rx="52" ry="48" fill="url(#sb-soul)"
          animate={animated ? { opacity: [0.6, 1, 0.6], scaleX: [1, 1.04, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#0c0a09" opacity="0.5" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Soul cloak */}
          <motion.path d="M70 120 Q60 152 68 170 Q84 178 100 176 Q116 178 132 170 Q140 152 130 120" fill="#1c1917" opacity="0.9"
            animate={animated ? { d: ['M70 120 Q60 152 68 170 Q84 178 100 176 Q116 178 132 170 Q140 152 130 120', 'M70 120 Q58 156 66 173 Q82 180 100 178 Q118 180 134 173 Q142 156 130 120', 'M70 120 Q60 152 68 170 Q84 178 100 176 Q116 178 132 170 Q140 152 130 120'] } : {}}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="30" ry="26" fill="url(#sb-body)" />
          {/* Soul emblem */}
          <motion.path d="M94 122 Q100 116 106 122 Q110 128 106 134 Q100 140 94 134 Q90 128 94 122 Z" fill="none" stroke="#a78bfa" strokeWidth="2"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="100" cy="128" r="4" fill="#7c3aed"
            animate={animated ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Blade arm */}
          <motion.g animate={animated ? { rotate: [0, -5, 2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '138px', originY: '140px' }}>
            <rect x="130" y="115" width="6" height="50" rx="3" fill="url(#sb-blade)" />
            <polygon points="133,115 130,108 136,108" fill="#e2e8f0" />
            <rect x="127" y="155" width="12" height="6" rx="2" fill="#374151" />
            {/* Soul flame on blade */}
            <motion.path d="M133 115 Q129 108 133 102 Q137 108 133 115" fill="#a78bfa" opacity="0.7"
              animate={animated ? { d: ['M133 115 Q129 108 133 102 Q137 108 133 115', 'M133 115 Q128 106 133 100 Q138 106 133 115', 'M133 115 Q129 108 133 102 Q137 108 133 115'] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.g>
          {/* Arms */}
          <rect x="62" y="118" width="12" height="30" rx="5" fill="#292524" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="23" ry="21" fill="#292524" />
          {/* Tattered hood */}
          <path d="M80 96 Q78 78 100 72 Q122 78 120 96 Q108 88 100 88 Q92 88 80 96 Z" fill="#1c1917" />
          {/* Glowing eyes */}
          <motion.ellipse cx="90" cy="98" rx="6" ry="5" fill="#a78bfa"
            animate={animated ? { opacity: [1, 0.4, 1], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="110" cy="98" rx="6" ry="5" fill="#a78bfa"
            animate={animated ? { opacity: [1, 0.4, 1], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="98" r="2.5" fill="#1c1917" />
          <circle cx="110" cy="98" r="2.5" fill="#1c1917" />
          {/* Haunting mouth */}
          <path d="M90 110 Q100 115 110 110" stroke="#a78bfa" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Soul wisps */}
          <motion.path d="M55 112 Q50 104 55 96 Q58 104 55 112" fill="#7c3aed" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5], y: [0, -4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="168" width="12" height="20" rx="4" fill="#1c1917" />
        <rect x="104" y="168" width="12" height="20" rx="4" fill="#1c1917" />
      </motion.svg>
    </div>
  );
};

export default SoulbladeNavi;
