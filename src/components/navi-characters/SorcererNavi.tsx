import React from 'react';
import { motion } from 'framer-motion';

interface NaviProps {
  size?: number;
  animated?: boolean;
}

const SorcererNavi: React.FC<NaviProps> = ({ size = 230, animated = true }) => {
  const cloakVariants = {
    idle: { rotate: [0, 2, -2, 0], transition: { duration: 3, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const idleVariants = {
    idle: { y: [0, -2, 0], rotate: [0, 1, -1, 0] },
  };
  const eyeVariants = {
    idle: { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, repeatType: 'mirror' as const } },
  };
  const energyVariants = {
    idle: { y: [0, -3, 0], opacity: [0.6, 1, 0.6], transition: { duration: 2, repeat: Infinity, repeatType: 'mirror' as const } },
  };

  return (
    <motion.svg width={size} height={size} viewBox="0 0 230 230" fill="none" xmlns="http://www.w3.org/2000/svg" animate={animated ? 'idle' : undefined}>
      <motion.rect x="95" y="100" width="40" height="70" rx="10" fill="url(#sorc-cloakGradient)" variants={animated ? cloakVariants : {}} />
      <motion.circle cx="115" cy="85" r="15" fill="#4B0082" stroke="#2E0854" strokeWidth="2" variants={animated ? idleVariants : {}} />
      <motion.circle cx="110" cy="82" r="3.5" fill="#8A2BE2" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="120" cy="82" r="3.5" fill="#8A2BE2" variants={animated ? eyeVariants : {}} />
      <motion.circle cx="90" cy="120" r="5" fill="#8A2BE2" variants={animated ? energyVariants : {}} />
      <motion.circle cx="140" cy="120" r="5" fill="#8A2BE2" variants={animated ? energyVariants : {}} />
      <defs>
        <linearGradient id="sorc-cloakGradient" x1="95" y1="100" x2="135" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4B0082" />
          <stop offset="0.5" stopColor="#551A8B" />
          <stop offset="1" stopColor="#9370DB" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default SorcererNavi;
