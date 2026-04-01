import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const NebulaNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="nb-body" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="40%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="nb-cloud" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f9a8d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Nebula cloud layers */}
        <motion.ellipse cx="88" cy="115" rx="48" ry="38" fill="url(#nb-cloud)"
          animate={animated ? { rx: [48, 52, 48], ry: [38, 42, 38] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.ellipse cx="112" cy="125" rx="42" ry="34" fill="#7c3aed" opacity="0.15"
          animate={animated ? { rx: [42, 46, 42] } : {}}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#1e1b4b" opacity="0.25" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Cloudy lower body / trail */}
          <motion.path d="M70 145 Q66 165 76 175 Q88 180 100 178 Q112 180 124 175 Q134 165 130 145" fill="#7c3aed" opacity="0.7"
            animate={animated ? { d: ['M70 145 Q66 165 76 175 Q88 180 100 178 Q112 180 124 175 Q134 165 130 145', 'M70 145 Q64 168 74 178 Q86 182 100 180 Q114 182 126 178 Q136 168 130 145', 'M70 145 Q66 165 76 175 Q88 180 100 178 Q112 180 124 175 Q134 165 130 145'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body sphere */}
          <circle cx="100" cy="128" r="30" fill="url(#nb-body)" />
          {/* Nebula swirls on body */}
          <motion.path d="M82 122 Q92 118 100 122 Q108 126 116 122 Q108 130 100 128 Q92 130 82 122" fill="#f9a8d4" opacity="0.35"
            animate={animated ? { opacity: [0.35, 0.6, 0.35] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <circle cx="100" cy="98" r="22" fill="#9333ea" />
          {/* Hair cloud */}
          <motion.ellipse cx="100" cy="82" rx="24" ry="16" fill="#a855f7" opacity="0.8"
            animate={animated ? { ry: [16, 18, 16] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="84" cy="84" rx="12" ry="10" fill="#c084fc" opacity="0.6"
            animate={animated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="116" cy="84" rx="12" ry="10" fill="#c084fc" opacity="0.6"
            animate={animated ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="97" r="6" fill="#fce7f3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="97" r="6" fill="#fce7f3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="96" r="3" fill="#581c87" />
          <circle cx="109" cy="96" r="3" fill="#581c87" />
          <circle cx="92" cy="95" r="1.2" fill="white" />
          <circle cx="110" cy="95" r="1.2" fill="white" />
          {/* Mouth */}
          <path d="M93 107 Q100 111 107 107" stroke="#fce7f3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Floating cosmic particles */}
          <motion.circle cx="58" cy="108" r="3" fill="#f472b6" opacity="0.7"
            animate={animated ? { x: [0, 5, 0], opacity: [0.7, 0.3, 0.7] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="145" cy="118" r="2.5" fill="#c084fc" opacity="0.7"
            animate={animated ? { x: [0, -5, 0], opacity: [0.7, 0.3, 0.7] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.7, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default NebulaNavi;
