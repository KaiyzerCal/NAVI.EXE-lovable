import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const LeviathanNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <linearGradient id="lv-body" x1="55" y1="80" x2="145" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0369a1" />
            <stop offset="0.5" stopColor="#0c4a6e" />
            <stop offset="1" stopColor="#042f4e" />
          </linearGradient>
          <radialGradient id="lv-eye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
        </defs>
        {/* Deep glow */}
        <motion.ellipse cx="100" cy="128" rx="55" ry="44" fill="#0369a1" opacity="0.12"
          animate={animated ? { opacity: [0.12, 0.22, 0.12] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="182" rx="50" ry="11" fill="#042f4e" opacity="0.4" />
        {/* Body float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Tail */}
          <motion.path d="M55 148 Q30 140 35 168 Q50 178 65 162" fill="#0369a1"
            animate={animated ? { d: ['M55 148 Q30 140 35 168 Q50 178 65 162', 'M55 148 Q28 138 32 166 Q48 178 65 162', 'M55 148 Q30 140 35 168 Q50 178 65 162'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body - serpentine */}
          <ellipse cx="100" cy="148" rx="46" ry="30" fill="url(#lv-body)" />
          {/* Scales pattern */}
          <path d="M72 140 Q80 135 88 140 Q80 145 72 140" fill="#0c4a6e" opacity="0.6" />
          <path d="M88 135 Q96 130 104 135 Q96 140 88 135" fill="#0c4a6e" opacity="0.6" />
          <path d="M104 140 Q112 135 120 140 Q112 145 104 140" fill="#0c4a6e" opacity="0.6" />
          <path d="M80 150 Q88 145 96 150 Q88 155 80 150" fill="#075985" opacity="0.5" />
          <path d="M96 155 Q104 150 112 155 Q104 160 96 155" fill="#075985" opacity="0.5" />
          {/* Fins */}
          <motion.path d="M80 120 Q72 100 78 88 Q86 100 84 118" fill="#0ea5e9" opacity="0.7"
            animate={animated ? { d: ['M80 120 Q72 100 78 88 Q86 100 84 118', 'M80 120 Q70 98 76 86 Q86 100 84 118', 'M80 120 Q72 100 78 88 Q86 100 84 118'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M120 120 Q128 100 122 88 Q114 100 116 118" fill="#0ea5e9" opacity="0.7"
            animate={animated ? { d: ['M120 120 Q128 100 122 88 Q114 100 116 118', 'M120 120 Q130 98 124 86 Q114 100 116 118', 'M120 120 Q128 100 122 88 Q114 100 116 118'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="108" rx="30" ry="24" fill="#0369a1" />
          {/* Horns */}
          <path d="M80 96 L70 72 L84 90" fill="#042f4e" />
          <path d="M120 96 L130 72 L116 90" fill="#042f4e" />
          {/* Frill */}
          <path d="M72 106 Q68 95 72 84 Q76 95 74 106" fill="#0ea5e9" opacity="0.5" />
          <path d="M128 106 Q132 95 128 84 Q124 95 126 106" fill="#0ea5e9" opacity="0.5" />
          {/* Eyes */}
          <motion.circle cx="88" cy="104" r="8" fill="url(#lv-eye)"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="112" cy="104" r="8" fill="url(#lv-eye)"
            animate={animated ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="88" cy="104" r="4" fill="#1c0000" />
          <circle cx="112" cy="104" r="4" fill="#1c0000" />
          <circle cx="86" cy="102" r="1.5" fill="white" opacity="0.7" />
          <circle cx="110" cy="102" r="1.5" fill="white" opacity="0.7" />
          {/* Maw */}
          <motion.path d="M82 118 Q100 126 118 118 Q110 130 100 132 Q90 130 82 118 Z" fill="#042f4e"
            animate={animated ? { d: ['M82 118 Q100 126 118 118 Q110 130 100 132 Q90 130 82 118 Z', 'M82 118 Q100 128 118 118 Q110 132 100 134 Q90 132 82 118 Z', 'M82 118 Q100 126 118 118 Q110 130 100 132 Q90 130 82 118 Z'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Teeth */}
          <path d="M86 118 L88 124 L90 118" fill="#e2e8f0" />
          <path d="M94 120 L96 125 L98 120" fill="#e2e8f0" />
          <path d="M102 120 L104 125 L106 120" fill="#e2e8f0" />
          <path d="M110 118 L112 124 L114 118" fill="#e2e8f0" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default LeviathanNavi;
