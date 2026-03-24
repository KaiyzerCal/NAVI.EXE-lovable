import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const VoidwalkerNavi: React.FC<NaviProps> = ({ size = 250, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -3, 0], rotate: [0, 1, -1, 0] },
  };
  const appendageVariants = {
    idle: { rotate: [0, 5, -5, 0], transition: { duration: 4, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.15, 1], transition: { duration: 1.8, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const particleVariants = {
    idle: { opacity: [0.6, 1, 0.6], y: [0, -2, 0], transition: { duration: 2.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.ellipse cx="125" cy="140" rx="35" ry="50" fill="url(#vw-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.path d="M90 130 Q60 110 85 160" stroke="#8A2BE2" strokeWidth="4" fill="none" variants={animated ? appendageVariants : {}} />
      <motion.path d="M160 130 Q200 110 175 160" stroke="#8A2BE2" strokeWidth="4" fill="none" variants={animated ? appendageVariants : {}} />
      <motion.circle cx="125" cy="100" r="20" fill="#2E0854" stroke="#4B0082" strokeWidth="2" />
      <motion.circle cx="115" cy="95" r="4" fill="#9400D3" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="135" cy="95" r="4" fill="#9400D3" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="110" cy="150" r="3" fill="#8A2BE2" variants={animated ? particleVariants : {}} />
      <motion.circle cx="140" cy="160" r="3" fill="#8A2BE2" variants={animated ? particleVariants : {}} />
      <defs>
        <linearGradient id="vw-bodyGradient" x1="90" y1="100" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2E0854" />
          <stop offset="0.5" stopColor="#4B0082" />
          <stop offset="1" stopColor="#8A2BE2" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default VoidwalkerNavi;
