import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const RavenNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full">
        <motion.ellipse cx="105" cy="130" rx="35" ry="22" fill="#0a0a0a" animate={animated ? { scaleY: [1, 1.015, 1] } : {}} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <path d="M135 135 L160 150 L140 145 Z" fill="#0d0d0d" />
        <motion.g animate={animated ? { rotate: [0, 1.5, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "100px", originY: "100px" }}>
          <path d="M70 95 L100 70 L125 85 L110 110 L80 110 Z" fill="#0d0d0d" />
          <path d="M125 85 L150 95 L120 100 Z" fill="#111" />
          <motion.circle cx="105" cy="92" r="3" fill="#8b7dff" animate={animated ? { opacity: [1, 0.6, 1] } : {}} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          {animated && (
            <motion.rect x="101" y="90" width="8" height="3" fill="#0d0d0d" initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 6 }} style={{ originY: 0.5 }} />
          )}
        </motion.g>
        <path d="M95 120 Q115 105 125 125 Q110 135 95 130 Z" fill="#111" />
        <rect x="100" y="145" width="4" height="18" fill="#0d0d0d" />
      </motion.svg>
    </div>
  );
};

export default RavenNavi;
