import React from 'react';
import { Layers, Shield, ShieldOff, Lock, LockOpen } from 'lucide-react';

const NoPassIcon = ({ size = 128, state = 'blocked' }) => {
  const isBlocked = state === 'blocked';
  const primaryColor = isBlocked ? '#ff0040' : '#00ff80';
  const bgGradient = isBlocked 
    ? 'from-[#1a0000] to-[#2d0a0a]'
    : 'from-[#001a0a] to-[#0a2d1a]';
  
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center relative`}
         style={{
           boxShadow: `0 0 ${size * 0.1}px ${primaryColor}, 0 0 ${size * 0.2}px ${primaryColor}`,
           border: `${size * 0.03}px solid ${primaryColor}`
         }}>
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full opacity-50"
           style={{
             background: `radial-gradient(circle at center, ${primaryColor}40 0%, transparent 70%)`
           }} />
      
      {/* Icon */}
      <div className="relative z-10" style={{ 
        color: primaryColor,
        filter: `drop-shadow(0 0 ${size * 0.05}px ${primaryColor})`
      }}>
        {isBlocked ? (
          <Lock size={size * 0.5} strokeWidth={2.5} />
        ) : (
          <LockOpen size={size * 0.5} strokeWidth={2.5} />
        )}
      </div>
      
      {/* Decorative ring */}
      <div className="absolute inset-2 rounded-full border-2 opacity-50"
           style={{ borderColor: primaryColor }} />
    </div>
  );
};

export default NoPassIcon;