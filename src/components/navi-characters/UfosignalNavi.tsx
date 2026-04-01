import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const UfosignalNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="uf-saucer" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </radialGradient>
          <radialGradient id="uf-beam" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Tractor beam */}
        <motion.path d="M76 115 Q58 140 54 175 Q100 162 146 175 Q142 140 124 115 Z" fill="url(#uf-beam)"
          animate={animated ? { opacity: [0.7, 0.4, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Signal rings */}
        <motion.ellipse cx="100" cy="102" rx="40" ry="14" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.4"
          animate={animated ? { rx: [40, 52, 40], ry: [14, 18, 14], opacity: [0.4, 0, 0.4] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }} />
        <motion.ellipse cx="100" cy="102" rx="28" ry="10" fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.5"
          animate={animated ? { rx: [28, 40, 28], ry: [10, 14, 10], opacity: [0.5, 0, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeOut' }} />
        {/* UFO body float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Saucer bottom */}
          <ellipse cx="100" cy="108" rx="50" ry="16" fill="#475569" />
          {/* Saucer rim lights */}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 45 * Math.cos(rad);
            const y = 108 + 13 * Math.sin(rad);
            const colors = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24'];
            return (
              <motion.circle key={i} cx={x} cy={y} r="3" fill={colors[i % colors.length]}
                animate={animated ? { opacity: [1, 0.2, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.17, ease: 'easeInOut' }} />
            );
          })}
          {/* Saucer dome */}
          <ellipse cx="100" cy="108" rx="50" ry="16" fill="url(#uf-saucer)" />
          <ellipse cx="100" cy="96" rx="28" ry="20" fill="#94a3b8" opacity="0.9" />
          {/* Dome glass */}
          <ellipse cx="100" cy="92" rx="22" ry="16" fill="#0ea5e9" opacity="0.5" />
          {/* Alien inside dome - eyes */}
          <ellipse cx="100" cy="94" rx="16" ry="12" fill="#0c4a6e" opacity="0.4" />
          <motion.circle cx="93" cy="91" r="5" fill="#4ade80"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="107" cy="91" r="5" fill="#4ade80"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="93" cy="90" r="2.5" fill="#052e16" />
          <circle cx="107" cy="90" r="2.5" fill="#052e16" />
          {/* Alien head shape */}
          <ellipse cx="100" cy="86" rx="10" ry="12" fill="#0d9488" opacity="0.3" />
          {/* Antenna on top */}
          <line x1="100" y1="76" x2="100" y2="65" stroke="#94a3b8" strokeWidth="2" />
          <motion.circle cx="100" cy="63" r="4" fill="#4ade80"
            animate={animated ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default UfosignalNavi;
