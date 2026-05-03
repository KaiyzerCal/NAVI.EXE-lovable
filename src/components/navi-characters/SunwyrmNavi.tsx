import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const SunwyrmNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="sw-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
          <radialGradient id="sw-solar" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Solar glow */}
        <motion.circle cx="100" cy="115" r="60" fill="url(#sw-solar)"
          animate={animated ? { r: [60, 68, 60], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="182" rx="45" ry="10" fill="#78350f" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Wing left */}
          <motion.path d="M72 118 Q42 88 36 58 Q56 78 66 108 Q74 100 78 116" fill="#f59e0b" opacity="0.85"
            animate={animated ? { d: ['M72 118 Q42 88 36 58 Q56 78 66 108 Q74 100 78 116', 'M72 118 Q40 85 34 54 Q55 76 64 106 Q74 100 78 116', 'M72 118 Q42 88 36 58 Q56 78 66 108 Q74 100 78 116'] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Wing right */}
          <motion.path d="M128 118 Q158 88 164 58 Q144 78 134 108 Q126 100 122 116" fill="#f59e0b" opacity="0.85"
            animate={animated ? { d: ['M128 118 Q158 88 164 58 Q144 78 134 108 Q126 100 122 116', 'M128 118 Q160 85 166 54 Q145 76 136 106 Q126 100 122 116', 'M128 118 Q158 88 164 58 Q144 78 134 108 Q126 100 122 116'] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Tail */}
          <motion.path d="M90 165 Q78 180 70 195 Q84 185 92 170" fill="#f59e0b"
            animate={animated ? { d: ['M90 165 Q78 180 70 195 Q84 185 92 170', 'M90 165 Q76 182 68 198 Q83 187 92 170', 'M90 165 Q78 180 70 195 Q84 185 92 170'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="138" rx="30" ry="28" fill="url(#sw-body)" />
          {/* Sun pattern on belly */}
          <circle cx="100" cy="140" r="12" fill="#fef08a" opacity="0.5" />
          {/* Head */}
          <ellipse cx="100" cy="105" rx="26" ry="22" fill="#f59e0b" />
          {/* Dragon horns */}
          <path d="M82 92 L74 70 L86 88" fill="#78350f" />
          <path d="M118 92 L126 70 L114 88" fill="#78350f" />
          {/* Eyes */}
          <motion.circle cx="90" cy="102" r="7" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="110" cy="102" r="7" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="102" r="3.5" fill="#78350f" />
          <circle cx="110" cy="102" r="3.5" fill="#78350f" />
          <circle cx="88" cy="100" r="1.5" fill="white" />
          <circle cx="108" cy="100" r="1.5" fill="white" />
          {/* Snout / maw */}
          <path d="M88 114 Q100 120 112 114 Q106 124 100 126 Q94 124 88 114 Z" fill="#78350f" />
          <path d="M92 114 L94 118 L92 114" fill="#fef08a" />
          <path d="M108 114 L106 118 L108 114" fill="#fef08a" />
          {/* Solar rays emanating */}
          <motion.line x1="72" y1="90" x2="60" y2="78" stroke="#fef08a" strokeWidth="2" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0.2, 0.6] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.line x1="128" y1="90" x2="140" y2="78" stroke="#fef08a" strokeWidth="2" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0.2, 0.6] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default SunwyrmNavi;
