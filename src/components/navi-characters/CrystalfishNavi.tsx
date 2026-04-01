import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const CrystalfishNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="cf-body" x1="65" y1="85" x2="135" y2="155" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c8f0ff" />
            <stop offset="0.5" stopColor="#a78bfa" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="cf-fin" x1="130" y1="110" x2="165" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e0d7ff" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        {/* Glow */}
        <motion.ellipse cx="97" cy="120" rx="40" ry="35" fill="#a78bfa" opacity="0.12"
          animate={animated ? { opacity: [0.12, 0.22, 0.12] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="97" cy="170" rx="35" ry="9" fill="#4c1d95" opacity="0.2" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Tail fin */}
          <motion.path d="M125 130 Q158 118 152 148 Q136 158 122 142 Z" fill="url(#cf-fin)"
            animate={animated ? { rotate: [0, 12, -6, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '122px', originY: '142px' }} />
          {/* Body */}
          <ellipse cx="95" cy="128" rx="32" ry="22" fill="url(#cf-body)" opacity="0.9" />
          {/* Crystal spines */}
          <motion.polygon points="80,105 76,90 84,98" fill="#e0d7ff"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="92,100 89,83 97,95" fill="#c4b5fd"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <motion.polygon points="105,103 102,87 110,98" fill="#a78bfa"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="77" cy="125" rx="20" ry="18" fill="#c8f0ff" />
          {/* Eyes */}
          <motion.circle cx="72" cy="120" r="5" fill="#ddd6fe"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="72" cy="120" r="2.5" fill="#4c1d95" />
          <circle cx="73" cy="119" r="1" fill="white" />
          {/* Mouth */}
          <path d="M66 128 Q70 132 74 128" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Shimmer particles */}
          <motion.circle cx="60" cy="108" r="2" fill="#e0d7ff"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="118" cy="112" r="1.5" fill="#c4b5fd"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.7, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default CrystalfishNavi;
