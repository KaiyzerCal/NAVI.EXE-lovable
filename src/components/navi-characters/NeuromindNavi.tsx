import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const NeuromindNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="nm-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="50%" stopColor="#6d28d9" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </radialGradient>
          <radialGradient id="nm-brain" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </radialGradient>
        </defs>
        {/* Neural network glow */}
        <motion.circle cx="100" cy="92" r="45" fill="#7c3aed" opacity="0.1"
          animate={animated ? { r: [45, 52, 45], opacity: [0.1, 0.18, 0.1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Neural connection lines */}
        {[
          { x1: 68, y1: 75, x2: 88, y2: 82 }, { x1: 112, y1: 82, x2: 132, y2: 75 },
          { x1: 62, y1: 95, x2: 82, y2: 92 }, { x1: 118, y1: 92, x2: 138, y2: 95 },
          { x1: 70, y1: 112, x2: 88, y2: 105 }, { x1: 112, y1: 105, x2: 130, y2: 112 }
        ].map((line, i) => (
          <motion.line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#c084fc" strokeWidth="1" opacity="0.4"
            animate={animated ? { opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }} />
        ))}
        {/* Neuron nodes */}
        {[{ cx: 68, cy: 75 }, { cx: 132, cy: 75 }, { cx: 62, cy: 95 }, { cx: 138, cy: 95 }, { cx: 70, cy: 112 }, { cx: 130, cy: 112 }].map((n, i) => (
          <motion.circle key={i} cx={n.cx} cy={n.cy} r="4" fill="#c084fc" opacity="0.7"
            animate={animated ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }} />
        ))}
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="8" fill="#1e1b4b" opacity="0.3" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -3, 0] } : {}} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <ellipse cx="100" cy="138" rx="30" ry="26" fill="url(#nm-body)" />
          {/* Neural pattern on body */}
          <motion.path d="M82 130 Q100 125 118 130 Q100 138 82 130" fill="#e9d5ff" opacity="0.2"
            animate={animated ? { opacity: [0.2, 0.4, 0.2] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Arms */}
          <rect x="62" y="122" width="12" height="28" rx="5" fill="#7c3aed" />
          <rect x="126" y="122" width="12" height="28" rx="5" fill="#7c3aed" />
          {/* Oversized brain/head */}
          <ellipse cx="100" cy="95" rx="30" ry="26" fill="url(#nm-brain)" />
          {/* Brain wrinkles */}
          <motion.path d="M80 88 Q90 84 100 88 Q110 84 120 88" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.5"
            animate={animated ? { opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M78 96 Q88 92 100 96 Q112 92 122 96" stroke="#7c3aed" strokeWidth="1.5" fill="none" opacity="0.4"
            animate={animated ? { opacity: [0.4, 0.7, 0.4] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <path d="M100 70 Q100 75 100 82" stroke="#a855f7" strokeWidth="2" fill="none" opacity="0.5" />
          {/* Small face below brain */}
          <ellipse cx="100" cy="114" rx="14" ry="8" fill="#6d28d9" />
          {/* Eyes */}
          <motion.circle cx="93" cy="113" r="4" fill="#e9d5ff"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="107" cy="113" r="4" fill="#e9d5ff"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="93" cy="112" r="2" fill="#1e1b4b" />
          <circle cx="107" cy="112" r="2" fill="#1e1b4b" />
          {/* Mouth */}
          <path d="M94 119 Q100 122 106 119" stroke="#e9d5ff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Central synapse */}
          <motion.circle cx="100" cy="90" r="6" fill="#fde047" opacity="0.8"
            animate={animated ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="100" cy="90" r="3" fill="#f59e0b" />
        </motion.g>
        {/* Legs */}
        <rect x="85" y="160" width="10" height="20" rx="4" fill="#4c1d95" />
        <rect x="105" y="160" width="10" height="20" rx="4" fill="#4c1d95" />
      </motion.svg>
    </div>
  );
};

export default NeuromindNavi;
