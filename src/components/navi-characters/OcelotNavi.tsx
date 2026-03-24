import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const OcelotNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -2, 0], rotate: [0, 1, -1, 0] },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.path d="M50 150 Q60 100 100 90 Q140 80 150 150 Z" fill="#C99D6E" stroke="#8B5E3C" strokeWidth="2" variants={animated ? idleVariants : {}} transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' as const }} />
      <circle cx="70" cy="120" r="3" fill="#8B5E3C" />
      <circle cx="110" cy="100" r="2.5" fill="#8B5E3C" />
      <circle cx="130" cy="130" r="3" fill="#8B5E3C" />
      <motion.path d="M150 150 Q160 130 180 140" stroke="#C99D6E" strokeWidth="5" strokeLinecap="round" variants={animated ? idleVariants : {}} />
      <motion.circle cx="100" cy="70" r="20" fill="#C99D6E" stroke="#8B5E3C" strokeWidth="2" />
      <motion.circle cx="93" cy="68" r="4" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="107" cy="68" r="4" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <polygon points="85,55 95,45 95,65" fill="#C99D6E" stroke="#8B5E3C" strokeWidth="1.5" />
      <polygon points="115,55 105,45 105,65" fill="#C99D6E" stroke="#8B5E3C" strokeWidth="1.5" />
    </motion.svg>
  );
};

export default OcelotNavi;
