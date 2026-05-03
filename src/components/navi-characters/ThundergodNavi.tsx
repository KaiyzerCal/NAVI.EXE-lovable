import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const ThundergodNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="tg-body" x1="60" y1="85" x2="140" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1e1b4b" />
            <stop offset="0.5" stopColor="#312e81" />
            <stop offset="1" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="tg-lightning" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fde047" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        {/* Storm aura */}
        <motion.circle cx="100" cy="118" r="58" fill="#312e81" opacity="0.08"
          animate={animated ? { r: [58, 65, 58], opacity: [0.08, 0.16, 0.08] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="46" ry="10" fill="#1e1b4b" opacity="0.4" />
        {/* Body */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Cape */}
          <motion.path d="M68 118 Q55 152 62 174 Q80 180 100 178 Q120 180 138 174 Q145 152 132 118" fill="#312e81" opacity="0.9"
            animate={animated ? { d: ['M68 118 Q55 152 62 174 Q80 180 100 178 Q120 180 138 174 Q145 152 132 118', 'M68 118 Q53 155 60 177 Q78 183 100 180 Q122 183 140 177 Q147 155 132 118', 'M68 118 Q55 152 62 174 Q80 180 100 178 Q120 180 138 174 Q145 152 132 118'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Chest plate */}
          <rect x="76" y="112" width="48" height="44" rx="8" fill="url(#tg-body)" />
          {/* Lightning bolt chest emblem */}
          <motion.path d="M96 120 L92 132 L98 132 L94 144 L108 128 L101 128 L105 120 Z" fill="url(#tg-lightning)"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Pauldrons */}
          <ellipse cx="66" cy="116" rx="14" ry="10" fill="#4338ca" />
          <ellipse cx="134" cy="116" rx="14" ry="10" fill="#4338ca" />
          {/* Arm guards */}
          <rect x="57" y="122" width="14" height="30" rx="5" fill="#3730a3" />
          <rect x="129" y="122" width="14" height="30" rx="5" fill="#3730a3" />
          {/* Hammer */}
          <motion.g animate={animated ? { rotate: [0, -8, 0] } : {}} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '144px', originY: '145px' }}>
            <rect x="140" y="100" width="6" height="40" rx="2" fill="#64748b" />
            <rect x="132" y="96" width="22" height="16" rx="4" fill="#475569" />
            <motion.ellipse cx="143" cy="104" rx="10" ry="4" fill="#fde047" opacity="0.6"
              animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="98" rx="26" ry="24" fill="#1e1b4b" />
          {/* Crown of thunder */}
          <motion.path d="M80 88 L85 72 L92 85 L100 68 L108 85 L115 72 L120 88" stroke="#fde047" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="90" cy="98" rx="7" ry="6" fill="#fde047"
            animate={animated ? { opacity: [1, 0.5, 1], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="110" cy="98" rx="7" ry="6" fill="#fde047"
            animate={animated ? { opacity: [1, 0.5, 1], scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="98" r="3" fill="#1e1b4b" />
          <circle cx="110" cy="98" r="3" fill="#1e1b4b" />
          {/* Beard */}
          <path d="M86 108 Q100 116 114 108 Q110 120 100 122 Q90 120 86 108 Z" fill="#312e81" opacity="0.7" />
          {/* Lightning sparks */}
          <motion.path d="M52 100 L46 94 L54 91 L48 85" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M148 100 L154 94 L146 91 L152 85" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="82" y="152" width="15" height="24" rx="5" fill="#1e1b4b" />
        <rect x="103" y="152" width="15" height="24" rx="5" fill="#1e1b4b" />
      </motion.svg>
    </div>
  );
};

export default ThundergodNavi;
