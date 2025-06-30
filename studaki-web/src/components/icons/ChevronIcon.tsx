import React from "react";

interface ChevronIconProps {
  className?: string;
  width?: number;
  height?: number;
  direction?: 'left' | 'right';
}

const ChevronIcon: React.FC<ChevronIconProps> = ({ 
  className = "",
  width = 20,
  height = 20,
  direction = 'right'
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {direction === 'right' ? (
        <path d="M9 18l6-6-6-6"></path>
      ) : (
        <path d="M15 18l-6-6 6-6"></path>
      )}
    </svg>
  );
};

export default ChevronIcon;
