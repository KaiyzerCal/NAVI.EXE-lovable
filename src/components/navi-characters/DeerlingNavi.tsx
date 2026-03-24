import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const DeerlingNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -2, 0], rotate: [0, 0.5, -0.5, 0] },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const antlerVariants = {
    idle: { rotate: [0, 1.5, -1.5, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.path d="M70 150 Q85 110 100 100 Q115 90 130 150 Z" fill="#E3C9A8" stroke="#A97C58" strokeWidth="2" variants={animated ? idleVariants : {}} transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' as const }} />
      <circle cx="85" cy="120" r="2" fill="#FFFFFF" />
      <circle cx="115" cy="110" r="2" fill="#FFFFFF" />
      <circle cx="105" cy="130" r="1.5" fill="#FFFFFF" />
      <motion.path d="M130 150 Q140 140 150 145" stroke="#E3C9A8" strokeWidth="4" strokeLinecap="round" variants={animated ? idleVariants : {}} />
      <motion.circle cx="100" cy="70" r="18" fill="#E3C9A8" stroke="#A97C58" strokeWidth="2" />
      <motion.circle cx="92" cy="68" r="3.5" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="108" cy="68" r="3.5" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <polygon points="85,55 95,45 95,65" fill="#E3C9A8" stroke="#A97C58" strokeWidth="1.5" />
      <polygon points="115,55 105,45 105,65" fill="#E3C9A8" stroke="#A97C58" strokeWidth="1.5" />
      <motion.path d="M90 45 Q88 30 95 35" stroke="#A97C58" strokeWidth="2" variants={animated ? antlerVariants : {}} />
      <motion.path d="M110 45 Q112 30 105 35" stroke="#A97C58" strokeWidth="2" variants={animated ? antlerVariants : {}} />
    </motion.svg>
  );
};

export default DeerlingNavi;
