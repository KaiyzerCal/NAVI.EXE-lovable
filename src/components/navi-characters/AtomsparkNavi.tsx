import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const AtomsparkNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="as-nucleus" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="as-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="1" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
        {/* Electron orbits */}
        <motion.ellipse cx="100" cy="118" rx="55" ry="20" fill="none" stroke="#60a5fa" strokeWidth="1.5" opacity="0.4"
          animate={animated ? { rotate: [0, 360] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        <motion.ellipse cx="100" cy="118" rx="48" ry="18" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.4" transform="rotate(60, 100, 118)"
          animate={animated ? { rotate: [60, 420] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        <motion.ellipse cx="100" cy="118" rx="50" ry="19" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.4" transform="rotate(120, 100, 118)"
          animate={animated ? { rotate: [120, 480] } : {}}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        {/* Electrons */}
        <motion.circle cx="155" cy="118" r="5" fill="#60a5fa"
          animate={animated ? { rotate: [0, 360] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        <motion.circle cx="124" cy="100" r="4" fill="#a78bfa"
          animate={animated ? { rotate: [60, 420] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        <motion.circle cx="76" cy="100" r="4" fill="#34d399"
          animate={animated ? { rotate: [120, 480] } : {}}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '118px' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="32" ry="7" fill="#1e3a8a" opacity="0.2" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Body */}
          <circle cx="100" cy="130" r="28" fill="url(#as-body)" />
          {/* Atomic symbol on body */}
          <motion.circle cx="100" cy="130" r="12" fill="none" stroke="#bfdbfe" strokeWidth="1.5" opacity="0.6"
            animate={animated ? { rotate: [0, 360] } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '100px', originY: '130px' }} />
          {/* Head */}
          <circle cx="100" cy="98" r="22" fill="#2563eb" />
          {/* Atom nucleus head */}
          <motion.circle cx="100" cy="98" r="10" fill="url(#as-nucleus)"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="100" cy="98" r="5" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="90" cy="98" r="5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <motion.circle cx="110" cy="98" r="5" fill="#bfdbfe"
            animate={animated ? { scaleY: [1, 0.15, 1] } : {}}
            transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }} />
          <circle cx="90" cy="97" r="2.2" fill="#1e3a8a" />
          <circle cx="110" cy="97" r="2.2" fill="#1e3a8a" />
          {/* Proton/neutron dots on head */}
          <circle cx="97" cy="95" r="2" fill="#ef4444" opacity="0.8" />
          <circle cx="103" cy="95" r="2" fill="#3b82f6" opacity="0.8" />
          <circle cx="100" cy="101" r="2" fill="#ef4444" opacity="0.8" />
          {/* Mouth */}
          <path d="M92 108 Q100 112 108 108" stroke="#bfdbfe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Spark particles */}
          <motion.circle cx="55" cy="106" r="3" fill="#fbbf24" opacity="0.8"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="148" cy="112" r="2.5" fill="#60a5fa" opacity="0.8"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="155" width="10" height="20" rx="4" fill="#1e3a8a" />
        <rect x="104" y="155" width="10" height="20" rx="4" fill="#1e3a8a" />
      </motion.svg>
    </div>
  );
};

export default AtomsparkNavi;
