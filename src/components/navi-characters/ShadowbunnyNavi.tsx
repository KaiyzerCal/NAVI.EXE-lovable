import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const ShadowbunnyNavi: React.FC<NaviProps> = ({ size = 200, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -1.5, 0], rotate: [0, 0.5, -0.5, 0] },
  };
  const earVariants = {
    idle: { rotate: [0, 2, -2, 0], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const tailVariants = {
    idle: { rotate: [0, 3, -3, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.ellipse cx="100" cy="130" rx="25" ry="35" fill="url(#shadow-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.circle cx="100" cy="100" r="15" fill="#2C2C3B" stroke="#55506D" strokeWidth="2" />
      <motion.circle cx="93" cy="98" r="3" fill="#AA88FF" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="107" cy="98" r="3" fill="#AA88FF" variants={animated ? eyeVariants : {}} />
      <motion.polygon points="85,85 95,60 95,85" fill="#2C2C3B" stroke="#55506D" strokeWidth="1.5" variants={animated ? earVariants : {}} />
      <motion.polygon points="115,85 105,60 105,85" fill="#2C2C3B" stroke="#55506D" strokeWidth="1.5" variants={animated ? earVariants : {}} />
      <motion.circle cx="135" cy="145" r="5" fill="#2C2C3B" variants={animated ? tailVariants : {}} />
      <defs>
        <linearGradient id="shadow-bodyGradient" x1="75" y1="100" x2="125" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2C2C3B" />
          <stop offset="0.5" stopColor="#3B3B50" />
          <stop offset="1" stopColor="#55506D" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default ShadowbunnyNavi;
