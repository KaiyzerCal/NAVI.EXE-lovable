import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const GuardianNavi: React.FC<NaviProps> = ({ size = 220, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -2, 0], rotate: [0, 0.5, -0.5, 0] },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const headVariants = {
    idle: { rotate: [0, 2, -2, 0], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.rect x="85" y="100" width="50" height="70" rx="10" fill="url(#guard-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.rect x="95" y="70" width="30" height="30" rx="6" fill="#B0C4DE" stroke="#7A8BA1" strokeWidth="2" variants={animated ? headVariants : {}} />
      <motion.circle cx="105" cy="85" r="3.5" fill="#87CEFA" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="115" cy="85" r="3.5" fill="#87CEFA" variants={animated ? eyeVariants : {}} />
      <motion.rect x="130" y="145" width="8" height="15" rx="4" fill="#B0C4DE" variants={animated ? idleVariants : {}} />
      <defs>
        <linearGradient id="guard-bodyGradient" x1="85" y1="100" x2="135" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A9A9A9" />
          <stop offset="0.5" stopColor="#C0C0C0" />
          <stop offset="1" stopColor="#87CEFA" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default GuardianNavi;
