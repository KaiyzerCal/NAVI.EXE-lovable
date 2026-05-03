import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const NetbotNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="nb2-body" x1="65" y1="90" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#475569" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
        </defs>
        {/* Network signal rings */}
        <motion.circle cx="100" cy="95" r="30" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3"
          animate={animated ? { r: [30, 45, 30], opacity: [0.3, 0, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
        <motion.circle cx="100" cy="95" r="20" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.5"
          animate={animated ? { r: [20, 35, 20], opacity: [0.5, 0, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#0f172a" opacity="0.4" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body box */}
          <rect x="70" y="115" width="60" height="50" rx="6" fill="url(#nb2-body)" />
          {/* Ventilation slats */}
          {[120, 128, 136, 144, 152].map((y, i) => (
            <line key={i} x1="75" y1={y} x2="125" y2={y} stroke="#334155" strokeWidth="2" />
          ))}
          {/* Network port light */}
          <motion.rect x="82" y="120" width="36" height="10" rx="3" fill="#0f172a"
            animate={animated ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Packet data lights */}
          <motion.circle cx="88" cy="125" r="2.5" fill="#22d3ee"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="96" cy="125" r="2.5" fill="#4ade80"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <motion.circle cx="104" cy="125" r="2.5" fill="#22d3ee"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} />
          <motion.circle cx="112" cy="125" r="2.5" fill="#f59e0b"
            animate={animated ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.9, ease: 'easeInOut' }} />
          {/* Arms */}
          <rect x="54" y="118" width="16" height="30" rx="5" fill="#374151" />
          <rect x="130" y="118" width="16" height="30" rx="5" fill="#374151" />
          {/* Retractable cable hand */}
          <motion.line x1="54" y1="140" x2="42" y2="148" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"
            animate={animated ? { x2: [42, 36, 42] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="40" cy="149" r="4" fill="#0e7490" />
          {/* Head */}
          <rect x="76" y="78" width="48" height="42" rx="8" fill="url(#nb2-body)" />
          <rect x="76" y="78" width="48" height="42" rx="8" fill="none" stroke="#334155" strokeWidth="2" />
          {/* Display screen face */}
          <rect x="82" y="85" width="36" height="28" rx="4" fill="#0f172a" />
          {/* Screen content: binary / IP */}
          <motion.text x="86" y="96" fontSize="6" fill="#22d3ee" fontFamily="monospace"
            animate={animated ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>10.0.0.1</motion.text>
          <motion.text x="86" y="104" fontSize="6" fill="#4ade80" fontFamily="monospace"
            animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }}>PKT:0xFF</motion.text>
          <motion.text x="86" y="112" fontSize="6" fill="#22d3ee" fontFamily="monospace"
            animate={animated ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>ONLINE</motion.text>
          {/* Antenna */}
          <line x1="100" y1="78" x2="100" y2="64" stroke="#475569" strokeWidth="2.5" />
          <motion.circle cx="100" cy="62" r="4" fill="#22d3ee"
            animate={animated ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="82" y="162" width="14" height="20" rx="4" fill="#374151" />
        <rect x="104" y="162" width="14" height="20" rx="4" fill="#374151" />
      </motion.svg>
    </div>
  );
};

export default NetbotNavi;
