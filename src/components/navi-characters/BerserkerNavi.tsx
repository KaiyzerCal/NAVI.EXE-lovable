import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const BerserkerNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="bk-body" x1="60" y1="88" x2="140" y2="172" gradientUnits="userSpaceOnUse">
            <stop stopColor="#dc2626" />
            <stop offset="1" stopColor="#1c0000" />
          </linearGradient>
        </defs>
        {/* Rage aura */}
        <motion.ellipse cx="100" cy="128" rx="52" ry="46" fill="#dc2626" opacity="0.1"
          animate={animated ? { opacity: [0.1, 0.22, 0.1], rx: [52, 55, 52], ry: [46, 49, 46] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="176" rx="46" ry="11" fill="#1c0000" opacity="0.4" />
        {/* Body shake */}
        <motion.g animate={animated ? { x: [0, 1, -1, 0] } : {}} transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}>
          <motion.g animate={animated ? { y: [0, -1, 0] } : {}} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Body - large, hulking */}
            <ellipse cx="100" cy="145" rx="46" ry="32" fill="url(#bk-body)" />
            {/* Scarred chest marks */}
            <path d="M88 130 L93 142" stroke="#ff6b6b" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            <path d="M107 128 L110 143" stroke="#ff6b6b" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
            <path d="M96 134 L104 134" stroke="#ff6b6b" strokeWidth="1.5" opacity="0.5" />
            {/* Arms - thick */}
            <motion.rect x="48" y="114" width="20" height="40" rx="8" fill="#b91c1c"
              animate={animated ? { rotate: [0, -8, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '58px', originY: '114px' }} />
            <motion.rect x="132" y="114" width="20" height="40" rx="8" fill="#b91c1c"
              animate={animated ? { rotate: [0, 8, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ originX: '142px', originY: '114px' }} />
            {/* Fists */}
            <ellipse cx="58" cy="157" rx="12" ry="9" fill="#991b1b" />
            <ellipse cx="142" cy="157" rx="12" ry="9" fill="#991b1b" />
            {/* Axe */}
            <motion.g animate={animated ? { rotate: [0, 5, -3, 0] } : {}} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '58px', originY: '145px' }}>
              <rect x="30" y="100" width="5" height="50" rx="2" fill="#6b7280" />
              <path d="M22 100 Q18 115 25 122 Q35 118 35 100 Z" fill="#9ca3af" />
              <path d="M35 100 Q38 115 32 122 Q22 118 22 100 Z" fill="#d1d5db" />
            </motion.g>
            {/* Head */}
            <ellipse cx="100" cy="100" rx="28" ry="25" fill="#dc2626" />
            {/* Horned helmet */}
            <path d="M76 88 L65 65 L80 82" fill="#1f2937" />
            <path d="M124 88 L135 65 L120 82" fill="#1f2937" />
            {/* Angry brow */}
            <path d="M82 92 L94 96" stroke="#1c0000" strokeWidth="4" strokeLinecap="round" />
            <path d="M106 96 L118 92" stroke="#1c0000" strokeWidth="4" strokeLinecap="round" />
            {/* Glowing red eyes */}
            <motion.circle cx="90" cy="101" r="6" fill="#ff0000"
              animate={animated ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.circle cx="110" cy="101" r="6" fill="#ff0000"
              animate={animated ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
            <circle cx="90" cy="101" r="2.5" fill="#1c0000" />
            <circle cx="110" cy="101" r="2.5" fill="#1c0000" />
            {/* Snarl */}
            <path d="M90 112 L95 108 L100 111 L105 108 L110 112" stroke="#fca5a5" strokeWidth="2" fill="none" strokeLinecap="round" />
          </motion.g>
        </motion.g>
        {/* Legs */}
        <rect x="80" y="172" width="16" height="20" rx="5" fill="#7f1d1d" />
        <rect x="104" y="172" width="16" height="20" rx="5" fill="#7f1d1d" />
      </motion.svg>
    </div>
  );
};

export default BerserkerNavi;
