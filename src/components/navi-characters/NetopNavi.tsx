import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const NetopNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="nt-body" x1="68" y1="95" x2="132" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#312e81" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <motion.ellipse cx="100" cy="172" rx="38" ry="9" fill="#1e1b4b" opacity="0.3"
          animate={animated ? { scaleX: [1, 1.04, 1] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <ellipse cx="100" cy="140" rx="33" ry="26" fill="url(#nt-body)" />
          {/* Belt */}
          <rect x="68" y="143" width="64" height="8" rx="3" fill="#4338ca" />
          <circle cx="100" cy="147" r="4" fill="#818cf8" />
          {/* Arms */}
          <rect x="62" y="118" width="14" height="30" rx="6" fill="#4f46e5" />
          <rect x="124" y="118" width="14" height="30" rx="6" fill="#4f46e5" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="24" ry="22" fill="#6366f1" />
          {/* Visor / goggles */}
          <rect x="82" y="93" width="36" height="12" rx="5" fill="#1e1b4b" />
          <motion.rect x="83" y="94" width="15" height="10" rx="4" fill="#60a5fa"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.rect x="100" y="94" width="17" height="10" rx="4" fill="#818cf8"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          {/* Ears */}
          <ellipse cx="77" cy="100" rx="8" ry="10" fill="#4f46e5" />
          <ellipse cx="123" cy="100" rx="8" ry="10" fill="#4f46e5" />
          {/* Antenna */}
          <line x1="100" y1="79" x2="100" y2="65" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
          <motion.circle cx="100" cy="63" r="4" fill="#60a5fa"
            animate={animated ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Mouth */}
          <path d="M91 110 Q100 114 109 110" stroke="#818cf8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="162" width="11" height="20" rx="4" fill="#3730a3" />
        <rect x="105" y="162" width="11" height="20" rx="4" fill="#3730a3" />
      </motion.svg>
    </div>
  );
};

export default NetopNavi;
