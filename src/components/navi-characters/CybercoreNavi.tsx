import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const CybercoreNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="cc-body" x1="65" y1="88" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f2937" />
            <stop offset="1" stopColor="#030712" />
          </linearGradient>
          <linearGradient id="cc-accent" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#06b6d4" />
            <stop offset="1" stopColor="#0e7490" />
          </linearGradient>
        </defs>
        {/* Cyber glow */}
        <motion.ellipse cx="100" cy="120" rx="48" ry="42" fill="#06b6d4" opacity="0.08"
          animate={animated ? { opacity: [0.08, 0.16, 0.08] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Grid lines */}
        <motion.line x1="60" y1="80" x2="140" y2="80" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2"
          animate={animated ? { opacity: [0.2, 0.4, 0.2] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.line x1="60" y1="160" x2="140" y2="160" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2"
          animate={animated ? { opacity: [0.2, 0.4, 0.2] } : {}}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#000" opacity="0.5" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Cyber body */}
          <rect x="72" y="112" width="56" height="56" rx="8" fill="url(#cc-body)" />
          {/* Panel lines */}
          <line x1="72" y1="130" x2="128" y2="130" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
          <line x1="72" y1="148" x2="128" y2="148" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
          <line x1="100" y1="112" x2="100" y2="168" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
          {/* Energy core */}
          <motion.rect x="88" y="132" width="24" height="14" rx="4" fill="url(#cc-accent)" opacity="0.8"
            animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Status lights */}
          <motion.circle cx="80" cy="121" r="3" fill="#4ade80"
            animate={animated ? { opacity: [1, 0.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="90" cy="121" r="3" fill="#06b6d4"
            animate={animated ? { opacity: [0.2, 1, 0.2] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="100" cy="121" r="3" fill="#f97316"
            animate={animated ? { opacity: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms */}
          <rect x="56" y="112" width="16" height="34" rx="6" fill="#111827" />
          <rect x="128" y="112" width="16" height="34" rx="6" fill="#111827" />
          {/* Arm detail lines */}
          <line x1="58" y1="122" x2="70" y2="122" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          <line x1="58" y1="130" x2="70" y2="130" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          <line x1="130" y1="122" x2="142" y2="122" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          <line x1="130" y1="130" x2="142" y2="130" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          {/* Head */}
          <rect x="78" y="82" width="44" height="38" rx="8" fill="url(#cc-body)" />
          <rect x="78" y="82" width="44" height="38" rx="8" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.6" />
          {/* Eye visor */}
          <motion.rect x="82" y="92" width="36" height="12" rx="4" fill="url(#cc-accent)" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Scan line */}
          <motion.line x1="83" y1="94" x2="116" y2="94" stroke="#a5f3fc" strokeWidth="1.5" opacity="0.8"
            animate={animated ? { y1: [94, 102, 94], y2: [94, 102, 94] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Mouth speaker */}
          <rect x="88" y="108" width="24" height="8" rx="3" fill="#111827" />
          <line x1="90" y1="112" x2="112" y2="112" stroke="#06b6d4" strokeWidth="1" opacity="0.6" />
          <line x1="90" y1="110" x2="112" y2="110" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />
          <line x1="90" y1="114" x2="112" y2="114" stroke="#06b6d4" strokeWidth="0.8" opacity="0.3" />
        </motion.g>
        {/* Legs */}
        <rect x="82" y="164" width="14" height="20" rx="4" fill="#111827" />
        <rect x="104" y="164" width="14" height="20" rx="4" fill="#111827" />
        <line x1="84" y1="170" x2="94" y2="170" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
        <line x1="106" y1="170" x2="116" y2="170" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
      </motion.svg>
    </div>
  );
};

export default CybercoreNavi;
