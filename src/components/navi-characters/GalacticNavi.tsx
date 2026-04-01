import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GalacticNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="gl-body" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#0f0a1e" />
          </radialGradient>
          <linearGradient id="gl-galaxy" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e879f9" />
            <stop offset="0.5" stopColor="#60a5fa" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
        {/* Galaxy ring */}
        <motion.ellipse cx="100" cy="128" rx="55" ry="18" fill="none" stroke="url(#gl-galaxy)" strokeWidth="3" opacity="0.6"
          animate={animated ? { scaleX: [1, 1.05, 1], opacity: [0.6, 0.9, 0.6] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="100" cy="128" rx="48" ry="14" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4"
          animate={animated ? { scaleX: [1, 1.08, 1] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="180" rx="36" ry="8" fill="#0f0a1e" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <circle cx="100" cy="128" r="30" fill="url(#gl-body)" />
          {/* Galaxy swirl on body */}
          <motion.path d="M84 120 Q100 112 116 120 Q108 128 100 130 Q92 132 84 120" fill="#e879f9" opacity="0.25"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '124px' }} />
          {/* Orbit dots */}
          <motion.circle cx="100" cy="98" r="3" fill="#60a5fa"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '128px' }} />
          <motion.circle cx="130" cy="128" r="2.5" fill="#e879f9"
            animate={animated ? { rotate: [0, -360] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '128px' }} />
          {/* Head */}
          <circle cx="100" cy="96" r="22" fill="#4338ca" />
          {/* Cosmic hair / antenna */}
          <motion.circle cx="84" cy="78" r="5" fill="#e879f9"
            animate={animated ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <line x1="84" y1="83" x2="87" y2="90" stroke="#818cf8" strokeWidth="2" />
          <motion.circle cx="116" cy="78" r="5" fill="#60a5fa"
            animate={animated ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          <line x1="116" y1="83" x2="113" y2="90" stroke="#818cf8" strokeWidth="2" />
          {/* Eyes */}
          <motion.circle cx="91" cy="95" r="6" fill="#c7d2fe"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="95" r="6" fill="#c7d2fe"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="94" r="3" fill="#1e1b4b" />
          <circle cx="109" cy="94" r="3" fill="#1e1b4b" />
          <circle cx="92" cy="93" r="1.2" fill="white" />
          <circle cx="110" cy="93" r="1.2" fill="white" />
          {/* Mouth */}
          <path d="M93 104 Q100 108 107 104" stroke="#c7d2fe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="155" width="10" height="22" rx="4" fill="#312e81" />
        <rect x="105" y="155" width="10" height="22" rx="4" fill="#312e81" />
      </motion.svg>
    </div>
  );
};

export default GalacticNavi;
