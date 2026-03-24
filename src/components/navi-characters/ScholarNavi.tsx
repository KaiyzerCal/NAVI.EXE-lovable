import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const ScholarNavi: React.FC<NaviProps> = ({ size = 220, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -2, 0], rotate: [0, 0.5, -0.5, 0] },
  };
  const tailVariants = {
    idle: { rotate: [0, 3, -3, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const headVariants = {
    idle: { rotate: [0, 2, -2, 0], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.rect x="90" y="110" width="40" height="60" rx="8" fill="url(#scholar-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.circle cx="110" cy="90" r="15" fill="#B0E0E6" stroke="#5F9EA0" strokeWidth="2" variants={animated ? headVariants : {}} />
      <motion.circle cx="105" cy="88" r="3.5" fill="#20B2AA" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="115" cy="88" r="3.5" fill="#20B2AA" variants={animated ? eyeVariants : {}} />
      <motion.rect x="135" y="155" width="6" height="15" rx="3" fill="#B0E0E6" variants={animated ? tailVariants : {}} />
      <defs>
        <linearGradient id="scholar-bodyGradient" x1="90" y1="110" x2="130" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B0C4DE" />
          <stop offset="0.5" stopColor="#B0E0E6" />
          <stop offset="1" stopColor="#5F9EA0" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default ScholarNavi;
