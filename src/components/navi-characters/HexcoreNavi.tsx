import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const HexcoreNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="hx-body" x1="65" y1="88" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f172a" />
            <stop offset="1" stopColor="#020617" />
          </linearGradient>
          <radialGradient id="hx-hex" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#065f46" />
          </radialGradient>
        </defs>
        {/* Hex grid background glow */}
        <motion.circle cx="100" cy="120" r="55" fill="#34d399" opacity="0.07"
          animate={animated ? { opacity: [0.07, 0.14, 0.07] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Hex pattern tiles */}
        {[{ cx: 72, cy: 80 }, { cx: 100, cy: 72 }, { cx: 128, cy: 80 }, { cx: 58, cy: 108 }, { cx: 142, cy: 108 }].map((h, i) => (
          <motion.polygon key={i}
            points={`${h.cx},${h.cy - 10} ${h.cx + 9},${h.cy - 5} ${h.cx + 9},${h.cy + 5} ${h.cx},${h.cy + 10} ${h.cx - 9},${h.cy + 5} ${h.cx - 9},${h.cy - 5}`}
            fill="none" stroke="#34d399" strokeWidth="1" opacity="0.3"
            animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#020617" opacity="0.5" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -2.5, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <polygon points="100,108 128,124 128,156 100,172 72,156 72,124" fill="url(#hx-body)" />
          {/* Hex body outline */}
          <polygon points="100,108 128,124 128,156 100,172 72,156 72,124" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.6" />
          {/* Central hex core */}
          <motion.polygon points="100,122 112,129 112,143 100,150 88,143 88,129" fill="url(#hx-hex)" opacity="0.8"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="100,128 107,132 107,140 100,144 93,140 93,132" fill="#34d399"
            animate={animated ? { rotate: [0, 60, 0] } : {}}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '136px' }} />
          {/* Hex shoulder plates */}
          <polygon points="72,124 58,118 54,132 68,138 72,124" fill="#0f172a" />
          <polygon points="72,124 58,118 54,132 68,138 72,124" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5" />
          <polygon points="128,124 142,118 146,132 132,138 128,124" fill="#0f172a" />
          <polygon points="128,124 142,118 146,132 132,138 128,124" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5" />
          {/* Head hex */}
          <polygon points="100,82 120,93 120,115 100,126 80,115 80,93" fill="#0f172a" />
          <polygon points="100,82 120,93 120,115 100,126 80,115 80,93" fill="none" stroke="#34d399" strokeWidth="2" opacity="0.7" />
          {/* Eyes */}
          <motion.polygon points="88,96 94,99 94,105 88,108 82,105 82,99" fill="#34d399" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.4, 0.9] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="112,96 118,99 118,105 112,108 106,105 106,99" fill="#34d399" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.4, 0.9] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="88" cy="102" r="2.5" fill="#022c22" />
          <circle cx="112" cy="102" r="2.5" fill="#022c22" />
          {/* Hex mouth */}
          <motion.polygon points="100,113 107,116 107,120 100,123 93,120 93,116" fill="none" stroke="#34d399" strokeWidth="1.5"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="168" width="11" height="20" rx="3" fill="#0f172a" />
        <rect x="104" y="168" width="11" height="20" rx="3" fill="#0f172a" />
        <line x1="86" y1="172" x2="95" y2="172" stroke="#34d399" strokeWidth="1" opacity="0.5" />
        <line x1="105" y1="172" x2="114" y2="172" stroke="#34d399" strokeWidth="1" opacity="0.5" />
      </motion.svg>
    </div>
  );
};

export default HexcoreNavi;
