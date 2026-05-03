import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const MoonwitchNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="mw-robe" x1="70" y1="100" x2="130" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1b4b" />
            <stop offset="1" stopColor="#0f0a1e" />
          </linearGradient>
          <radialGradient id="mw-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fef08a" />
          </radialGradient>
        </defs>
        {/* Moonlight glow */}
        <motion.ellipse cx="100" cy="118" rx="50" ry="55" fill="#4338ca" opacity="0.1"
          animate={animated ? { opacity: [0.1, 0.2, 0.1] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Stars */}
        {[{ cx: 48, cy: 75 }, { cx: 152, cy: 82 }, { cx: 38, cy: 130 }, { cx: 158, cy: 145 }].map((s, i) => (
          <motion.circle key={i} cx={s.cx} cy={s.cy} r="2" fill="#fef9c3"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#0f0a1e" opacity="0.4" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Robe bottom – flowing */}
          <motion.path d="M72 128 Q64 158 70 175 Q84 182 100 180 Q116 182 130 175 Q136 158 128 128" fill="url(#mw-robe)"
            animate={animated ? { d: ['M72 128 Q64 158 70 175 Q84 182 100 180 Q116 182 130 175 Q136 158 128 128', 'M72 128 Q62 162 68 178 Q82 184 100 182 Q118 184 132 178 Q138 162 128 128', 'M72 128 Q64 158 70 175 Q84 182 100 180 Q116 182 130 175 Q136 158 128 128'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <rect x="76" y="114" width="48" height="32" rx="8" fill="#1e1b4b" />
          {/* Moon crescent on chest */}
          <motion.path d="M96 122 Q88 128 96 134 Q102 125 96 122" fill="#fef9c3" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms */}
          <rect x="60" y="114" width="14" height="30" rx="6" fill="#1e1b4b" />
          <rect x="126" y="114" width="14" height="30" rx="6" fill="#1e1b4b" />
          {/* Moon staff */}
          <motion.g animate={animated ? { rotate: [0, -5, 2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '52px', originY: '148px' }}>
            <line x1="52" y1="95" x2="52" y2="148" stroke="#4338ca" strokeWidth="3" strokeLinecap="round" />
            <motion.path d="M44 95 Q38 85 44 76 Q52 82 52 90 Q52 82 60 76 Q66 85 60 95 Z" fill="url(#mw-moon)"
              animate={animated ? { opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="21" fill="#312e81" />
          {/* Pointy hat */}
          <path d="M82 90 L100 48 L118 90 Z" fill="#1e1b4b" />
          <rect x="80" y="88" width="40" height="5" rx="2" fill="#4338ca" />
          {/* Moon on hat */}
          <motion.path d="M96 68 Q90 60 96 53 Q102 57 100 64 Q102 57 108 53 Q114 60 108 68 Z" fill="#fef9c3" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="92" cy="100" r="5.5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.circle cx="108" cy="100" r="5.5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="92" cy="99" r="2.5" fill="#1e1b4b" />
          <circle cx="108" cy="99" r="2.5" fill="#1e1b4b" />
          {/* Smile */}
          <path d="M92 108 Q100 113 108 108" stroke="#c4b5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="170" width="10" height="20" rx="4" fill="#1e1b4b" />
        <rect x="104" y="170" width="10" height="20" rx="4" fill="#1e1b4b" />
      </motion.svg>
    </div>
  );
};

export default MoonwitchNavi;
