import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const ThunderdogNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="td-body" x1="65" y1="90" x2="135" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffd60a" />
            <stop offset="1" stopColor="#f4a261" />
          </linearGradient>
          <linearGradient id="td-bolt" x1="95" y1="60" x2="105" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff176" />
            <stop offset="1" stopColor="#ffd60a" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="170" rx="40" ry="10" fill="#7b5e00" opacity="0.25" />
        {/* Body group with float */}
        <motion.g animate={animated ? { y: [0, -2.5, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Tail */}
          <motion.path d="M130 148 Q162 138 155 162 Q140 170 125 155 Z" fill="#ffd60a"
            animate={animated ? { rotate: [0, 10, -5, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '125px', originY: '155px' }} />
          {/* Body */}
          <ellipse cx="97" cy="138" rx="34" ry="24" fill="url(#td-body)" />
          {/* Chest marking */}
          <ellipse cx="93" cy="140" rx="16" ry="12" fill="#fff9c4" opacity="0.55" />
          {/* Head */}
          <ellipse cx="92" cy="107" rx="24" ry="21" fill="#ffd60a" />
          {/* Ears */}
          <path d="M74 94 L68 72 L82 88 Z" fill="#f4a261" />
          <path d="M110 94 L118 72 L104 88 Z" fill="#f4a261" />
          {/* Lightning bolt on forehead */}
          <motion.path d="M92 84 L89 95 L93 95 L90 105 L97 92 L93 92 Z" fill="url(#td-bolt)"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="84" cy="108" rx="5.5" ry="5" fill="#fff176"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }} />
          <motion.ellipse cx="100" cy="108" rx="5.5" ry="5" fill="#fff176"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }} />
          <circle cx="85" cy="107" r="2.5" fill="#1a1a00" />
          <circle cx="101" cy="107" r="2.5" fill="#1a1a00" />
          <circle cx="86" cy="106" r="1" fill="white" />
          <circle cx="102" cy="106" r="1" fill="white" />
          {/* Nose */}
          <ellipse cx="92" cy="115" rx="4" ry="3" fill="#a0522d" />
          {/* Electric sparks */}
          <motion.path d="M60 120 L55 115 L62 112 L57 107" stroke="#fff176" strokeWidth="1.5" fill="none"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <motion.path d="M130 115 L136 110 L129 107 L135 102" stroke="#fff176" strokeWidth="1.5" fill="none"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="79" y="158" width="8" height="20" rx="3" fill="#ffd60a" />
        <rect x="102" y="158" width="8" height="20" rx="3" fill="#ffd60a" />
      </motion.svg>
    </div>
  );
};

export default ThunderdogNavi;
