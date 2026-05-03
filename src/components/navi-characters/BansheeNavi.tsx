import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const BansheeNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="bs-glow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2e1065" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bs-body" x1="72" y1="85" x2="128" y2="170" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" stopOpacity="0.9" />
            <stop offset="1" stopColor="#2e1065" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Ghost glow */}
        <motion.ellipse cx="100" cy="120" rx="52" ry="58" fill="url(#bs-glow)"
          animate={animated ? { opacity: [0.6, 1, 0.6], scaleY: [1, 1.05, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Ghost body float */}
        <motion.g animate={animated ? { y: [0, -6, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Ghostly wisp tail */}
          <motion.path d="M78 158 Q72 172 80 182 Q88 185 90 172 Q96 182 100 185 Q104 182 110 172 Q112 185 120 182 Q128 172 122 158" fill="url(#bs-body)" opacity="0.8"
            animate={animated ? { d: ['M78 158 Q72 172 80 182 Q88 185 90 172 Q96 182 100 185 Q104 182 110 172 Q112 185 120 182 Q128 172 122 158', 'M78 158 Q70 175 78 186 Q86 188 90 174 Q96 184 100 188 Q104 184 110 174 Q114 188 122 186 Q130 175 122 158', 'M78 158 Q72 172 80 182 Q88 185 90 172 Q96 182 100 185 Q104 182 110 172 Q112 185 120 182 Q128 172 122 158'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="135" rx="30" ry="30" fill="url(#bs-body)" />
          {/* Tattered dress/robe */}
          <motion.path d="M70 128 Q72 155 78 165 Q90 168 100 165 Q110 168 122 165 Q128 155 130 128" fill="#4c1d95" opacity="0.6"
            animate={animated ? { d: ['M70 128 Q72 155 78 165 Q90 168 100 165 Q110 168 122 165 Q128 155 130 128', 'M70 128 Q74 158 80 168 Q90 170 100 167 Q110 170 120 168 Q126 158 130 128', 'M70 128 Q72 155 78 165 Q90 168 100 165 Q110 168 122 165 Q128 155 130 128'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Wispy arms */}
          <motion.path d="M70 125 Q52 110 48 95 Q58 105 66 118" fill="#7c3aed" opacity="0.7"
            animate={animated ? { d: ['M70 125 Q52 110 48 95 Q58 105 66 118', 'M70 125 Q50 108 45 92 Q56 104 66 118', 'M70 125 Q52 110 48 95 Q58 105 66 118'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M130 125 Q148 110 152 95 Q142 105 134 118" fill="#7c3aed" opacity="0.7"
            animate={animated ? { d: ['M130 125 Q148 110 152 95 Q142 105 134 118', 'M130 125 Q150 108 155 92 Q144 104 134 118', 'M130 125 Q148 110 152 95 Q142 105 134 118'] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Long hair */}
          <motion.path d="M76 95 Q68 118 70 138" stroke="#a78bfa" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"
            animate={animated ? { d: ['M76 95 Q68 118 70 138', 'M76 95 Q66 120 68 140', 'M76 95 Q68 118 70 138'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M124 95 Q132 118 130 138" stroke="#a78bfa" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"
            animate={animated ? { d: ['M124 95 Q132 118 130 138', 'M124 95 Q134 120 132 140', 'M124 95 Q132 118 130 138'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="22" ry="20" fill="#6d28d9" />
          {/* Hair flowing */}
          <motion.path d="M80 95 Q76 78 82 65 Q90 78 88 95" fill="#4c1d95"
            animate={animated ? { d: ['M80 95 Q76 78 82 65 Q90 78 88 95', 'M80 95 Q74 76 80 63 Q89 77 88 95', 'M80 95 Q76 78 82 65 Q90 78 88 95'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M120 95 Q124 78 118 65 Q110 78 112 95" fill="#4c1d95"
            animate={animated ? { d: ['M120 95 Q124 78 118 65 Q110 78 112 95', 'M120 95 Q126 76 120 63 Q111 77 112 95', 'M120 95 Q124 78 118 65 Q110 78 112 95'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.ellipse cx="92" cy="97" rx="6" ry="7" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.1, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }} />
          <motion.ellipse cx="108" cy="97" rx="6" ry="7" fill="#c4b5fd"
            animate={animated ? { scaleY: [1, 0.1, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="92" cy="97" r="3" fill="#2e1065" />
          <circle cx="108" cy="97" r="3" fill="#2e1065" />
          <circle cx="93" cy="95" r="1.2" fill="#e9d5ff" />
          <circle cx="109" cy="95" r="1.2" fill="#e9d5ff" />
          {/* Wail / open mouth */}
          <motion.path d="M90 108 Q100 116 110 108 Q105 120 100 122 Q95 120 90 108 Z" fill="#2e1065"
            animate={animated ? { d: ['M90 108 Q100 116 110 108 Q105 120 100 122 Q95 120 90 108 Z', 'M90 108 Q100 118 110 108 Q105 122 100 124 Q95 122 90 108 Z', 'M90 108 Q100 116 110 108 Q105 120 100 122 Q95 120 90 108 Z'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default BansheeNavi;
