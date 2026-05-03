import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const VenombugNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="vb-body" x1="70" y1="90" x2="130" y2="165" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4ade80" />
            <stop offset="1" stopColor="#166534" />
          </linearGradient>
          <radialGradient id="vb-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Venom glow */}
        <motion.ellipse cx="97" cy="128" rx="38" ry="32" fill="url(#vb-glow)"
          animate={animated ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="97" cy="173" rx="33" ry="8" fill="#14532d" opacity="0.3" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Wings */}
          <motion.ellipse cx="68" cy="108" rx="22" ry="12" fill="#bbf7d0" opacity="0.55" transform="rotate(-25, 68, 108)"
            animate={animated ? { scaleY: [1, 0.8, 1], opacity: [0.55, 0.75, 0.55] } : {}}
            transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="126" cy="108" rx="22" ry="12" fill="#bbf7d0" opacity="0.55" transform="rotate(25, 126, 108)"
            animate={animated ? { scaleY: [1, 0.8, 1], opacity: [0.55, 0.75, 0.55] } : {}}
            transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body segments */}
          <ellipse cx="97" cy="150" rx="20" ry="16" fill="#166534" />
          <ellipse cx="97" cy="133" rx="25" ry="18" fill="#15803d" />
          <ellipse cx="97" cy="116" rx="22" ry="16" fill="url(#vb-body)" />
          {/* Stripe markings */}
          <path d="M78 112 Q97 108 116 112" stroke="#14532d" strokeWidth="2.5" fill="none" />
          <path d="M80 119 Q97 115 114 119" stroke="#14532d" strokeWidth="2" fill="none" />
          {/* Head */}
          <ellipse cx="97" cy="100" rx="18" ry="16" fill="#22c55e" />
          {/* Antennae */}
          <motion.line x1="90" y1="86" x2="80" y2="70" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"
            animate={animated ? { rotate: [0, -8, 4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '90px', originY: '86px' }} />
          <motion.line x1="104" y1="86" x2="114" y2="70" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"
            animate={animated ? { rotate: [0, 8, -4, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '104px', originY: '86px' }} />
          <circle cx="80" cy="70" r="3" fill="#86efac" />
          <circle cx="114" cy="70" r="3" fill="#86efac" />
          {/* Eyes */}
          <motion.circle cx="90" cy="97" r="5.5" fill="#86efac"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="104" cy="97" r="5.5" fill="#86efac"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="90" cy="97" r="2.5" fill="#14532d" />
          <circle cx="104" cy="97" r="2.5" fill="#14532d" />
          {/* Venom drip */}
          <motion.ellipse cx="97" cy="105" rx="3" ry="4" fill="#4ade80" opacity="0.8"
            animate={animated ? { scaleY: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Legs */}
          <line x1="75" y1="125" x2="58" y2="118" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="132" x2="54" y2="130" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
          <line x1="119" y1="125" x2="136" y2="118" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
          <line x1="122" y1="132" x2="140" y2="130" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default VenombugNavi;
