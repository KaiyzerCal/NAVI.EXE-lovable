import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const FlamebirdNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -3, 0], rotate: [0, 1, -1, 0] },
  };
  const wingVariants = {
    idle: { rotate: [0, 5, -5, 0], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const tailVariants = {
    idle: { rotate: [0, 3, -3, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.ellipse cx="100" cy="110" rx="25" ry="40" fill="url(#flame-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.path d="M75 100 Q50 80 65 110" fill="orange" variants={animated ? wingVariants : {}} />
      <motion.path d="M125 100 Q150 80 135 110" fill="orange" variants={animated ? wingVariants : {}} />
      <motion.path d="M100 150 Q90 170 100 180 Q110 190 100 200" stroke="red" strokeWidth="5" strokeLinecap="round" variants={animated ? tailVariants : {}} />
      <motion.circle cx="100" cy="70" r="15" fill="yellow" stroke="orange" strokeWidth="2" />
      <motion.circle cx="93" cy="68" r="3" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="107" cy="68" r="3" fill="goldenrod" variants={animated ? eyeVariants : {}} />
      <defs>
        <linearGradient id="flame-bodyGradient" x1="75" y1="70" x2="125" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD700" />
          <stop offset="0.5" stopColor="#FF8C00" />
          <stop offset="1" stopColor="#FF4500" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default FlamebirdNavi;
