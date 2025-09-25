
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const classes = `bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg p-6 ${className}`;
  return <div className={classes}>{children}</div>;
};
