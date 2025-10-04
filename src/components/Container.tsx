import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ children, className = '' }: ContainerProps) => {
  return (
    <div className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
};
