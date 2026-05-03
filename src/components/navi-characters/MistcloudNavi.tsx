import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const MistcloudNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="mc-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
        </defs>
        {/* Mist clouds */}
        <motion.ellipse cx="72" cy="125" rx="30" ry="18" fill="#e2e8f0" opacity="0.5"
          animate={animated ? { x: [0, 6, 0], opacity: [0.5, 0.3, 0.5] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="128" cy="130" rx="28" ry="16" fill="#e2e8f0" opacity="0.4"
          animate={animated ? { x: [0, -6, 0], opacity: [0.4, 0.6, 0.4] } : {}}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        <motion.ellipse cx="100" cy="160" rx="40" ry="14" fill="#f1f5f9" opacity="0.5"
          animate={animated ? { scaleX: [1, 1.1, 1] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="30" ry="6" fill="#475569" opacity="0.15" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Misty body */}
          <motion.ellipse cx="100" cy="130" rx="36" ry="28" fill="#cbd5e1" opacity="0.9"
            animate={animated ? { scaleX: [1, 1.04, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Cloud puffs on body */}
          <ellipse cx="82" cy="125" rx="14" ry="10" fill="#e2e8f0" opacity="0.7" />
          <ellipse cx="118" cy="128" rx="12" ry="9" fill="#e2e8f0" opacity="0.6" />
          <ellipse cx="100" cy="120" rx="16" ry="10" fill="#f1f5f9" opacity="0.7" />
          {/* Head */}
          <motion.ellipse cx="100" cy="96" rx="24" ry="22" fill="url(#mc-body)"
            animate={animated ? { scaleX: [1, 1.02, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Cloud hair */}
          <motion.ellipse cx="86" cy="82" rx="14" ry="10" fill="#f1f5f9"
            animate={animated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="100" cy="77" rx="16" ry="10" fill="#f1f5f9"
            animate={animated ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="114" cy="82" rx="14" ry="10" fill="#f1f5f9"
            animate={animated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="96" r="5.5" fill="#e2e8f0"
            animate={animated ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 5 }} />
          <motion.circle cx="109" cy="96" r="5.5" fill="#e2e8f0"
            animate={animated ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="91" cy="95" r="2.5" fill="#475569" />
          <circle cx="109" cy="95" r="2.5" fill="#475569" />
          <circle cx="92" cy="94" r="1" fill="white" />
          <circle cx="110" cy="94" r="1" fill="white" />
          {/* Mouth */}
          <path d="M93 105 Q100 109 107 105" stroke="#e2e8f0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Arms - wispy */}
          <motion.path d="M64 118 Q52 108 48 95 Q58 106 62 118" fill="#cbd5e1" opacity="0.7"
            animate={animated ? { opacity: [0.7, 0.4, 0.7] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M136 118 Q148 108 152 95 Q142 106 138 118" fill="#cbd5e1" opacity="0.7"
            animate={animated ? { opacity: [0.7, 0.4, 0.7] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs - misty wisps */}
        <motion.ellipse cx="90" cy="168" rx="8" ry="16" fill="#cbd5e1" opacity="0.8"
          animate={animated ? { opacity: [0.8, 0.5, 0.8] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="110" cy="168" rx="8" ry="16" fill="#cbd5e1" opacity="0.8"
          animate={animated ? { opacity: [0.8, 0.5, 0.8] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.svg>
    </div>
  );
};

export default MistcloudNavi;
