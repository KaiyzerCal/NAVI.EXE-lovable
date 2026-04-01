import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const StarmarkNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="sm-body" x1="68" y1="90" x2="132" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1b4b" />
            <stop offset="1" stopColor="#0f0a1e" />
          </linearGradient>
          <radialGradient id="sm-star" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fbbf24" />
          </radialGradient>
        </defs>
        {/* Star constellation glow */}
        <motion.circle cx="100" cy="118" r="52" fill="#818cf8" opacity="0.07"
          animate={animated ? { opacity: [0.07, 0.14, 0.07] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Constellation lines */}
        <motion.line x1="52" y1="75" x2="76" y2="88" stroke="#818cf8" strokeWidth="1" opacity="0.3"
          animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.line x1="148" y1="75" x2="124" y2="88" stroke="#818cf8" strokeWidth="1" opacity="0.3"
          animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
        <motion.line x1="52" y1="155" x2="76" y2="142" stroke="#818cf8" strokeWidth="1" opacity="0.3"
          animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
        {/* Constellation stars */}
        {[{ cx: 52, cy: 75 }, { cx: 148, cy: 75 }, { cx: 52, cy: 155 }, { cx: 148, cy: 155 }].map((s, i) => (
          <motion.polygon key={i}
            points={`${s.cx},${s.cy - 5} ${s.cx + 2},${s.cy - 1} ${s.cx + 5},${s.cy} ${s.cx + 2},${s.cy + 1} ${s.cx},${s.cy + 5} ${s.cx - 2},${s.cy + 1} ${s.cx - 5},${s.cy} ${s.cx - 2},${s.cy - 1}`}
            fill="#fbbf24" opacity="0.6"
            animate={animated ? { opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#0f0a1e" opacity="0.4" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Dark robe */}
          <motion.path d="M72 122 Q64 154 72 170 Q86 178 100 176 Q114 178 128 170 Q136 154 128 122" fill="url(#sm-body)"
            animate={animated ? { d: ['M72 122 Q64 154 72 170 Q86 178 100 176 Q114 178 128 170 Q136 154 128 122', 'M72 122 Q62 158 70 173 Q84 180 100 178 Q116 180 130 173 Q138 158 128 122', 'M72 122 Q64 154 72 170 Q86 178 100 176 Q114 178 128 170 Q136 154 128 122'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="28" ry="24" fill="url(#sm-body)" />
          {/* Star mark on chest */}
          <motion.polygon points="100,118 103,127 112,127 105,133 107,142 100,137 93,142 95,133 88,127 97,127" fill="url(#sm-star)"
            animate={animated ? { opacity: [1, 0.5, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '130px' }} />
          {/* Arms */}
          <rect x="64" y="118" width="12" height="28" rx="5" fill="#1e1b4b" />
          <rect x="124" y="118" width="12" height="28" rx="5" fill="#1e1b4b" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#312e81" />
          {/* Star crown */}
          <motion.polygon points="100,80 102,87 109,87 104,91 106,98 100,94 94,98 96,91 91,87 98,87" fill="url(#sm-star)"
            animate={animated ? { scale: [1, 1.15, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '89px' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="101" r="5.5" fill="#818cf8"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="101" r="5.5" fill="#818cf8"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="100" r="2.5" fill="#0f0a1e" />
          <circle cx="109" cy="100" r="2.5" fill="#0f0a1e" />
          <circle cx="92" cy="99" r="1" fill="white" />
          <circle cx="110" cy="99" r="1" fill="white" />
          {/* Mouth */}
          <path d="M93 109 Q100 113 107 109" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="168" width="11" height="20" rx="4" fill="#1e1b4b" />
        <rect x="104" y="168" width="11" height="20" rx="4" fill="#1e1b4b" />
      </motion.svg>
    </div>
  );
};

export default StarmarkNavi;
