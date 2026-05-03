import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const OracleNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="or-robe" x1="68" y1="100" x2="132" y2="178" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1b4b" />
            <stop offset="1" stopColor="#0f0a1e" />
          </linearGradient>
          <radialGradient id="or-orb" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#f0e6ff" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#2e1065" />
          </radialGradient>
          <radialGradient id="or-vision" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Prophetic vision aura */}
        <motion.circle cx="100" cy="118" r="55" fill="url(#or-vision)"
          animate={animated ? { r: [55, 63, 55], opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Rune circles */}
        <motion.circle cx="100" cy="118" r="48" fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="6,4" opacity="0.3"
          animate={animated ? { rotate: [0, 360] } : {}}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        <motion.circle cx="100" cy="118" r="38" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="4,6" opacity="0.25"
          animate={animated ? { rotate: [0, -360] } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#0f0a1e" opacity="0.4" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Ancient robe */}
          <motion.path d="M70 120 Q62 152 70 170 Q84 178 100 176 Q116 178 130 170 Q138 152 130 120" fill="url(#or-robe)"
            animate={animated ? { d: ['M70 120 Q62 152 70 170 Q84 178 100 176 Q116 178 130 170 Q138 152 130 120', 'M70 120 Q60 156 68 173 Q82 180 100 178 Q118 180 132 173 Q140 156 130 120', 'M70 120 Q62 152 70 170 Q84 178 100 176 Q116 178 130 170 Q138 152 130 120'] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Robe runes */}
          <motion.text x="90" y="148" fontSize="11" fill="#a78bfa" opacity="0.5" fontFamily="serif"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>☽</motion.text>
          <motion.text x="104" y="160" fontSize="9" fill="#818cf8" opacity="0.4" fontFamily="serif"
            animate={animated ? { opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}>✦</motion.text>
          {/* Body */}
          <ellipse cx="100" cy="128" rx="28" ry="24" fill="#1e1b4b" />
          {/* Seeing eye brooch */}
          <motion.ellipse cx="100" cy="124" rx="10" ry="7" fill="#fef9c3" opacity="0.8"
            animate={animated ? { scaleX: [1, 0.4, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="100" cy="124" r="4" fill="url(#or-orb)"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="100" cy="124" r="2" fill="#0f0a1e" />
          {/* Arms */}
          <rect x="64" y="116" width="12" height="30" rx="5" fill="#1e1b4b" />
          <rect x="124" y="116" width="12" height="30" rx="5" fill="#1e1b4b" />
          {/* Crystal orb */}
          <motion.circle cx="138" cy="130" r="10" fill="url(#or-orb)" opacity="0.9"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="138" cy="130" r="5" fill="#e9d5ff" opacity="0.7"
            animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Visions in orb */}
          <motion.circle cx="138" cy="130" r="3" fill="#fde047" opacity="0.6"
            animate={animated ? { scale: [0.5, 1.2, 0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#312e81" />
          {/* Veil / hood */}
          <path d="M80 96 Q78 78 100 74 Q122 78 120 96 Q108 88 100 89 Q92 88 80 96 Z" fill="#1e1b4b" opacity="0.9" />
          {/* Star diadem */}
          <motion.polygon points="100,76 97,83 90,83 96,87 93,94 100,90 107,94 104,87 110,83 103,83" fill="#fef9c3" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9], scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '85px' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="101" r="5.5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 6 }} />
          <motion.circle cx="109" cy="101" r="5.5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 6 }} />
          <circle cx="91" cy="100" r="2.5" fill="#0f0a1e" />
          <circle cx="109" cy="100" r="2.5" fill="#0f0a1e" />
          <circle cx="92" cy="99" r="1" fill="white" opacity="0.8" />
          <circle cx="110" cy="99" r="1" fill="white" opacity="0.8" />
          {/* Serene mouth */}
          <path d="M93 109 Q100 113 107 109" stroke="#c4b5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="168" width="10" height="20" rx="4" fill="#1e1b4b" />
        <rect x="104" y="168" width="10" height="20" rx="4" fill="#1e1b4b" />
      </motion.svg>
    </div>
  );
};

export default OracleNavi;
