import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const EyeoftruthNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="et-eye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#1c0000" />
          </radialGradient>
          <linearGradient id="et-body" x1="65" y1="88" x2="135" y2="168" gradientUnits="userSpaceOnUse">
            <stop stopColor="#292524" />
            <stop offset="1" stopColor="#0c0a09" />
          </linearGradient>
          <radialGradient id="et-glow" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Eye of truth glow */}
        <motion.ellipse cx="100" cy="95" rx="40" ry="30" fill="url(#et-glow)"
          animate={animated ? { opacity: [0.7, 1, 0.7], scaleX: [1, 1.1, 1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Truth rays */}
        {[0, 30, 60, 90, 120, 150, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <motion.line key={i}
              x1={100 + 30 * Math.cos(rad)} y1={95 + 22 * Math.sin(rad)}
              x2={100 + 48 * Math.cos(rad)} y2={95 + 36 * Math.sin(rad)}
              stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"
              animate={animated ? { opacity: [0.3, 0.6, 0.3] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }} />
          );
        })}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#0c0a09" opacity="0.5" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Dark shroud body */}
          <motion.path d="M70 122 Q62 154 70 170 Q84 178 100 176 Q116 178 130 170 Q138 154 130 122" fill="url(#et-body)"
            animate={animated ? { d: ['M70 122 Q62 154 70 170 Q84 178 100 176 Q116 178 130 170 Q138 154 130 122', 'M70 122 Q60 158 68 173 Q82 180 100 178 Q118 180 132 173 Q140 158 130 122', 'M70 122 Q62 154 70 170 Q84 178 100 176 Q116 178 130 170 Q138 154 130 122'] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          <ellipse cx="100" cy="132" rx="30" ry="24" fill="url(#et-body)" />
          {/* Arms */}
          <rect x="62" y="118" width="12" height="28" rx="5" fill="#292524" />
          <rect x="126" y="118" width="12" height="28" rx="5" fill="#292524" />
          {/* Mini truth eyes floating */}
          <motion.ellipse cx="56" cy="118" rx="7" ry="5" fill="#fef9c3" opacity="0.5"
            animate={animated ? { scaleX: [1, 0.3, 1], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.ellipse cx="144" cy="122" rx="6" ry="4.5" fill="#fef9c3" opacity="0.5"
            animate={animated ? { scaleX: [1, 0.3, 1], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: 0.7, ease: 'easeInOut' }} />
          {/* The great eye - dominating the head */}
          <ellipse cx="100" cy="92" rx="34" ry="24" fill="#1c0000" />
          {/* Eyelid top */}
          <path d="M66 92 Q100 72 134 92" fill="#292524" />
          {/* Eyelid bottom */}
          <path d="M66 92 Q100 112 134 92" fill="#292524" />
          {/* Eye whites */}
          <motion.ellipse cx="100" cy="92" rx="28" ry="18" fill="#fef9c3" opacity="0.9"
            animate={animated ? { scaleX: [1, 0.9, 1], scaleY: [1, 0.8, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Iris */}
          <motion.circle cx="100" cy="92" r="14" fill="url(#et-eye)"
            animate={animated ? { scale: [1, 0.8, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Pupil */}
          <motion.ellipse cx="100" cy="92" rx="6" ry="8" fill="#0c0a09"
            animate={animated ? { scaleX: [1, 0.4, 1], scaleY: [1, 1.2, 1] } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eye shine */}
          <circle cx="95" cy="87" r="3" fill="white" opacity="0.7" />
          <circle cx="93" cy="85" r="1.5" fill="white" opacity="0.5" />
          {/* Lashes */}
          {[-20, -10, 0, 10, 20].map((x, i) => (
            <line key={i} x1={100 + x} y1={74} x2={100 + x * 1.2} y2={68} stroke="#292524" strokeWidth="2" strokeLinecap="round" />
          ))}
          {/* Mouth on lower face */}
          <ellipse cx="100" cy="108" rx="16" ry="6" fill="#1c0000" />
          <motion.path d="M88 108 Q100 114 112 108" stroke="#fbbf24" strokeWidth="1.5" fill="none"
            animate={animated ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="84" y="168" width="12" height="20" rx="4" fill="#1c1917" />
        <rect x="104" y="168" width="12" height="20" rx="4" fill="#1c1917" />
      </motion.svg>
    </div>
  );
};

export default EyeoftruthNavi;
