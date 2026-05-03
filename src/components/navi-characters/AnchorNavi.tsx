import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const AnchorNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="an-body" x1="65" y1="88" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1d4ed8" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="an-anchor" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#94a3b8" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>
        </defs>
        {/* Water surface effect */}
        <motion.path d="M42 155 Q60 148 78 155 Q96 162 114 155 Q132 148 158 155" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.3"
          animate={animated ? { d: ['M42 155 Q60 148 78 155 Q96 162 114 155 Q132 148 158 155', 'M42 155 Q60 162 78 155 Q96 148 114 155 Q132 162 158 155', 'M42 155 Q60 148 78 155 Q96 162 114 155 Q132 148 158 155'] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="40" ry="9" fill="#0f172a" opacity="0.4" />
        {/* Body float / bob */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Sailor coat */}
          <rect x="74" y="114" width="52" height="52" rx="8" fill="url(#an-body)" />
          {/* White stripe on coat */}
          <rect x="74" y="114" width="52" height="7" rx="0" fill="#1e40af" />
          <line x1="74" y1="121" x2="126" y2="121" stroke="#bfdbfe" strokeWidth="1.5" />
          {/* Double-breasted buttons */}
          <circle cx="93" cy="132" r="3" fill="#fbbf24" />
          <circle cx="93" cy="144" r="3" fill="#fbbf24" />
          <circle cx="107" cy="132" r="3" fill="#fbbf24" />
          <circle cx="107" cy="144" r="3" fill="#fbbf24" />
          {/* Epaulettes */}
          <rect x="62" y="114" width="14" height="7" rx="3" fill="#1e40af" />
          <line x1="62" y1="116" x2="76" y2="116" stroke="#fbbf24" strokeWidth="1" />
          <rect x="124" y="114" width="14" height="7" rx="3" fill="#1e40af" />
          <line x1="124" y1="116" x2="138" y2="116" stroke="#fbbf24" strokeWidth="1" />
          {/* Arms */}
          <rect x="60" y="120" width="14" height="30" rx="6" fill="#1d4ed8" />
          <rect x="126" y="120" width="14" height="30" rx="6" fill="#1d4ed8" />
          {/* Anchor tattoo on arm */}
          <motion.path d="M65 128 L65 136 M62 130 L68 130 M62 136 Q65 140 68 136" stroke="#bfdbfe" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Big anchor in other hand */}
          <motion.g animate={animated ? { rotate: [0, 5, -2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '136px', originY: '140px' }}>
            <line x1="136" y1="110" x2="136" y2="158" stroke="url(#an-anchor)" strokeWidth="5" strokeLinecap="round" />
            <line x1="128" y1="116" x2="144" y2="116" stroke="url(#an-anchor)" strokeWidth="3" strokeLinecap="round" />
            <path d="M128 158 Q122 148 128 145 Q130 150 136 152 Q142 150 144 145 Q150 148 144 158" stroke="url(#an-anchor)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="136" cy="110" r="5" fill="#94a3b8" />
            <circle cx="136" cy="110" r="2.5" fill="#475569" />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#1d4ed8" />
          {/* Sailor cap */}
          <rect x="82" y="82" width="36" height="7" rx="2" fill="#1e3a8a" />
          <rect x="85" y="70" width="30" height="14" rx="3" fill="#1e3a8a" />
          <rect x="84" y="76" width="32" height="4" rx="1" fill="#bfdbfe" />
          {/* Cap anchor badge */}
          <motion.path d="M98 73 L98 78 M96 74 L100 74 M96 78 Q98 81 100 78" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="91" cy="100" rx="5" ry="4.5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.ellipse cx="109" cy="100" rx="5" ry="4.5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="91" cy="99" r="2.2" fill="#0f172a" />
          <circle cx="109" cy="99" r="2.2" fill="#0f172a" />
          <circle cx="92" cy="98" r="0.9" fill="white" />
          <circle cx="110" cy="98" r="0.9" fill="white" />
          {/* Smile */}
          <path d="M92 108 Q100 113 108 108" stroke="#bfdbfe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Stubble */}
          <path d="M88 112 Q94 115 100 113 Q106 115 112 112" stroke="#1e3a8a" strokeWidth="1" fill="none" opacity="0.5" />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="162" width="12" height="22" rx="4" fill="#1e3a8a" />
        <rect x="104" y="162" width="12" height="22" rx="4" fill="#1e3a8a" />
      </motion.svg>
    </div>
  );
};

export default AnchorNavi;
