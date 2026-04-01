import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const TreantNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="tr-bark" x1="60" y1="80" x2="140" y2="185" gradientUnits="userSpaceOnUse">
            <stop stopColor="#78350f" />
            <stop offset="0.5" stopColor="#92400e" />
            <stop offset="1" stopColor="#451a03" />
          </linearGradient>
          <linearGradient id="tr-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#4ade80" />
            <stop offset="1" stopColor="#15803d" />
          </linearGradient>
        </defs>
        {/* Moss/nature glow */}
        <motion.ellipse cx="100" cy="128" rx="50" ry="45" fill="#22c55e" opacity="0.06"
          animate={animated ? { opacity: [0.06, 0.12, 0.06] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="182" rx="50" ry="11" fill="#1c1917" opacity="0.4" />
        {/* Body sway */}
        <motion.g animate={animated ? { rotate: [0, 1, -1, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '100px', originY: '185px' }}>
          {/* Roots/feet */}
          <path d="M84 178 Q78 190 72 195" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M94 180 Q92 192 88 196" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M116 178 Q122 190 128 195" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M106 180 Q108 192 112 196" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Trunk body */}
          <ellipse cx="100" cy="148" rx="42" ry="34" fill="url(#tr-bark)" />
          {/* Bark texture lines */}
          <path d="M82 136 Q85 148 82 160" stroke="#451a03" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M100 132 Q103 148 100 164" stroke="#451a03" strokeWidth="1.5" fill="none" opacity="0.5" />
          <path d="M118 136 Q115 148 118 160" stroke="#451a03" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Mossy patches */}
          <ellipse cx="82" cy="145" rx="8" ry="5" fill="#22c55e" opacity="0.4" />
          <ellipse cx="118" cy="150" rx="7" ry="4" fill="#16a34a" opacity="0.4" />
          {/* Branch arms */}
          <motion.path d="M58 128 Q42 108 38 88 Q50 100 58 118" stroke="#78350f" strokeWidth="10" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M58 128 Q42 108 38 88 Q50 100 58 118', 'M58 128 Q40 106 35 86 Q48 98 58 118', 'M58 128 Q42 108 38 88 Q50 100 58 118'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M142 128 Q158 108 162 88 Q150 100 142 118" stroke="#78350f" strokeWidth="10" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M142 128 Q158 108 162 88 Q150 100 142 118', 'M142 128 Q160 106 165 86 Q152 98 142 118', 'M142 128 Q158 108 162 88 Q150 100 142 118'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Leaf clusters on branches */}
          <motion.ellipse cx="40" cy="88" rx="18" ry="14" fill="url(#tr-leaf)"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="160" cy="88" rx="18" ry="14" fill="url(#tr-leaf)"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="106" rx="30" ry="26" fill="#92400e" />
          {/* Leafy crown */}
          <motion.path d="M76 92 Q84 72 100 68 Q116 72 124 92" fill="url(#tr-leaf)"
            animate={animated ? { d: ['M76 92 Q84 72 100 68 Q116 72 124 92', 'M76 92 Q82 70 100 66 Q118 70 124 92', 'M76 92 Q84 72 100 68 Q116 72 124 92'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="100" cy="75" rx="22" ry="16" fill="url(#tr-leaf)"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Face - carved wood look */}
          <ellipse cx="100" cy="112" rx="22" ry="16" fill="#78350f" opacity="0.5" />
          {/* Eyes - glowing like fireflies */}
          <motion.circle cx="90" cy="106" r="6" fill="#86efac"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="110" cy="106" r="6" fill="#86efac"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="106" r="2.5" fill="#14532d" />
          <circle cx="110" cy="106" r="2.5" fill="#14532d" />
          {/* Mouth crack */}
          <path d="M88 118 Q96 122 100 120 Q104 122 112 118" stroke="#451a03" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Floating leaf */}
          <motion.path d="M130 100 Q134 95 138 100 Q134 105 130 100" fill="#4ade80"
            animate={animated ? { y: [0, -8, 0], x: [0, 3, 0], rotate: [0, 15, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '134px', originY: '100px' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default TreantNavi;
