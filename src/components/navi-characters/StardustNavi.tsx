import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const StardustNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="sd-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f0abfc" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>
          <radialGradient id="sd-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e879f9" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Star glow */}
        <motion.circle cx="100" cy="118" r="58" fill="url(#sd-glow)"
          animate={animated ? { r: [58, 65, 58], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Sparkles */}
        {[{ cx: 52, cy: 72, d: 0 }, { cx: 148, cy: 80, d: 0.8 }, { cx: 45, cy: 148, d: 1.4 }, { cx: 158, cy: 140, d: 0.4 }, { cx: 100, cy: 55, d: 1.0 }].map((s, i) => (
          <motion.polygon key={i} points={`${s.cx},${s.cy - 5} ${s.cx + 2},${s.cy - 1} ${s.cx + 5},${s.cy} ${s.cx + 2},${s.cy + 1} ${s.cx},${s.cy + 5} ${s.cx - 2},${s.cy + 1} ${s.cx - 5},${s.cy} ${s.cx - 2},${s.cy - 1}`} fill="#f0abfc"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: s.d, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#1e1b4b" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Trailing stardust */}
          <motion.path d="M85 155 Q70 168 65 182 Q80 172 87 158" fill="#a78bfa" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M115 155 Q130 168 135 182 Q120 172 113 158" fill="#c084fc" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          {/* Body */}
          <circle cx="100" cy="130" r="32" fill="url(#sd-body)" />
          {/* Star pattern */}
          <motion.circle cx="100" cy="130" r="16" fill="none" stroke="#f0abfc" strokeWidth="1" strokeDasharray="4,4"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '130px' }} />
          {/* Head */}
          <circle cx="100" cy="98" r="22" fill="#a78bfa" />
          {/* Eyes */}
          <motion.circle cx="91" cy="96" r="6" fill="#f0abfc"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="96" r="6" fill="#f0abfc"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="95" r="3" fill="#1e1b4b" />
          <circle cx="109" cy="95" r="3" fill="#1e1b4b" />
          <circle cx="92" cy="94" r="1.2" fill="white" />
          <circle cx="110" cy="94" r="1.2" fill="white" />
          {/* Starry hair */}
          <motion.path d="M82 84 Q80 68 88 60 Q92 72 90 84" fill="#7c3aed"
            animate={animated ? { d: ['M82 84 Q80 68 88 60 Q92 72 90 84', 'M82 84 Q78 66 86 58 Q91 71 90 84', 'M82 84 Q80 68 88 60 Q92 72 90 84'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M100 80 Q100 64 104 56 Q108 66 106 80" fill="#8b5cf6"
            animate={animated ? { d: ['M100 80 Q100 64 104 56 Q108 66 106 80', 'M100 80 Q100 62 104 54 Q109 65 106 80', 'M100 80 Q100 64 104 56 Q108 66 106 80'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <motion.path d="M118 84 Q120 68 112 60 Q108 72 110 84" fill="#7c3aed"
            animate={animated ? { d: ['M118 84 Q120 68 112 60 Q108 72 110 84', 'M118 84 Q122 66 114 58 Q109 71 110 84', 'M118 84 Q120 68 112 60 Q108 72 110 84'] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} />
          {/* Mouth */}
          <path d="M93 106 Q100 110 107 106" stroke="#f0abfc" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default StardustNavi;
