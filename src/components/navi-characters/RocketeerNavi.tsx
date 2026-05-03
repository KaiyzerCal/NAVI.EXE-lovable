import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const RocketeerNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="ro-body" x1="70" y1="90" x2="130" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f8fafc" />
            <stop offset="0.5" stopColor="#cbd5e1" />
            <stop offset="1" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="ro-flame" x1="90" y1="155" x2="110" y2="185" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde047" />
            <stop offset="0.5" stopColor="#f97316" />
            <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Jet flame */}
        <motion.path d="M88 167 Q94 178 100 190 Q106 178 112 167" fill="url(#ro-flame)"
          animate={animated ? { d: ['M88 167 Q94 178 100 190 Q106 178 112 167', 'M89 167 Q95 182 100 195 Q105 182 111 167', 'M88 167 Q94 178 100 190 Q106 178 112 167'] } : {}}
          transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Rocket pack */}
          <rect x="80" y="125" width="40" height="40" rx="8" fill="#475569" />
          <rect x="85" y="128" width="10" height="15" rx="4" fill="#334155" />
          <rect x="105" y="128" width="10" height="15" rx="4" fill="#334155" />
          <rect x="88" y="140" width="24" height="8" rx="3" fill="#64748b" />
          {/* Body suit */}
          <rect x="76" y="112" width="48" height="40" rx="8" fill="url(#ro-body)" />
          {/* Suit markings */}
          <path d="M88 118 L100 128 L112 118" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
          <rect x="96" y="120" width="8" height="6" rx="2" fill="#60a5fa" opacity="0.8" />
          {/* Arms */}
          <rect x="60" y="112" width="14" height="28" rx="6" fill="#94a3b8" />
          <rect x="126" y="112" width="14" height="28" rx="6" fill="#94a3b8" />
          {/* Gloves */}
          <ellipse cx="67" cy="143" rx="9" ry="7" fill="#475569" />
          <ellipse cx="133" cy="143" rx="9" ry="7" fill="#475569" />
          {/* Helmet */}
          <ellipse cx="100" cy="98" rx="26" ry="24" fill="#e2e8f0" />
          {/* Visor */}
          <ellipse cx="100" cy="99" rx="18" ry="14" fill="#0ea5e9" opacity="0.7" />
          <motion.ellipse cx="100" cy="99" rx="15" ry="11" fill="#38bdf8" opacity="0.4"
            animate={animated ? { opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes through visor */}
          <circle cx="92" cy="97" r="4" fill="#0c4a6e" />
          <circle cx="108" cy="97" r="4" fill="#0c4a6e" />
          <circle cx="93" cy="96" r="1.5" fill="white" opacity="0.7" />
          <circle cx="109" cy="96" r="1.5" fill="white" opacity="0.7" />
          {/* Helmet fin */}
          <polygon points="100,75 93,83 107,83" fill="#94a3b8" />
          <rect x="97" y="75" width="6" height="10" rx="2" fill="#64748b" />
          {/* Speed lines */}
          <motion.line x1="50" y1="120" x2="68" y2="120" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0, 0.6], x1: [50, 58, 50] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.line x1="132" y1="118" x2="150" y2="118" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"
            animate={animated ? { opacity: [0.6, 0, 0.6], x2: [150, 142, 150] } : {}}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default RocketeerNavi;
