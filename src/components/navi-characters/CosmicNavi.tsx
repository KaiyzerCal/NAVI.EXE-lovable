import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const CosmicNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="cm-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#6ee7f7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </radialGradient>
        </defs>
        {/* Cosmic shimmer */}
        <motion.circle cx="100" cy="120" r="55" fill="#0ea5e9" opacity="0.08"
          animate={animated ? { r: [55, 62, 55], opacity: [0.08, 0.16, 0.08] } : {}}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Star dots */}
        {[{ cx: 55, cy: 85 }, { cx: 142, cy: 75 }, { cx: 48, cy: 150 }, { cx: 155, cy: 160 }].map((s, i) => (
          <motion.circle key={i} cx={s.cx} cy={s.cy} r="1.5" fill="#bae6fd"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#0c4a6e" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Cosmic cloak bottom */}
          <motion.path d="M72 130 Q66 158 74 172 Q87 178 100 176 Q113 178 126 172 Q134 158 128 130" fill="#0c4a6e" opacity="0.8"
            animate={animated ? { d: ['M72 130 Q66 158 74 172 Q87 178 100 176 Q113 178 126 172 Q134 158 128 130', 'M72 130 Q64 162 72 175 Q85 180 100 178 Q115 180 128 175 Q136 162 128 130', 'M72 130 Q66 158 74 172 Q87 178 100 176 Q113 178 126 172 Q134 158 128 130'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="128" rx="30" ry="26" fill="url(#cm-body)" />
          {/* Constellation pattern */}
          <circle cx="90" cy="120" r="2" fill="#bae6fd" opacity="0.7" />
          <circle cx="100" cy="118" r="2" fill="#bae6fd" opacity="0.7" />
          <circle cx="110" cy="122" r="2" fill="#bae6fd" opacity="0.7" />
          <line x1="90" y1="120" x2="100" y2="118" stroke="#bae6fd" strokeWidth="0.8" opacity="0.5" />
          <line x1="100" y1="118" x2="110" y2="122" stroke="#bae6fd" strokeWidth="0.8" opacity="0.5" />
          {/* Head */}
          <circle cx="100" cy="98" r="22" fill="#0ea5e9" />
          {/* Eyes */}
          <motion.circle cx="91" cy="96" r="6" fill="#6ee7f7"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="96" r="6" fill="#6ee7f7"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="95" r="2.8" fill="#0c4a6e" />
          <circle cx="109" cy="95" r="2.8" fill="#0c4a6e" />
          <circle cx="92" cy="94" r="1.1" fill="white" />
          <circle cx="110" cy="94" r="1.1" fill="white" />
          {/* Horns / cosmic antennae */}
          <motion.line x1="88" y1="78" x2="80" y2="62" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
            animate={animated ? { rotate: [0, -5, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '88px', originY: '78px' }} />
          <motion.line x1="112" y1="78" x2="120" y2="62" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round"
            animate={animated ? { rotate: [0, 5, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '112px', originY: '78px' }} />
          <motion.circle cx="80" cy="62" r="4" fill="#bae6fd"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="120" cy="62" r="4" fill="#bae6fd"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          {/* Mouth */}
          <path d="M93 106 Q100 110 107 106" stroke="#bae6fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="172" width="10" height="18" rx="4" fill="#0c4a6e" />
        <rect x="105" y="172" width="10" height="18" rx="4" fill="#0c4a6e" />
      </motion.svg>
    </div>
  );
};

export default CosmicNavi;
