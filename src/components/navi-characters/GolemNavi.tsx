import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GolemNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="gm-stone" x1="55" y1="80" x2="145" y2="185" gradientUnits="userSpaceOnUse">
            <stop stopColor="#78716c" />
            <stop offset="0.5" stopColor="#57534e" />
            <stop offset="1" stopColor="#292524" />
          </linearGradient>
          <radialGradient id="gm-rune" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
        </defs>
        {/* Shadow */}
        <motion.ellipse cx="100" cy="182" rx="52" ry="12" fill="#1c1917" opacity="0.45"
          animate={animated ? { scaleX: [1, 1.03, 1] } : {}}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Body */}
        <motion.g animate={animated ? { y: [0, -1, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Massive body */}
          <ellipse cx="100" cy="150" rx="50" ry="35" fill="url(#gm-stone)" />
          {/* Stone cracks */}
          <path d="M82 138 L86 148 L90 145 L88 155" stroke="#292524" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M110 140 L114 150 L112 153" stroke="#292524" strokeWidth="1.5" fill="none" opacity="0.6" />
          {/* Rune on chest */}
          <motion.circle cx="100" cy="148" r="10" fill="url(#gm-rune)" opacity="0.8"
            animate={animated ? { opacity: [0.8, 1, 0.8], r: [10, 11, 10] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M97 143 L100 138 L103 143 L107 141 L104 146 L107 151 L103 149 L100 154 L97 149 L93 151 L96 146 L93 141 Z" fill="#86efac" opacity="0.7"
            animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Massive arms */}
          <motion.rect x="38" y="110" width="24" height="50" rx="10" fill="#78716c"
            animate={animated ? { rotate: [0, -5, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '50px', originY: '110px' }} />
          <motion.rect x="138" y="110" width="24" height="50" rx="10" fill="#78716c"
            animate={animated ? { rotate: [0, 5, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '150px', originY: '110px' }} />
          {/* Fists */}
          <ellipse cx="50" cy="163" rx="14" ry="12" fill="#57534e" />
          <ellipse cx="150" cy="163" rx="14" ry="12" fill="#57534e" />
          {/* Head */}
          <ellipse cx="100" cy="105" rx="34" ry="30" fill="#78716c" />
          {/* Rock texture lines */}
          <path d="M78 98 Q86 94 94 98" stroke="#57534e" strokeWidth="2" fill="none" />
          <path d="M106 100 Q114 96 122 100" stroke="#57534e" strokeWidth="2" fill="none" />
          {/* Stone brow */}
          <rect x="80" y="95" width="40" height="8" rx="2" fill="#57534e" />
          {/* Eyes - rune glowing */}
          <motion.ellipse cx="90" cy="104" rx="7" ry="6" fill="url(#gm-rune)"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="110" cy="104" rx="7" ry="6" fill="url(#gm-rune)"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="104" r="3" fill="#14532d" />
          <circle cx="110" cy="104" r="3" fill="#14532d" />
          {/* Nose - stone bump */}
          <ellipse cx="100" cy="113" rx="5" ry="4" fill="#57534e" />
          {/* Mouth crack */}
          <path d="M88 120 Q94 123 100 121 Q106 123 112 120" stroke="#292524" strokeWidth="3" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="76" y="180" width="18" height="14" rx="5" fill="#57534e" />
        <rect x="106" y="180" width="18" height="14" rx="5" fill="#57534e" />
      </motion.svg>
    </div>
  );
};

export default GolemNavi;
