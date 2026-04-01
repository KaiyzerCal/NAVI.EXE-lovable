import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const BroadcastNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="bc-body" x1="68" y1="90" x2="132" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6d28d9" />
            <stop offset="1" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        {/* Broadcast waves */}
        <motion.path d="M38 90 Q32 105 38 120" stroke="#a78bfa" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} />
        <motion.path d="M28 80 Q18 105 28 130" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeOut' }} />
        <motion.path d="M162 90 Q168 105 162 120" stroke="#a78bfa" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }} />
        <motion.path d="M172 80 Q182 105 172 130" stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round"
          animate={animated ? { opacity: [0, 1, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#1e1b4b" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -2, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <rect x="74" y="112" width="52" height="54" rx="8" fill="url(#bc-body)" />
          {/* Sound bars */}
          {[78, 88, 100, 112, 120].map((x, i) => {
            const heights = [20, 32, 28, 36, 22];
            return (
              <motion.rect key={i} x={x} y={158 - heights[i]} width="7" height={heights[i]} rx="2" fill="#a78bfa" opacity="0.8"
                animate={animated ? { height: [heights[i], heights[i] * 1.4, heights[i]], y: [158 - heights[i], 158 - heights[i] * 1.4, 158 - heights[i]] } : {}}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }} />
            );
          })}
          {/* On Air badge */}
          <motion.rect x="86" y="118" width="28" height="12" rx="4" fill="#dc2626"
            animate={animated ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.text x="89" y="128" fontSize="7" fill="white" fontFamily="monospace"
            animate={animated ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}>ON AIR</motion.text>
          {/* Arms */}
          <rect x="58" y="115" width="14" height="28" rx="5" fill="#5b21b6" />
          <rect x="128" y="115" width="14" height="28" rx="5" fill="#5b21b6" />
          {/* Microphone in hand */}
          <motion.g animate={animated ? { rotate: [0, -5, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '60px', originY: '138px' }}>
            <rect x="56" y="130" width="8" height="18" rx="4" fill="#374151" />
            <ellipse cx="60" cy="129" rx="6" ry="8" fill="#4b5563" />
            <line x1="60" y1="148" x2="60" y2="155" stroke="#374151" strokeWidth="2" />
            <line x1="55" y1="155" x2="65" y2="155" stroke="#374151" strokeWidth="2" />
          </motion.g>
          {/* Head */}
          <ellipse cx="100" cy="98" rx="22" ry="20" fill="#7c3aed" />
          {/* Headphones */}
          <path d="M80 98 Q80 80 100 78 Q120 80 120 98" stroke="#4c1d95" strokeWidth="5" fill="none" />
          <rect x="76" y="93" width="10" height="14" rx="4" fill="#4c1d95" />
          <rect x="114" y="93" width="10" height="14" rx="4" fill="#4c1d95" />
          {/* Eyes */}
          <motion.circle cx="92" cy="98" r="5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.circle cx="108" cy="98" r="5" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="92" cy="97" r="2.2" fill="#1e1b4b" />
          <circle cx="108" cy="97" r="2.2" fill="#1e1b4b" />
          {/* Smile */}
          <path d="M93 107 Q100 111 107 107" stroke="#c4b5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="162" width="12" height="20" rx="4" fill="#4c1d95" />
        <rect x="104" y="162" width="12" height="20" rx="4" fill="#4c1d95" />
      </motion.svg>
    </div>
  );
};

export default BroadcastNavi;
