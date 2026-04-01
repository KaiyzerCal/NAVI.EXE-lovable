import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GaleforceNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="gf-body" x1="70" y1="88" x2="130" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#bae6fd" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        {/* Wind swirls */}
        <motion.path d="M42 110 Q55 100 68 108 Q55 115 42 110" stroke="#bae6fd" strokeWidth="2" fill="none" opacity="0.5"
          animate={animated ? { opacity: [0.5, 0, 0.5], x: [0, 15, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.path d="M38 125 Q50 118 62 124 Q50 130 38 125" stroke="#7dd3fc" strokeWidth="1.5" fill="none" opacity="0.4"
          animate={animated ? { opacity: [0.4, 0, 0.4], x: [0, 12, 0] } : {}}
          transition={{ duration: 1.8, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
        <motion.path d="M132 108 Q145 100 158 108 Q145 115 132 108" stroke="#bae6fd" strokeWidth="2" fill="none" opacity="0.5"
          animate={animated ? { opacity: [0.5, 0, 0.5], x: [0, -15, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="30" ry="7" fill="#0c4a6e" opacity="0.2" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Wind scarf/cloak */}
          <motion.path d="M72 120 Q55 130 45 145 Q60 138 70 128 Q80 118 88 122" fill="#bae6fd" opacity="0.5"
            animate={animated ? { d: ['M72 120 Q55 130 45 145 Q60 138 70 128 Q80 118 88 122', 'M72 120 Q52 132 42 148 Q58 140 68 130 Q80 118 88 122', 'M72 120 Q55 130 45 145 Q60 138 70 128 Q80 118 88 122'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="28" ry="24" fill="url(#gf-body)" />
          {/* Wind spiral on chest */}
          <motion.path d="M90 124 Q100 120 110 124 Q106 130 100 132 Q94 130 90 124" fill="#e0f2fe" opacity="0.4"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '127px' }} />
          {/* Arms */}
          <motion.rect x="64" y="118" width="12" height="28" rx="5" fill="#0ea5e9"
            animate={animated ? { rotate: [0, -8, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '70px', originY: '118px' }} />
          <motion.rect x="124" y="118" width="12" height="28" rx="5" fill="#0ea5e9"
            animate={animated ? { rotate: [0, 8, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '130px', originY: '118px' }} />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#38bdf8" />
          {/* Windswept hair */}
          <motion.path d="M82 88 Q78 72 90 66 Q88 78 88 90" fill="#0ea5e9"
            animate={animated ? { d: ['M82 88 Q78 72 90 66 Q88 78 88 90', 'M82 88 Q75 70 88 64 Q87 77 88 90', 'M82 88 Q78 72 90 66 Q88 78 88 90'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M90 84 Q92 68 104 64 Q100 76 98 88" fill="#7dd3fc"
            animate={animated ? { d: ['M90 84 Q92 68 104 64 Q100 76 98 88', 'M90 84 Q90 66 102 62 Q99 75 98 88', 'M90 84 Q92 68 104 64 Q100 76 98 88'] } : {}}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.path d="M100 82 Q106 66 118 64 Q112 76 108 88" fill="#0ea5e9"
            animate={animated ? { d: ['M100 82 Q106 66 118 64 Q112 76 108 88', 'M100 82 Q104 64 116 62 Q111 75 108 88', 'M100 82 Q106 66 118 64 Q112 76 108 88'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="91" cy="100" rx="5" ry="4.5" fill="#e0f2fe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.ellipse cx="109" cy="100" rx="5" ry="4.5" fill="#e0f2fe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="91" cy="99" r="2.2" fill="#0c4a6e" />
          <circle cx="109" cy="99" r="2.2" fill="#0c4a6e" />
          {/* Mouth */}
          <path d="M94 108 Q100 112 106 108" stroke="#e0f2fe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="150" width="10" height="22" rx="4" fill="#0369a1" />
        <rect x="104" y="150" width="10" height="22" rx="4" fill="#0369a1" />
      </motion.svg>
    </div>
  );
};

export default GaleforceNavi;
