import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const AquacatNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="aq-body" x1="70" y1="90" x2="130" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0077b6" />
            <stop offset="1" stopColor="#00b4d8" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <motion.ellipse cx="100" cy="168" rx="38" ry="10" fill="#005580" opacity="0.3"
          animate={animated ? { scaleX: [1, 1.05, 1] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Body */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Tail */}
          <motion.path d="M125 145 Q155 130 150 160 Q135 165 120 150 Z" fill="#0096c7"
            animate={animated ? { rotate: [0, 8, -4, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '120px', originY: '150px' }} />
          {/* Main body */}
          <ellipse cx="95" cy="135" rx="32" ry="22" fill="url(#aq-body)" />
          {/* Belly */}
          <ellipse cx="90" cy="138" rx="18" ry="13" fill="#90e0ef" opacity="0.5" />
          {/* Head */}
          <ellipse cx="90" cy="108" rx="22" ry="20" fill="#0096c7" />
          {/* Ears */}
          <path d="M75 95 L70 78 L82 90 Z" fill="#0077b6" />
          <path d="M105 95 L112 78 L100 90 Z" fill="#0077b6" />
          {/* Inner ears */}
          <path d="M77 92 L73 81 L82 89 Z" fill="#48cae4" opacity="0.6" />
          <path d="M103 92 L109 81 L100 89 Z" fill="#48cae4" opacity="0.6" />
          {/* Eyes */}
          <motion.ellipse cx="83" cy="105" rx="5" ry="5.5" fill="#ade8f4"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }} />
          <motion.ellipse cx="97" cy="105" rx="5" ry="5.5" fill="#ade8f4"
            animate={animated ? { scaleY: [1, 0.1, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }} />
          <circle cx="84" cy="104" r="2.5" fill="#023e8a" />
          <circle cx="98" cy="104" r="2.5" fill="#023e8a" />
          <circle cx="85" cy="103" r="1" fill="white" />
          <circle cx="99" cy="103" r="1" fill="white" />
          {/* Nose */}
          <ellipse cx="90" cy="112" rx="3" ry="2" fill="#48cae4" />
          {/* Water droplets */}
          <motion.circle cx="65" cy="115" r="3" fill="#90e0ef" opacity="0.7"
            animate={animated ? { opacity: [0.7, 0, 0.7], y: [0, 5, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="120" cy="120" r="2" fill="#90e0ef" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0, 0.6], y: [0, 4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="80" y="153" width="7" height="18" rx="3" fill="#0096c7" />
        <rect x="100" y="153" width="7" height="18" rx="3" fill="#0096c7" />
      </motion.svg>
    </div>
  );
};

export default AquacatNavi;
