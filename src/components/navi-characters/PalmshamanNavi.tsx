import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const PalmshamanNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="ps-body" x1="70" y1="90" x2="130" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d97706" />
            <stop offset="1" stopColor="#78350f" />
          </linearGradient>
        </defs>
        {/* Tropical glow */}
        <motion.ellipse cx="100" cy="120" rx="46" ry="40" fill="#22c55e" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#451a03" opacity="0.3" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2.5, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Grass skirt */}
          <motion.path d="M74 150 Q80 165 76 178" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M74 150 Q80 165 76 178', 'M74 150 Q82 167 78 180', 'M74 150 Q80 165 76 178'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M82 152 Q86 167 84 180" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M82 152 Q86 167 84 180', 'M82 152 Q88 169 86 182', 'M82 152 Q86 167 84 180'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.path d="M100 154 Q100 168 100 181" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M100 154 Q100 168 100 181', 'M100 154 Q102 170 100 183', 'M100 154 Q100 168 100 181'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          <motion.path d="M118 152 Q114 167 116 180" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M118 152 Q114 167 116 180', 'M118 152 Q112 169 114 182', 'M118 152 Q114 167 116 180'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} />
          <motion.path d="M126 150 Q120 165 124 178" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M126 150 Q120 165 124 178', 'M126 150 Q118 167 122 180', 'M126 150 Q120 165 124 178'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.8, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="135" rx="30" ry="24" fill="url(#ps-body)" />
          {/* Tribal markings */}
          <path d="M84 128 L90 132 L84 136" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M116 128 L110 132 L116 136" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Necklace */}
          <path d="M82 122 Q100 118 118 122" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="119" r="3" fill="#b45309" />
          {/* Arms */}
          <rect x="62" y="118" width="12" height="28" rx="5" fill="#b45309" />
          <rect x="126" y="118" width="12" height="28" rx="5" fill="#b45309" />
          {/* Staff */}
          <motion.g animate={animated ? { rotate: [0, -5, 2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '58px', originY: '138px' }}>
            <line x1="52" y1="85" x2="58" y2="150" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
            {/* Palm leaves on staff top */}
            <path d="M44 88 Q48 80 56 84 Q52 90 44 88" fill="#16a34a" />
            <path d="M52 80 Q58 72 64 78 Q60 84 52 80" fill="#22c55e" />
            <path d="M60 84 Q66 76 70 82 Q64 86 60 84" fill="#16a34a" />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="102" rx="22" ry="20" fill="#d97706" />
          {/* Headdress */}
          <rect x="82" y="84" width="36" height="8" rx="3" fill="#b45309" />
          {/* Feathers in headdress */}
          <motion.path d="M86 84 Q80 68 84 58 Q88 68 88 84" fill="#4ade80"
            animate={animated ? { rotate: [0, 4, -2, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '86px', originY: '84px' }} />
          <motion.path d="M96 82 Q92 64 98 54 Q102 66 98 82" fill="#f97316"
            animate={animated ? { rotate: [0, -3, 3, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
            style={{ originX: '97px', originY: '82px' }} />
          <motion.path d="M106 82 Q110 64 104 54 Q100 66 104 82" fill="#fbbf24"
            animate={animated ? { rotate: [0, 4, -2, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }}
            style={{ originX: '105px', originY: '82px' }} />
          <motion.path d="M114 84 Q120 68 116 58 Q112 68 112 84" fill="#4ade80"
            animate={animated ? { rotate: [0, -4, 2, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }}
            style={{ originX: '115px', originY: '84px' }} />
          {/* Eyes */}
          <motion.ellipse cx="92" cy="102" rx="5" ry="4.5" fill="#fef3c7"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.ellipse cx="108" cy="102" rx="5" ry="4.5" fill="#fef3c7"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="92" cy="101" r="2.2" fill="#451a03" />
          <circle cx="108" cy="101" r="2.2" fill="#451a03" />
          {/* Tribal face paint */}
          <path d="M82 100 L88 102" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M112 100 L118 102" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          {/* Mouth */}
          <path d="M93 110 Q100 114 107 110" stroke="#fef3c7" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default PalmshamanNavi;
