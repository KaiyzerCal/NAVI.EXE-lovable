import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const AlchemistNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="al-robe" x1="68" y1="100" x2="132" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" />
            <stop offset="1" stopColor="#2d1b69" />
          </linearGradient>
          <radialGradient id="al-potion" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="36" ry="9" fill="#1e1b4b" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -2.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Robe */}
          <path d="M74 118 Q68 155 72 172 Q86 178 100 176 Q114 178 128 172 Q132 155 126 118 Z" fill="url(#al-robe)" />
          {/* Robe trim */}
          <path d="M74 118 L74 122 Q86 124 100 123 Q114 124 126 122 L126 118" fill="#6d28d9" />
          {/* Arcane symbols on robe */}
          <text x="92" y="148" fontSize="12" fill="#a78bfa" opacity="0.7" fontFamily="serif">✦</text>
          <text x="104" y="160" fontSize="10" fill="#c4b5fd" opacity="0.5" fontFamily="serif">⬡</text>
          {/* Body under robe (chest) */}
          <rect x="80" y="112" width="40" height="22" rx="6" fill="#5b21b6" />
          {/* Arms */}
          <rect x="62" y="112" width="14" height="32" rx="6" fill="#7c3aed" />
          <rect x="124" y="112" width="14" height="32" rx="6" fill="#7c3aed" />
          {/* Potion flask in hand */}
          <motion.g animate={animated ? { rotate: [0, -8, 4, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '58px', originY: '135px' }}>
            <rect x="52" y="128" width="12" height="18" rx="3" fill="#1f2937" />
            <ellipse cx="58" cy="128" rx="8" ry="5" fill="#374151" />
            <rect x="56" y="121" width="4" height="8" rx="2" fill="#4b5563" />
            <motion.ellipse cx="58" cy="135" rx="5" ry="7" fill="url(#al-potion)" opacity="0.85"
              animate={animated ? { opacity: [0.85, 1, 0.85] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
            {/* Bubbles */}
            <motion.circle cx="56" cy="134" r="1.5" fill="#bbf7d0"
              animate={animated ? { cy: [134, 129, 134], opacity: [1, 0, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="21" fill="#8b5cf6" />
          {/* Wizard hat */}
          <path d="M82 90 L100 52 L118 90 Z" fill="#4c1d95" />
          <rect x="80" y="88" width="40" height="5" rx="2" fill="#6d28d9" />
          {/* Hat star */}
          <motion.text x="95" y="78" fontSize="10" fill="#fde047" fontFamily="serif"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>★</motion.text>
          {/* Eyes */}
          <motion.circle cx="92" cy="101" r="5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.circle cx="108" cy="101" r="5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="92" cy="100" r="2.5" fill="#1e1b4b" />
          <circle cx="108" cy="100" r="2.5" fill="#1e1b4b" />
          {/* Beard */}
          <path d="M89 108 Q100 116 111 108 Q108 118 100 120 Q92 118 89 108 Z" fill="#a78bfa" opacity="0.5" />
          {/* Floating orb */}
          <motion.circle cx="138" cy="102" r="8" fill="#86efac" opacity="0.7"
            animate={animated ? { y: [0, -5, 0], scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="138" cy="102" r="4" fill="#4ade80" opacity="0.8" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="168" width="11" height="20" rx="4" fill="#4c1d95" />
        <rect x="104" y="168" width="11" height="20" rx="4" fill="#4c1d95" />
      </motion.svg>
    </div>
  );
};

export default AlchemistNavi;
