import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GemstoneNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="gs-gem" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f0abfc" />
            <stop offset="0.33" stopColor="#60a5fa" />
            <stop offset="0.66" stopColor="#34d399" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
          <radialGradient id="gs-body" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#f0e6ff" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#2e1065" />
          </radialGradient>
        </defs>
        {/* Prismatic light rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const colors = ['#f0abfc', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#818cf8', '#5eead4', '#fde047'];
          return (
            <motion.line key={i}
              x1={100 + 28 * Math.cos(rad)} y1={118 + 28 * Math.sin(rad)}
              x2={100 + 55 * Math.cos(rad)} y2={118 + 55 * Math.sin(rad)}
              stroke={colors[i]} strokeWidth="2" strokeLinecap="round" opacity="0.4"
              animate={animated ? { opacity: [0.4, 0.8, 0.4] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }} />
          );
        })}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="34" ry="8" fill="#2e1065" opacity="0.25" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Gem body - faceted diamond shape */}
          <polygon points="100,108 130,125 126,160 100,172 74,160 70,125" fill="url(#gs-gem)" opacity="0.85" />
          {/* Facet lines */}
          <line x1="100" y1="108" x2="100" y2="172" stroke="white" strokeWidth="0.8" opacity="0.3" />
          <line x1="70" y1="125" x2="130" y2="125" stroke="white" strokeWidth="0.8" opacity="0.3" />
          <line x1="100" y1="108" x2="70" y2="160" stroke="white" strokeWidth="0.8" opacity="0.2" />
          <line x1="100" y1="108" x2="130" y2="160" stroke="white" strokeWidth="0.8" opacity="0.2" />
          {/* Sparkle center */}
          <motion.circle cx="100" cy="140" r="8" fill="white" opacity="0.4"
            animate={animated ? { r: [8, 12, 8], opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms - gem shards */}
          <polygon points="62,118 56,110 64,105 70,118" fill="#60a5fa" opacity="0.8" />
          <polygon points="138,118 144,110 136,105 130,118" fill="#f0abfc" opacity="0.8" />
          {/* Head */}
          <polygon points="100,80 118,92 118,112 100,124 82,112 82,92" fill="url(#gs-body)" />
          {/* Head facet lines */}
          <line x1="82" y1="92" x2="118" y2="92" stroke="white" strokeWidth="0.8" opacity="0.3" />
          {/* Eyes - gem facets */}
          <motion.polygon points="90,94 96,97 96,103 90,106 84,103 84,97" fill="#60a5fa" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="110,94 116,97 116,103 110,106 104,103 104,97" fill="#f0abfc" opacity="0.9"
            animate={animated ? { opacity: [0.9, 0.5, 0.9] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="100" r="2.5" fill="#2e1065" />
          <circle cx="110" cy="100" r="2.5" fill="#2e1065" />
          {/* Mouth sparkle */}
          <motion.path d="M92 114 Q100 118 108 114" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Crown gem */}
          <motion.polygon points="100,80 96,72 100,65 104,72" fill="url(#gs-gem)"
            animate={animated ? { opacity: [1, 0.5, 1], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '72px' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default GemstoneNavi;
