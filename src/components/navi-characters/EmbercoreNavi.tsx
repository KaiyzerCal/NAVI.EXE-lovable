import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const EmbercoreNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="ec-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="ec-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Outer glow */}
        <motion.circle cx="97" cy="118" r="50" fill="url(#ec-glow)"
          animate={animated ? { r: [50, 56, 50], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="97" cy="175" rx="35" ry="9" fill="#450a0a" opacity="0.4" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Flame tendrils */}
          <motion.path d="M75 95 Q65 75 72 60 Q80 72 78 88" fill="#f97316" opacity="0.8"
            animate={animated ? { d: ['M75 95 Q65 75 72 60 Q80 72 78 88', 'M73 95 Q60 72 68 56 Q78 70 76 88', 'M75 95 Q65 75 72 60 Q80 72 78 88'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M97 88 Q92 68 98 55 Q103 68 100 88" fill="#fde047" opacity="0.9"
            animate={animated ? { d: ['M97 88 Q92 68 98 55 Q103 68 100 88', 'M95 88 Q88 65 95 52 Q102 66 99 88', 'M97 88 Q92 68 98 55 Q103 68 100 88'] } : {}}
            transition={{ duration: 1.3, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.path d="M118 95 Q128 75 122 60 Q114 72 116 88" fill="#f97316" opacity="0.8"
            animate={animated ? { d: ['M118 95 Q128 75 122 60 Q114 72 116 88', 'M120 95 Q132 72 126 57 Q116 70 118 88', 'M118 95 Q128 75 122 60 Q114 72 116 88'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Body sphere */}
          <circle cx="97" cy="128" r="38" fill="url(#ec-core)" />
          {/* Inner molten core */}
          <motion.circle cx="97" cy="128" r="20" fill="#fde047" opacity="0.7"
            animate={animated ? { r: [20, 23, 20], opacity: [0.7, 0.9, 0.7] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="97" cy="128" r="10" fill="white" opacity="0.5"
            animate={animated ? { r: [10, 13, 10], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="86" cy="120" r="7" fill="#1a0000"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="108" cy="120" r="7" fill="#1a0000"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="86" cy="120" r="3.5" fill="#fde047"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="108" cy="120" r="3.5" fill="#fde047"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Mouth */}
          <motion.path d="M88 134 Q97 142 106 134" stroke="#fde047" strokeWidth="2.5" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M88 134 Q97 142 106 134', 'M88 136 Q97 144 106 136', 'M88 134 Q97 142 106 134'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Ember particles */}
          <motion.circle cx="65" cy="105" r="2" fill="#fde047"
            animate={animated ? { opacity: [0, 1, 0], y: [0, -12, -20], x: [0, -3, -5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
          <motion.circle cx="128" cy="100" r="2" fill="#f97316"
            animate={animated ? { opacity: [0, 1, 0], y: [0, -10, -18], x: [0, 4, 7] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: 'easeOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default EmbercoreNavi;
