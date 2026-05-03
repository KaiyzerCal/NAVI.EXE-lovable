import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const TidecallerNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="tc-body" x1="65" y1="85" x2="135" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#0369a1" />
            <stop offset="1" stopColor="#0c4a6e" />
          </linearGradient>
          <linearGradient id="tc-robe" x1="75" y1="110" x2="125" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0ea5e9" />
            <stop offset="1" stopColor="#075985" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <ellipse cx="100" cy="175" rx="36" ry="9" fill="#0c4a6e" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3.5, 0] } : {}} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Water cloak */}
          <motion.path d="M68 130 Q60 158 80 170 Q100 178 120 170 Q140 158 132 130 Q116 148 100 150 Q84 148 68 130 Z" fill="url(#tc-robe)"
            animate={animated ? { d: ['M68 130 Q60 158 80 170 Q100 178 120 170 Q140 158 132 130 Q116 148 100 150 Q84 148 68 130 Z', 'M68 130 Q62 160 82 172 Q100 178 118 172 Q138 160 132 130 Q116 150 100 152 Q84 150 68 130 Z', 'M68 130 Q60 158 80 170 Q100 178 120 170 Q140 158 132 130 Q116 148 100 150 Q84 148 68 130 Z'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="128" rx="32" ry="26" fill="url(#tc-body)" />
          {/* Water swirl on chest */}
          <motion.path d="M88 125 Q97 118 106 125 Q100 132 94 125" stroke="#bae6fd" strokeWidth="2" fill="none"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '97px', originY: '125px' }} />
          {/* Head */}
          <ellipse cx="100" cy="98" rx="22" ry="20" fill="#38bdf8" />
          {/* Hood / fin crest */}
          <motion.path d="M84 88 Q82 65 100 60 Q118 65 116 88" fill="#0ea5e9" opacity="0.8"
            animate={animated ? { d: ['M84 88 Q82 65 100 60 Q118 65 116 88', 'M84 88 Q80 62 100 57 Q120 62 116 88', 'M84 88 Q82 65 100 60 Q118 65 116 88'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="92" cy="96" rx="5.5" ry="5" fill="#bae6fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.ellipse cx="108" cy="96" rx="5.5" ry="5" fill="#bae6fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="92" cy="95" r="2.5" fill="#0c4a6e" />
          <circle cx="108" cy="95" r="2.5" fill="#0c4a6e" />
          <circle cx="93" cy="94" r="1" fill="white" />
          <circle cx="109" cy="94" r="1" fill="white" />
          {/* Mouth */}
          <path d="M94 104 Q100 108 106 104" stroke="#bae6fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Water orb staff */}
          <motion.circle cx="138" cy="108" r="8" fill="#38bdf8" opacity="0.7"
            animate={animated ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <line x1="132" y1="128" x2="138" y2="116" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" />
          {/* Water drops around */}
          <motion.ellipse cx="62" cy="118" rx="3" ry="5" fill="#38bdf8" opacity="0.6"
            animate={animated ? { y: [0, 8, 0], opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="150" cy="130" rx="2.5" ry="4" fill="#38bdf8" opacity="0.5"
            animate={animated ? { y: [0, 6, 0], opacity: [0.5, 0, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs / robe hem */}
        <rect x="86" y="168" width="10" height="18" rx="4" fill="#0369a1" />
        <rect x="104" y="168" width="10" height="18" rx="4" fill="#0369a1" />
      </motion.svg>
    </div>
  );
};

export default TidecallerNavi;
