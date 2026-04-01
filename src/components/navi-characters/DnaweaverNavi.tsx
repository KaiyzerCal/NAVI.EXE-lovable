import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const DnaweaverNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="dw-body" x1="70" y1="88" x2="130" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#16a34a" />
            <stop offset="0.5" stopColor="#0d9488" />
            <stop offset="1" stopColor="#0e4429" />
          </linearGradient>
        </defs>
        {/* DNA helix glow */}
        <motion.ellipse cx="100" cy="120" rx="44" ry="42" fill="#22c55e" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#052e16" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* DNA helix arms */}
          <motion.path d="M58 108 Q72 118 58 128 Q72 138 58 148 Q72 158 58 168" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M58 108 Q72 118 58 128 Q72 138 58 148 Q72 158 58 168', 'M58 108 Q70 118 58 128 Q70 138 58 148 Q70 158 58 168', 'M58 108 Q72 118 58 128 Q72 138 58 148 Q72 158 58 168'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M142 108 Q128 118 142 128 Q128 138 142 148 Q128 158 142 168" stroke="#5eead4" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M142 108 Q128 118 142 128 Q128 138 142 148 Q128 158 142 168', 'M142 108 Q130 118 142 128 Q130 138 142 148 Q130 158 142 168', 'M142 108 Q128 118 142 128 Q128 138 142 148 Q128 158 142 168'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* DNA rungs */}
          {[118, 128, 138, 148, 158].map((y, i) => (
            <motion.line key={i} x1="60" y1={y} x2="140" y2={y} stroke={i % 2 === 0 ? '#4ade80' : '#5eead4'} strokeWidth="2" opacity="0.7"
              animate={animated ? { opacity: [0.7, 0.3, 0.7] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
          ))}
          {/* Body */}
          <ellipse cx="100" cy="135" rx="28" ry="24" fill="url(#dw-body)" />
          {/* DNA pattern on body */}
          <motion.path d="M84 125 Q92 130 100 125 Q108 120 116 125 Q108 130 100 135 Q92 140 84 135 Q92 130 100 125" fill="none" stroke="#86efac" strokeWidth="1.5" opacity="0.6"
            animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#16a34a" />
          {/* Lab goggles */}
          <rect x="82" y="93" width="36" height="14" rx="6" fill="#0f172a" />
          <rect x="84" y="95" width="14" height="10" rx="4" fill="#4ade80" opacity="0.7" />
          <rect x="102" y="95" width="14" height="10" rx="4" fill="#5eead4" opacity="0.7" />
          {/* Eyes through goggles */}
          <circle cx="91" cy="100" r="3" fill="#052e16" />
          <circle cx="109" cy="100" r="3" fill="#052e16" />
          <circle cx="92" cy="99" r="1.2" fill="white" />
          <circle cx="110" cy="99" r="1.2" fill="white" />
          {/* Curly hair */}
          <path d="M82 90 Q78 78 84 70 Q90 78 88 90" fill="#15803d" />
          <path d="M92 87 Q94 74 100 68 Q104 76 100 88" fill="#16a34a" />
          <path d="M108 90 Q112 78 116 70 Q118 80 114 90" fill="#15803d" />
          {/* Mouth */}
          <path d="M92 110 Q100 114 108 110" stroke="#86efac" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Test tube in hand */}
          <motion.g animate={animated ? { rotate: [0, -8, 2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '144px', originY: '138px' }}>
            <rect x="140" y="118" width="8" height="28" rx="4" fill="#0f172a" opacity="0.8" />
            <rect x="142" y="126" width="4" height="16" rx="2" fill="#4ade80" opacity="0.7" />
            <motion.ellipse cx="144" cy="134" rx="2" ry="4" fill="#86efac" opacity="0.9"
              animate={animated ? { cy: [134, 130, 134] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.g>
        </motion.g>
        {/* Legs */}
        <rect x="85" y="155" width="10" height="22" rx="4" fill="#15803d" />
        <rect x="105" y="155" width="10" height="22" rx="4" fill="#15803d" />
      </motion.svg>
    </div>
  );
};

export default DnaweaverNavi;
