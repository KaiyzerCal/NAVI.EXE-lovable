import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const XenomorphNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="xn-body" x1="65" y1="80" x2="135" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1a2535" />
            <stop offset="0.5" stopColor="#0f1824" />
            <stop offset="1" stopColor="#060d18" />
          </linearGradient>
          <radialGradient id="xn-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Alien bioluminescence */}
        <motion.ellipse cx="100" cy="125" rx="50" ry="42" fill="url(#xn-glow)"
          animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#060d18" opacity="0.5" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Tail */}
          <motion.path d="M60 155 Q35 148 30 170 Q45 180 62 164" fill="#0f1824"
            animate={animated ? { d: ['M60 155 Q35 148 30 170 Q45 180 62 164', 'M60 155 Q33 145 28 168 Q44 179 62 164', 'M60 155 Q35 148 30 170 Q45 180 62 164'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="145" rx="38" ry="28" fill="url(#xn-body)" />
          {/* Rib/exoskeleton ribs */}
          {[135, 142, 150, 158].map((y, i) => (
            <motion.path key={i} d={`M72 ${y} Q100 ${y - 5} 128 ${y}`} stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.4"
              animate={animated ? { opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
          ))}
          {/* Arms */}
          <motion.path d="M62 128 Q45 115 42 100 Q52 112 60 126" stroke="#1a2535" strokeWidth="8" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M62 128 Q45 115 42 100 Q52 112 60 126', 'M62 128 Q43 113 40 98 Q51 111 60 126', 'M62 128 Q45 115 42 100 Q52 112 60 126'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M138 128 Q155 115 158 100 Q148 112 140 126" stroke="#1a2535" strokeWidth="8" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M138 128 Q155 115 158 100 Q148 112 140 126', 'M138 128 Q157 113 160 98 Q149 111 140 126', 'M138 128 Q155 115 158 100 Q148 112 140 126'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Claws */}
          <line x1="42" y1="100" x2="36" y2="94" stroke="#0f1824" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="100" x2="38" y2="92" stroke="#0f1824" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="158" y1="100" x2="164" y2="94" stroke="#0f1824" strokeWidth="3" strokeLinecap="round" />
          <line x1="158" y1="100" x2="162" y2="92" stroke="#0f1824" strokeWidth="2.5" strokeLinecap="round" />
          {/* Elongated head */}
          <path d="M78 106 Q78 70 100 62 Q122 70 122 106 Q112 116 100 118 Q88 116 78 106 Z" fill="#0f1824" />
          {/* Head ridge */}
          <path d="M92 104 Q100 62 108 104" stroke="#1a2535" strokeWidth="3" fill="none" />
          {/* No visible eyes normally */}
          <motion.ellipse cx="89" cy="98" rx="5" ry="4" fill="#06b6d4" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="111" cy="98" rx="5" ry="4" fill="#06b6d4" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Inner jaw */}
          <motion.path d="M90 110 Q100 116 110 110" stroke="#06b6d4" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={animated ? { d: ['M90 110 Q100 116 110 110', 'M90 110 Q100 118 110 110', 'M90 110 Q100 116 110 110'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Drip */}
          <motion.ellipse cx="100" cy="117" rx="2" ry="4" fill="#06b6d4" opacity="0.5"
            animate={animated ? { scaleY: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="82" y="168" width="12" height="20" rx="4" fill="#0f1824" />
        <rect x="106" y="168" width="12" height="20" rx="4" fill="#0f1824" />
      </motion.svg>
    </div>
  );
};

export default XenomorphNavi;
