import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const PhoenixNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  return (
    <div style={{ width: size, height: size }}>
      <motion.svg viewBox="0 0 200 200" className="w-full h-full" initial={false}>
        <defs>
          <radialGradient id="ph-body" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <radialGradient id="ph-wing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.4" />
          </radialGradient>
        </defs>
        {/* Glow */}
        <motion.circle cx="100" cy="120" r="55" fill="#f97316" opacity="0.1"
          animate={animated ? { r: [55, 62, 55], opacity: [0.1, 0.2, 0.1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        {/* Shadow */}
        <ellipse cx="100" cy="178" rx="38" ry="9" fill="#450a0a" opacity="0.25" />
        {/* Wings + body float */}
        <motion.g animate={animated ? { y: [0, -5, 0] } : {}} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Left wing */}
          <motion.path d="M75 118 Q45 88 38 60 Q60 75 70 100 Q78 92 82 108" fill="url(#ph-wing)"
            animate={animated ? { d: ['M75 118 Q45 88 38 60 Q60 75 70 100 Q78 92 82 108', 'M75 118 Q42 82 36 54 Q58 72 68 98 Q78 90 82 108', 'M75 118 Q45 88 38 60 Q60 75 70 100 Q78 92 82 108'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Right wing */}
          <motion.path d="M125 118 Q155 88 162 60 Q140 75 130 100 Q122 92 118 108" fill="url(#ph-wing)"
            animate={animated ? { d: ['M125 118 Q155 88 162 60 Q140 75 130 100 Q122 92 118 108', 'M125 118 Q158 82 164 54 Q142 72 132 98 Q122 90 118 108', 'M125 118 Q155 88 162 60 Q140 75 130 100 Q122 92 118 108'] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Tail feathers */}
          <motion.path d="M90 155 Q80 168 72 180 Q85 172 92 165" fill="#f97316" opacity="0.9"
            animate={animated ? { d: ['M90 155 Q80 168 72 180 Q85 172 92 165', 'M90 155 Q78 170 70 183 Q84 174 92 165', 'M90 155 Q80 168 72 180 Q85 172 92 165'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M100 158 Q100 174 100 188 Q104 175 100 158" fill="#fbbf24"
            animate={animated ? { d: ['M100 158 Q100 174 100 188 Q104 175 100 158', 'M100 158 Q102 178 100 192 Q104 178 100 158', 'M100 158 Q100 174 100 188 Q104 175 100 158'] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} />
          <motion.path d="M110 155 Q120 168 128 180 Q115 172 108 165" fill="#f97316" opacity="0.9"
            animate={animated ? { d: ['M110 155 Q120 168 128 180 Q115 172 108 165', 'M110 155 Q122 170 130 183 Q116 174 108 165', 'M110 155 Q120 168 128 180 Q115 172 108 165'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }} />
          {/* Body */}
          <ellipse cx="100" cy="130" rx="28" ry="28" fill="url(#ph-body)" />
          {/* Breast feathers */}
          <path d="M85 120 Q100 112 115 120 Q108 128 100 130 Q92 128 85 120 Z" fill="#fde047" opacity="0.6" />
          {/* Head */}
          <ellipse cx="100" cy="100" rx="20" ry="18" fill="#f97316" />
          {/* Crest feathers */}
          <motion.path d="M94 86 Q90 72 94 62 Q98 72 96 86" fill="#fde047"
            animate={animated ? { d: ['M94 86 Q90 72 94 62 Q98 72 96 86', 'M94 86 Q88 70 92 60 Q97 71 96 86', 'M94 86 Q90 72 94 62 Q98 72 96 86'] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.path d="M100 83 Q98 68 102 58 Q106 68 104 83" fill="#fb923c"
            animate={animated ? { d: ['M100 83 Q98 68 102 58 Q106 68 104 83', 'M100 83 Q96 66 100 56 Q104 66 104 83', 'M100 83 Q98 68 102 58 Q106 68 104 83'] } : {}}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }} />
          <motion.path d="M106 86 Q110 72 106 62 Q102 72 104 86" fill="#fde047"
            animate={animated ? { d: ['M106 86 Q110 72 106 62 Q102 72 104 86', 'M106 86 Q112 70 108 60 Q103 71 104 86', 'M106 86 Q110 72 106 62 Q102 72 104 86'] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }} />
          {/* Eyes */}
          <motion.circle cx="93" cy="98" r="5" fill="#fde047"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx="107" cy="98" r="5" fill="#fde047"
            animate={animated ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <circle cx="93" cy="98" r="2.5" fill="#7c2d12" />
          <circle cx="107" cy="98" r="2.5" fill="#7c2d12" />
          {/* Beak */}
          <path d="M96 106 L100 112 L104 106" fill="#fbbf24" />
        </motion.g>
      </motion.svg>
    </div>
  );
};

export default PhoenixNavi;
