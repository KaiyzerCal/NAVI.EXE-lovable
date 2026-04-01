import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const SolarisNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="sl-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="sl-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Solar corona */}
        <motion.circle cx="100" cy="108" r="65" fill="url(#sl-sun)"
          animate={animated ? { r: [65, 72, 65], opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Solar rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 100 + 58 * Math.cos(rad);
          const y1 = 108 + 58 * Math.sin(rad);
          const x2 = 100 + 72 * Math.cos(rad);
          const y2 = 108 + 72 * Math.sin(rad);
          return (
            <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fef08a" strokeWidth="3" strokeLinecap="round"
              animate={animated ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }} />
          );
        })}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#78350f" opacity="0.25" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <circle cx="100" cy="128" r="30" fill="url(#sl-body)" />
          {/* Solar flare pattern */}
          <motion.circle cx="100" cy="128" r="18" fill="none" stroke="#fef9c3" strokeWidth="2" opacity="0.5"
            animate={animated ? { r: [18, 22, 18] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <circle cx="100" cy="96" r="22" fill="#fbbf24" />
          {/* Solar halo */}
          <motion.circle cx="100" cy="96" r="26" fill="none" stroke="#fef9c3" strokeWidth="2.5" opacity="0.6"
            animate={animated ? { r: [26, 30, 26], opacity: [0.6, 0.2, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="93" r="6" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="93" r="6" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="92" r="3" fill="#78350f" />
          <circle cx="109" cy="92" r="3" fill="#78350f" />
          <circle cx="92" cy="91" r="1.2" fill="white" />
          <circle cx="110" cy="91" r="1.2" fill="white" />
          {/* Smile */}
          <path d="M92 103 Q100 108 108 103" stroke="#fef9c3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="155" width="10" height="22" rx="4" fill="#b45309" />
        <rect x="104" y="155" width="10" height="22" rx="4" fill="#b45309" />
      </motion.svg>
    </div>
  );
};

export default SolarisNavi;
