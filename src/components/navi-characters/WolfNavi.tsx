import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const WolfNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <motion.ellipse cx="105" cy="130" rx="55" ry="28" fill="#0a0a0a" animate={animated ? { scaleY: [1, 1.02, 1] } : {}} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
        <ellipse cx="95" cy="130" rx="25" ry="18" fill="#141414" />
        <motion.g animate={animated ? { y: [0, -1.5, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <path d="M60 95 L85 70 L120 75 L140 95 L115 110 L80 110 Z" fill="#0d0d0d" />
          <path d="M120 75 L150 85 L135 100 L115 95 Z" fill="#111" />
          <path d="M75 70 L85 45 L95 70 Z" fill="#0a0a0a" />
          <path d="M100 72 L110 48 L120 75 Z" fill="#0a0a0a" />
          <motion.ellipse cx="100" cy="92" rx="4" ry="2.5" fill="#ffb347" animate={animated ? { opacity: [1, 0.6, 1] } : {}} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
          {animated && (
            <motion.rect x="96" y="90" width="8" height="4" fill="#0d0d0d" initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 5 }} style={{ originY: 0.5 }} />
          )}
        </motion.g>
        <rect x="85" y="145" width="8" height="25" rx="3" fill="#0d0d0d" />
        <rect x="120" y="145" width="8" height="25" rx="3" fill="#0d0d0d" />
        <path d="M150 130 Q175 120 165 140 Q155 150 140 140" fill="#0d0d0d" />
      </motion.svg>
    </div>
  );
};

export default WolfNavi;
