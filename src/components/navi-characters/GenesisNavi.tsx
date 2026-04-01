import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GenesisNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="gn-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#bfdbfe" />
            <stop offset="70%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>
          <radialGradient id="gn-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Genesis aura - primal energy */}
        <motion.circle cx="100" cy="115" r="65" fill="url(#gn-aura)"
          animate={animated ? { r: [65, 75, 65], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Energy rings */}
        <motion.circle cx="100" cy="115" r="55" fill="none" stroke="#a5f3fc" strokeWidth="1.5" opacity="0.4"
          animate={animated ? { r: [55, 65, 55], opacity: [0.4, 0, 0.4] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
        <motion.circle cx="100" cy="115" r="40" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.5"
          animate={animated ? { r: [40, 55, 40], opacity: [0.5, 0, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="36" ry="8" fill="#1e1b4b" opacity="0.2" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -6, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Energy tendrils */}
          <motion.path d="M74 118 Q58 102 52 85 Q64 98 70 114" fill="#6366f1" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M126 118 Q142 102 148 85 Q136 98 130 114" fill="#6366f1" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          {/* Body */}
          <circle cx="100" cy="128" r="30" fill="url(#gn-body)" />
          {/* Creation symbol - double helix / DNA like */}
          <motion.path d="M88 118 Q100 124 112 118 Q100 132 88 126 Q100 120 112 126 Q100 132 88 118" stroke="#a5f3fc" strokeWidth="1.5" fill="none"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <circle cx="100" cy="96" r="22" fill="#6366f1" />
          {/* White glow head */}
          <motion.circle cx="100" cy="96" r="18" fill="#bfdbfe" opacity="0.4"
            animate={animated ? { r: [18, 22, 18], opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes - cosmic genesis */}
          <motion.circle cx="91" cy="93" r="6.5" fill="white"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="93" r="6.5" fill="white"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="91" cy="93" r="3.5" fill="#1e1b4b"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="93" r="3.5" fill="#1e1b4b"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="92" cy="91" r="1.5" fill="white" opacity="0.8" />
          <circle cx="110" cy="91" r="1.5" fill="white" opacity="0.8" />
          {/* Third eye / genesis mark */}
          <motion.circle cx="100" cy="84" r="4" fill="#a5f3fc"
            animate={animated ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="100" cy="84" r="2" fill="white" />
          {/* Mouth */}
          <path d="M93 104 Q100 109 107 104" stroke="#bfdbfe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="155" width="10" height="22" rx="4" fill="#3730a3" />
        <rect x="104" y="155" width="10" height="22" rx="4" fill="#3730a3" />
      </motion.svg>
    </div>
  );
};

export default GenesisNavi;
