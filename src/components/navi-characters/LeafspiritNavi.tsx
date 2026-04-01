import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const LeafspiritNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="ls-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
        </defs>
        {/* Nature glow */}
        <motion.ellipse cx="100" cy="118" rx="46" ry="42" fill="#22c55e" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.16, 0.08] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="32" ry="7" fill="#14532d" opacity="0.25" />
        {/* Float/sway */}
        <motion.g animate={animated ? { y: [0, -4, 0], rotate: [0, 1, -1, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '100px', originY: '150px' }}>
          {/* Leaf wings */}
          <motion.path d="M70 120 Q50 100 46 78 Q62 92 68 116" fill="#4ade80" opacity="0.75"
            animate={animated ? { d: ['M70 120 Q50 100 46 78 Q62 92 68 116', 'M70 120 Q48 98 44 76 Q61 90 68 116', 'M70 120 Q50 100 46 78 Q62 92 68 116'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M130 120 Q150 100 154 78 Q138 92 132 116" fill="#4ade80" opacity="0.75"
            animate={animated ? { d: ['M130 120 Q150 100 154 78 Q138 92 132 116', 'M130 120 Q152 98 156 76 Q139 90 132 116', 'M130 120 Q150 100 154 78 Q138 92 132 116'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Leaf veins on wings */}
          <path d="M58 92 L68 116" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
          <path d="M142 92 L132 116" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="26" ry="24" fill="url(#ls-body)" />
          {/* Leaf collar */}
          <path d="M78 116 Q86 110 100 108 Q114 110 122 116 Q114 122 100 120 Q86 122 78 116 Z" fill="#4ade80" opacity="0.8" />
          {/* Vine wrapping */}
          <path d="M78 130 Q84 124 90 130 Q84 136 78 130" stroke="#16a34a" strokeWidth="1.5" fill="none" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="20" ry="19" fill="#22c55e" />
          {/* Leaf crown */}
          <motion.path d="M84 90 Q86 75 96 70 Q98 80 92 90" fill="#4ade80"
            animate={animated ? { rotate: [0, 3, -3, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '90px', originY: '90px' }} />
          <motion.path d="M100 87 Q102 72 108 68 Q110 78 104 88" fill="#86efac"
            animate={animated ? { rotate: [0, -3, 3, 0] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
            style={{ originX: '105px', originY: '87px' }} />
          <motion.path d="M113 90 Q118 75 112 70 Q108 80 110 90" fill="#4ade80"
            animate={animated ? { rotate: [0, 3, -2, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}
            style={{ originX: '112px', originY: '90px' }} />
          {/* Eyes */}
          <motion.circle cx="92" cy="99" r="5" fill="#bbf7d0"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <motion.circle cx="108" cy="99" r="5" fill="#bbf7d0"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 5 }} />
          <circle cx="92" cy="98" r="2.2" fill="#14532d" />
          <circle cx="108" cy="98" r="2.2" fill="#14532d" />
          {/* Mouth */}
          <path d="M94 107 Q100 111 106 107" stroke="#bbf7d0" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Floating leaf */}
          <motion.path d="M136 94 Q140 88 144 94 Q140 100 136 94" fill="#4ade80"
            animate={animated ? { y: [0, -10, 0], x: [0, -5, 0], rotate: [0, 20, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '140px', originY: '94px' }} />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="150" width="10" height="22" rx="4" fill="#16a34a" />
        <rect x="104" y="150" width="10" height="22" rx="4" fill="#16a34a" />
      </motion.svg>
    </div>
  );
};

export default LeafspiritNavi;
