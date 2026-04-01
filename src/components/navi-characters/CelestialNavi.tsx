import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const CelestialNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="cl-body" x1="70" y1="88" x2="130" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e0e7ff" />
            <stop offset="0.5" stopColor="#818cf8" />
            <stop offset="1" stopColor="#3730a3" />
          </linearGradient>
          <radialGradient id="cl-wings" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
          </radialGradient>
        </defs>
        {/* Celestial glow */}
        <motion.ellipse cx="100" cy="112" rx="58" ry="55" fill="#818cf8" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#1e1b4b" opacity="0.25" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Angel wings */}
          <motion.path d="M70 120 Q42 98 36 68 Q54 85 62 110 Q66 106 70 116" fill="url(#cl-wings)"
            animate={animated ? { d: ['M70 120 Q42 98 36 68 Q54 85 62 110 Q66 106 70 116', 'M70 120 Q40 95 34 65 Q53 83 62 108 Q66 106 70 116', 'M70 120 Q42 98 36 68 Q54 85 62 110 Q66 106 70 116'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M70 120 Q50 108 42 90 Q56 100 64 116" fill="url(#cl-wings)" opacity="0.6"
            animate={animated ? { d: ['M70 120 Q50 108 42 90 Q56 100 64 116', 'M70 120 Q48 106 40 88 Q55 98 64 116', 'M70 120 Q50 108 42 90 Q56 100 64 116'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M130 120 Q158 98 164 68 Q146 85 138 110 Q134 106 130 116" fill="url(#cl-wings)"
            animate={animated ? { d: ['M130 120 Q158 98 164 68 Q146 85 138 110 Q134 106 130 116', 'M130 120 Q160 95 166 65 Q147 83 138 108 Q134 106 130 116', 'M130 120 Q158 98 164 68 Q146 85 138 110 Q134 106 130 116'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M130 120 Q150 108 158 90 Q144 100 136 116" fill="url(#cl-wings)" opacity="0.6"
            animate={animated ? { d: ['M130 120 Q150 108 158 90 Q144 100 136 116', 'M130 120 Q152 106 160 88 Q145 98 136 116', 'M130 120 Q150 108 158 90 Q144 100 136 116'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="28" ry="26" fill="url(#cl-body)" />
          {/* Celestial robe */}
          <path d="M78 122 L78 155 Q86 160 100 158 Q114 160 122 155 L122 122 Q110 115 100 114 Q90 115 78 122 Z" fill="#4338ca" opacity="0.6" />
          {/* Star pattern on robe */}
          <motion.polygon points="100,124 98,130 92,130 97,134 95,140 100,136 105,140 103,134 108,130 102,130" fill="#e0e7ff" opacity="0.6"
            animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="98" rx="22" ry="20" fill="#c7d2fe" />
          {/* Halo */}
          <motion.ellipse cx="100" cy="78" rx="18" ry="5" fill="none" stroke="#fef9c3" strokeWidth="2.5"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="97" r="5.5" fill="#e0e7ff"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.circle cx="109" cy="97" r="5.5" fill="#e0e7ff"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="91" cy="96" r="2.5" fill="#1e1b4b" />
          <circle cx="109" cy="96" r="2.5" fill="#1e1b4b" />
          <circle cx="92" cy="95" r="1" fill="white" />
          <circle cx="110" cy="95" r="1" fill="white" />
          {/* Smile */}
          <path d="M93 106 Q100 110 107 106" stroke="#e0e7ff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Sparkles */}
          <motion.circle cx="55" cy="105" r="3" fill="#e0e7ff" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="148" cy="112" r="2.5" fill="#c7d2fe" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="152" width="10" height="22" rx="4" fill="#3730a3" />
        <rect x="104" y="152" width="10" height="22" rx="4" fill="#3730a3" />
      </motion.svg>
    </div>
  );
};

export default CelestialNavi;
