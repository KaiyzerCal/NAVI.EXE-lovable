import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const FrostfoxNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full">
        <motion.ellipse cx="100" cy="130" rx="45" ry="26" fill="#e8f4ff" animate={animated ? { scaleY: [1, 1.015, 1] } : {}} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <path d="M80 125 Q100 110 120 125 Q100 140 80 125 Z" fill="#d8ecff" opacity="0.6" />
        <motion.path d="M130 135 Q165 125 160 150 Q140 160 120 145 Z" fill="#e0f0ff" animate={animated ? { rotate: [0, 2, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ originX: "140px", originY: "140px" }} />
        <motion.g animate={animated ? { y: [0, -1.2, 0] } : {}} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <path d="M65 95 L90 75 L120 80 L135 95 L110 110 L80 110 Z" fill="#f0f8ff" />
          <path d="M120 80 L145 90 L130 100 L110 95 Z" fill="#e6f2ff" />
          <path d="M80 75 L90 50 L100 75 Z" fill="#f0f8ff" />
          <path d="M100 75 L110 50 L120 75 Z" fill="#f0f8ff" />
          <motion.ellipse cx="102" cy="92" rx="4" ry="2.5" fill="#9fe7ff" animate={animated ? { opacity: [1, 0.5, 1] } : {}} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          {animated && (
            <motion.rect x="98" y="90" width="8" height="4" fill="#f0f8ff" initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 6 }} style={{ originY: 0.5 }} />
          )}
        </motion.g>
        <rect x="85" y="145" width="7" height="22" rx="3" fill="#e6f2ff" />
        <rect x="115" y="145" width="7" height="22" rx="3" fill="#e6f2ff" />
      </motion.svg>
    </div>
  );
};

export default FrostfoxNavi;
