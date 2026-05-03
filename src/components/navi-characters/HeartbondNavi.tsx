import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const HeartbondNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="hb-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#831843" />
          </radialGradient>
          <radialGradient id="hb-heart" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>
        </defs>
        {/* Heart pulse aura */}
        <motion.circle cx="100" cy="118" r="50" fill="#ec4899" opacity="0.07"
          animate={animated ? { r: [50, 58, 50], opacity: [0.07, 0.14, 0.07] } : {}}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Floating hearts */}
        {[{ cx: 52, cy: 88, d: 0 }, { cx: 148, cy: 95, d: 0.5 }, { cx: 42, cy: 135, d: 1.0 }].map((h, i) => (
          <motion.path key={i}
            d={`M${h.cx} ${h.cy + 3} Q${h.cx - 6} ${h.cy - 3} ${h.cx} ${h.cy - 6} Q${h.cx + 6} ${h.cy - 3} ${h.cx} ${h.cy + 3} Z`}
            fill="#fda4af" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], y: [0, -12, -20] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: h.d, ease: 'easeOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#831843" opacity="0.2" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <ellipse cx="100" cy="132" rx="28" ry="25" fill="url(#hb-body)" />
          {/* Heartbeat line on body */}
          <motion.path d="M78 132 L84 132 L88 124 L92 140 L96 132 L104 132 L108 124 L112 140 L116 132 L122 132" stroke="#fce7f3" strokeWidth="2" fill="none" opacity="0.8"
            animate={animated ? { opacity: [0.8, 0.3, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms */}
          <rect x="64" y="120" width="12" height="28" rx="5" fill="#db2777" />
          <rect x="124" y="120" width="12" height="28" rx="5" fill="#db2777" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#ec4899" />
          {/* Heart-shaped hair */}
          <motion.path d="M85 88 Q82 78 88 72 Q94 76 92 88" fill="#be185d"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M100 85 Q100 74 106 70 Q112 74 108 86" fill="#f472b6"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M115 88 Q118 78 112 72 Q106 76 108 88" fill="#be185d"
            animate={animated ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Big heart on forehead */}
          <motion.path d="M96 84 Q93 80 96 77 Q100 80 100 84 Q100 80 104 77 Q107 80 104 84 Q100 88 96 84 Z" fill="url(#hb-heart)"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '82px' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="100" r="5.5" fill="#fce7f3"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3 }} />
          <motion.circle cx="109" cy="100" r="5.5" fill="#fce7f3"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3 }} />
          <circle cx="91" cy="99" r="2.5" fill="#831843" />
          <circle cx="109" cy="99" r="2.5" fill="#831843" />
          <circle cx="92" cy="98" r="1" fill="white" />
          <circle cx="110" cy="98" r="1" fill="white" />
          {/* Rosy cheeks */}
          <ellipse cx="83" cy="105" rx="5" ry="3" fill="#fda4af" opacity="0.5" />
          <ellipse cx="117" cy="105" rx="5" ry="3" fill="#fda4af" opacity="0.5" />
          {/* Smile */}
          <path d="M92 109 Q100 114 108 109" stroke="#fce7f3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="153" width="10" height="22" rx="4" fill="#9d174d" />
        <rect x="104" y="153" width="10" height="22" rx="4" fill="#9d174d" />
      </motion.svg>
    </div>
  );
};

export default HeartbondNavi;
