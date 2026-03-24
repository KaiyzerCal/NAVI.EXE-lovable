import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const StormdrakeNavi: React.FC<NaviProps> = ({ size = 250, animated = true }) => {
  const idleVariants = {
    idle: { y: [0, -3, 0], rotate: [0, 1, -1, 0] },
  };
  const wingVariants = {
    idle: { rotate: [0, 3, -3, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const tailVariants = {
    idle: { rotate: [0, 5, -5, 0], transition: { duration: 4, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.ellipse cx="125" cy="140" rx="35" ry="50" fill="url(#storm-bodyGradient)" variants={animated ? idleVariants : {}} />
      <motion.path d="M90 130 Q50 100 80 150" fill="#1A1F3A" variants={animated ? wingVariants : {}} />
      <motion.path d="M160 130 Q200 100 170 150" fill="#1A1F3A" variants={animated ? wingVariants : {}} />
      <motion.path d="M125 190 Q110 210 125 220 Q140 230 125 240" stroke="#1A1F3A" strokeWidth="6" strokeLinecap="round" variants={animated ? tailVariants : {}} />
      <motion.circle cx="125" cy="100" r="20" fill="#2C3A59" stroke="#1A1F3A" strokeWidth="2" />
      <motion.circle cx="115" cy="95" r="4" fill="#00FFFF" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="135" cy="95" r="4" fill="#00FFFF" variants={animated ? eyeVariants : {}} />
      <defs>
        <linearGradient id="storm-bodyGradient" x1="90" y1="100" x2="160" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2C3A59" />
          <stop offset="0.5" stopColor="#1A1F3A" />
          <stop offset="1" stopColor="#00BFFF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default StormdrakeNavi;
