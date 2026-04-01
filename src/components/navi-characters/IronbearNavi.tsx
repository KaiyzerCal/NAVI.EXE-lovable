import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const IronbearNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="ib-body" x1="55" y1="90" x2="145" y2="175" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9ca3af" />
            <stop offset="1" stopColor="#4b5563" />
          </linearGradient>
          <linearGradient id="ib-armor" x1="70" y1="100" x2="130" y2="155" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d1d5db" />
            <stop offset="1" stopColor="#6b7280" />
          </linearGradient>
        </defs>
        {/* Shadow */}
        <motion.ellipse cx="100" cy="175" rx="48" ry="12" fill="#1f2937" opacity="0.3"
          animate={animated ? { scaleX: [1, 1.04, 1] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Body group */}
        <motion.g animate={animated ? { y: [0, -1.5, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <ellipse cx="100" cy="145" rx="42" ry="32" fill="url(#ib-body)" />
          {/* Armor plate belly */}
          <ellipse cx="100" cy="148" rx="28" ry="20" fill="url(#ib-armor)" opacity="0.8" />
          {/* Rivets */}
          <circle cx="82" cy="138" r="2.5" fill="#374151" />
          <circle cx="118" cy="138" r="2.5" fill="#374151" />
          <circle cx="100" cy="133" r="2.5" fill="#374151" />
          {/* Arms */}
          <motion.rect x="53" y="120" width="18" height="36" rx="8" fill="#9ca3af"
            animate={animated ? { rotate: [0, -4, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '62px', originY: '120px' }} />
          <motion.rect x="129" y="120" width="18" height="36" rx="8" fill="#9ca3af"
            animate={animated ? { rotate: [0, 4, 0] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '138px', originY: '120px' }} />
          {/* Head */}
          <ellipse cx="100" cy="102" rx="30" ry="26" fill="#9ca3af" />
          {/* Ears */}
          <circle cx="76" cy="82" r="10" fill="#6b7280" />
          <circle cx="76" cy="82" r="5" fill="#9ca3af" />
          <circle cx="124" cy="82" r="10" fill="#6b7280" />
          <circle cx="124" cy="82" r="5" fill="#9ca3af" />
          {/* Face plate */}
          <ellipse cx="100" cy="108" rx="22" ry="16" fill="url(#ib-armor)" />
          {/* Eyes */}
          <motion.circle cx="91" cy="103" r="6" fill="#1f2937"
            animate={animated ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="103" r="6" fill="#1f2937"
            animate={animated ? { opacity: [1, 0.7, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="91" cy="103" r="3" fill="#60a5fa"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="103" r="3" fill="#60a5fa"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Snout */}
          <ellipse cx="100" cy="113" rx="9" ry="6" fill="#6b7280" />
          <circle cx="97" cy="112" r="2" fill="#374151" />
          <circle cx="103" cy="112" r="2" fill="#374151" />
        </motion.g>
        {/* Legs */}
        <rect x="80" y="172" width="14" height="18" rx="5" fill="#6b7280" />
        <rect x="106" y="172" width="14" height="18" rx="5" fill="#6b7280" />
      </motion.svg>
    </div>
  );
};

export default IronbearNavi;
