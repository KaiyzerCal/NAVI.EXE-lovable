import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const RagnarokNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="rk-body" x1="55" y1="80" x2="145" y2="178" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1c1917" />
            <stop offset="0.4" stopColor="#292524" />
            <stop offset="1" stopColor="#0c0a09" />
          </linearGradient>
          <radialGradient id="rk-rune" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" />
          </radialGradient>
        </defs>
        {/* Apocalyptic aura */}
        <motion.circle cx="100" cy="120" r="65" fill="#dc2626" opacity="0.07"
          animate={animated ? { r: [65, 72, 65], opacity: [0.07, 0.14, 0.07] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="182" rx="50" ry="11" fill="#0c0a09" opacity="0.6" />
        {/* Tremor effect */}
        <motion.g animate={animated ? { x: [0, 1, -1, 0] } : {}} transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}>
          <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Dark wings */}
            <motion.path d="M68 118 Q38 85 30 52 Q55 78 62 112 Q70 104 74 116" fill="#1c1917"
              animate={animated ? { d: ['M68 118 Q38 85 30 52 Q55 78 62 112 Q70 104 74 116', 'M68 118 Q36 82 28 48 Q54 76 62 110 Q70 104 74 116', 'M68 118 Q38 85 30 52 Q55 78 62 112 Q70 104 74 116'] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M132 118 Q162 85 170 52 Q145 78 138 112 Q130 104 126 116" fill="#1c1917"
              animate={animated ? { d: ['M132 118 Q162 85 170 52 Q145 78 138 112 Q130 104 126 116', 'M132 118 Q164 82 172 48 Q146 76 138 110 Q130 104 126 116', 'M132 118 Q162 85 170 52 Q145 78 138 112 Q130 104 126 116'] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            {/* Wing rune glow */}
            <motion.path d="M44 88 Q48 82 52 88 Q48 94 44 88" fill="url(#rk-rune)" opacity="0.7"
              animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M148 88 Q152 82 156 88 Q152 94 148 88" fill="url(#rk-rune)" opacity="0.7"
              animate={animated ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
            {/* Armor body */}
            <ellipse cx="100" cy="148" rx="44" ry="32" fill="url(#rk-body)" />
            {/* Rune cracks / glowing fissures */}
            <motion.path d="M84 136 L88 148 L86 155" stroke="#f97316" strokeWidth="2" fill="none" strokeLinecap="round"
              animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M112 138 L110 150 L114 158" stroke="#dc2626" strokeWidth="2" fill="none" strokeLinecap="round"
              animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
            {/* Central rune */}
            <motion.polygon points="100,134 95,145 100,156 105,145" fill="none" stroke="url(#rk-rune)" strokeWidth="2"
              animate={animated ? { opacity: [0.8, 1, 0.8], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '100px', originY: '145px' }} />
            {/* Pauldrons */}
            <ellipse cx="60" cy="122" rx="16" ry="12" fill="#292524" />
            <ellipse cx="140" cy="122" rx="16" ry="12" fill="#292524" />
            {/* Spike on pauldrons */}
            <polygon points="60,110 56,100 64,110" fill="#1c1917" />
            <polygon points="140,110 136,100 144,110" fill="#1c1917" />
            {/* Arms */}
            <rect x="50" y="128" width="14" height="34" rx="5" fill="#292524" />
            <rect x="136" y="128" width="14" height="34" rx="5" fill="#292524" />
            {/* Head */}
            <ellipse cx="100" cy="102" rx="28" ry="25" fill="#1c1917" />
            {/* Skull-like helmet */}
            <path d="M76 96 Q78 78 100 74 Q122 78 124 96" fill="#292524" />
            {/* Horns */}
            <path d="M78 86 L66 58 L80 80" fill="#1c1917" />
            <path d="M122 86 L134 58 L120 80" fill="#1c1917" />
            {/* Rune cracks on helm */}
            <motion.path d="M88 84 L92 90 L90 96" stroke="#f97316" strokeWidth="1.5" fill="none"
              animate={animated ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.path d="M108 84 L106 90 L110 96" stroke="#dc2626" strokeWidth="1.5" fill="none"
              animate={animated ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
            {/* Eyes */}
            <motion.ellipse cx="88" cy="100" rx="7" ry="6" fill="url(#rk-rune)"
              animate={animated ? { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.ellipse cx="112" cy="100" rx="7" ry="6" fill="url(#rk-rune)"
              animate={animated ? { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
            <circle cx="88" cy="100" r="3" fill="#1c1917" />
            <circle cx="112" cy="100" r="3" fill="#1c1917" />
            {/* Jaw */}
            <path d="M85 112 Q100 120 115 112 Q108 122 100 124 Q92 122 85 112 Z" fill="#1c1917" />
          </motion.g>
        </motion.g>
        {/* Legs */}
        <rect x="82" y="175" width="14" height="16" rx="4" fill="#292524" />
        <rect x="104" y="175" width="14" height="16" rx="4" fill="#292524" />
      </motion.svg>
    </div>
  );
};

export default RagnarokNavi;
