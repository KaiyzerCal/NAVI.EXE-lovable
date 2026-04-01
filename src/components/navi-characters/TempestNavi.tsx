import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const TempestNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="tp-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>
          <radialGradient id="tp-storm" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Storm aura */}
        <motion.circle cx="100" cy="118" r="58" fill="url(#tp-storm)"
          animate={animated ? { r: [58, 65, 58] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Lightning flashes */}
        <motion.path d="M42 88 L38 80 L46 77 L40 68" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.path d="M158 92 L162 84 L154 81 L160 72" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 3, repeat: Infinity, delay: 1, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#1e1b4b" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Storm cloak */}
          <motion.path d="M70 125 Q60 155 68 172 Q84 178 100 176 Q116 178 132 172 Q140 155 130 125" fill="#1d4ed8" opacity="0.7"
            animate={animated ? { d: ['M70 125 Q60 155 68 172 Q84 178 100 176 Q116 178 132 172 Q140 155 130 125', 'M70 125 Q58 158 66 175 Q82 180 100 178 Q118 180 134 175 Q142 158 130 125', 'M70 125 Q60 155 68 172 Q84 178 100 176 Q116 178 132 172 Q140 155 130 125'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="128" rx="30" ry="26" fill="url(#tp-body)" />
          {/* Storm eye on chest */}
          <motion.circle cx="100" cy="130" r="10" fill="none" stroke="#38bdf8" strokeWidth="2"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '130px' }} />
          <motion.circle cx="100" cy="130" r="4" fill="#fde047"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms with wind */}
          <motion.rect x="62" y="116" width="13" height="28" rx="5" fill="#1d4ed8"
            animate={animated ? { rotate: [0, -10, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '68px', originY: '116px' }} />
          <motion.rect x="125" y="116" width="13" height="28" rx="5" fill="#1d4ed8"
            animate={animated ? { rotate: [0, 10, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '131px', originY: '116px' }} />
          {/* Head */}
          <ellipse cx="100" cy="98" rx="24" ry="22" fill="#1d4ed8" />
          {/* Storm hair */}
          <motion.path d="M80 88 Q74 70 82 60 Q88 72 86 88" fill="#0ea5e9"
            animate={animated ? { d: ['M80 88 Q74 70 82 60 Q88 72 86 88', 'M80 88 Q72 68 80 58 Q87 71 86 88', 'M80 88 Q74 70 82 60 Q88 72 86 88'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M100 84 Q98 66 104 56 Q108 68 106 84" fill="#38bdf8"
            animate={animated ? { d: ['M100 84 Q98 66 104 56 Q108 68 106 84', 'M100 84 Q96 64 102 54 Q107 67 106 84', 'M100 84 Q98 66 104 56 Q108 68 106 84'] } : {}}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.path d="M120 88 Q126 70 118 60 Q112 72 114 88" fill="#0ea5e9"
            animate={animated ? { d: ['M120 88 Q126 70 118 60 Q112 72 114 88', 'M120 88 Q128 68 120 58 Q113 71 114 88', 'M120 88 Q126 70 118 60 Q112 72 114 88'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="90" cy="97" r="6" fill="#fde047"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="110" cy="97" r="6" fill="#fde047"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="97" r="2.8" fill="#1e1b4b" />
          <circle cx="110" cy="97" r="2.8" fill="#1e1b4b" />
          {/* Mouth */}
          <path d="M92 108 Q100 112 108 108" stroke="#7dd3fc" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="170" width="11" height="20" rx="4" fill="#1e1b4b" />
        <rect x="104" y="170" width="11" height="20" rx="4" fill="#1e1b4b" />
      </motion.svg>
    </div>
  );
};

export default TempestNavi;
