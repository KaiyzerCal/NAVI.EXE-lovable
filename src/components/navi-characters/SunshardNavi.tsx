import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const SunshardNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="ss-body" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <linearGradient id="ss-shard" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fef9c3" />
            <stop offset="1" stopColor="#facc15" />
          </linearGradient>
        </defs>
        {/* Sunlight shimmer */}
        <motion.circle cx="100" cy="115" r="52" fill="#facc15" opacity="0.08"
          animate={animated ? { r: [52, 60, 52], opacity: [0.08, 0.15, 0.08] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="32" ry="7" fill="#78350f" opacity="0.2" />
        {/* Float */}
        <motion.g animate={animated ? { y: [0, -4, 0] } : {}} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Crystal shard skirt */}
          {[75, 88, 100, 112, 125].map((x, i) => (
            <motion.polygon key={i} points={`${x - 5},148 ${x},165 ${x + 5},148`} fill="url(#ss-shard)" opacity="0.8"
              animate={animated ? { opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
          ))}
          {/* Body */}
          <ellipse cx="100" cy="130" rx="28" ry="24" fill="url(#ss-body)" />
          {/* Sun crystal on chest */}
          <motion.polygon points="100,118 96,126 88,126 94,132 92,140 100,136 108,140 106,132 112,126 104,126" fill="#fef9c3" opacity="0.8"
            animate={animated ? { rotate: [0, 10, 0], opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '100px', originY: '129px' }} />
          {/* Arms */}
          <rect x="64" y="118" width="12" height="26" rx="5" fill="#f59e0b" />
          <rect x="124" y="118" width="12" height="26" rx="5" fill="#f59e0b" />
          {/* Crystal shards on arms */}
          <polygon points="64,118 68,108 72,118" fill="url(#ss-shard)" opacity="0.8" />
          <polygon points="128,118 132,108 136,118" fill="url(#ss-shard)" opacity="0.8" />
          {/* Head */}
          <ellipse cx="100" cy="98" rx="22" ry="20" fill="#facc15" />
          {/* Crown of sun shards */}
          <motion.polygon points="88,86 84,73 92,82" fill="url(#ss-shard)"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.polygon points="100,82 96,68 104,68 100,82" fill="url(#ss-shard)"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.polygon points="112,86 116,73 108,82" fill="url(#ss-shard)"
            animate={animated ? { opacity: [1, 0.6, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="91" cy="97" r="5.5" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="109" cy="97" r="5.5" fill="#fef9c3"
            animate={animated ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="91" cy="96" r="2.5" fill="#78350f" />
          <circle cx="109" cy="96" r="2.5" fill="#78350f" />
          <circle cx="92" cy="95" r="1" fill="white" />
          <circle cx="110" cy="95" r="1" fill="white" />
          {/* Smile */}
          <path d="M93 106 Q100 110 107 106" stroke="#fef9c3" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Light sparkles */}
          <motion.circle cx="52" cy="102" r="3" fill="#fef9c3" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="150" cy="108" r="2.5" fill="#facc15" opacity="0.7"
            animate={animated ? { opacity: [0, 1, 0], scale: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} />
        </motion.g>
        {/* Legs */}
        <rect x="86" y="150" width="10" height="22" rx="4" fill="#b45309" />
        <rect x="104" y="150" width="10" height="22" rx="4" fill="#b45309" />
      </motion.svg>
    </div>
  );
};

export default SunshardNavi;
