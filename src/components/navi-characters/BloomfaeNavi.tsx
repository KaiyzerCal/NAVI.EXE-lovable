import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const BloomfaeNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="bf-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#9d174d" />
          </radialGradient>
          <radialGradient id="bf-petal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbcfe8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
          </radialGradient>
        </defs>
        {/* Bloom glow */}
        <motion.circle cx="100" cy="115" r="52" fill="#f472b6" opacity="0.08"
          animate={animated ? { r: [52, 58, 52], opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="30" ry="7" fill="#831843" opacity="0.2" />
        {/* Float/sway */}
        <motion.g animate={animated ? { y: [0, -4, 0], rotate: [0, 1, -1, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '100px', originY: '150px' }}>
          {/* Fairy wings */}
          <motion.ellipse cx="68" cy="110" rx="24" ry="14" fill="url(#bf-petal)" transform="rotate(-30, 68, 110)"
            animate={animated ? { scaleY: [1, 0.7, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="68" cy="128" rx="20" ry="10" fill="url(#bf-petal)" transform="rotate(20, 68, 128)"
            animate={animated ? { scaleY: [1, 0.7, 1], opacity: [0.6, 0.9, 0.6] } : {}}
            transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }} />
          <motion.ellipse cx="132" cy="110" rx="24" ry="14" fill="url(#bf-petal)" transform="rotate(30, 132, 110)"
            animate={animated ? { scaleY: [1, 0.7, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="132" cy="128" rx="20" ry="10" fill="url(#bf-petal)" transform="rotate(-20, 132, 128)"
            animate={animated ? { scaleY: [1, 0.7, 1], opacity: [0.6, 0.9, 0.6] } : {}}
            transition={{ duration: 0.35, repeat: Infinity, ease: 'easeInOut', delay: 0.05 }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="24" ry="22" fill="url(#bf-body)" />
          {/* Flower petal skirt */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const px = 100 + 20 * Math.cos(rad);
            const py = 150 + 10 * Math.sin(rad);
            return (
              <motion.ellipse key={i} cx={px} cy={py} rx="8" ry="5" fill="#f9a8d4" opacity="0.7" transform={`rotate(${angle}, ${px}, ${py})`}
                animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }} />
            );
          })}
          {/* Head */}
          <ellipse cx="100" cy="100" rx="20" ry="18" fill="#f472b6" />
          {/* Flower crown */}
          <circle cx="86" cy="85" r="7" fill="#fbbf24" />
          <circle cx="86" cy="85" r="4" fill="#f59e0b" />
          <circle cx="100" cy="80" r="8" fill="#f9a8d4" />
          <circle cx="100" cy="80" r="4.5" fill="#fbbf24" />
          <circle cx="114" cy="85" r="7" fill="#fce7f3" />
          <circle cx="114" cy="85" r="4" fill="#fbbf24" />
          {/* Eyes */}
          <motion.circle cx="92" cy="100" r="5" fill="#fce7f3"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.circle cx="108" cy="100" r="5" fill="#fce7f3"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="92" cy="99" r="2.2" fill="#831843" />
          <circle cx="108" cy="99" r="2.2" fill="#831843" />
          <circle cx="93" cy="98" r="0.9" fill="white" />
          <circle cx="109" cy="98" r="0.9" fill="white" />
          {/* Smile */}
          <path d="M94 108 Q100 112 106 108" stroke="#fce7f3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Pollen sparkles */}
          <motion.circle cx="55" cy="110" r="2.5" fill="#fbbf24" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], y: [0, -8, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="148" cy="118" r="2" fill="#f9a8d4" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], y: [0, -6, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.7, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="88" y="148" width="9" height="22" rx="4" fill="#9d174d" />
        <rect x="103" y="148" width="9" height="22" rx="4" fill="#9d174d" />
      </motion.svg>
    </div>
  );
};

export default BloomfaeNavi;
