import React from "react";

interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "right" | "bottom" | "left";
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  position = "right",
}) => {
  // Position-specific classes
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 -translate-y-1 mb-1",
    right: "left-full top-1/2 -translate-y-1/2 translate-x-1 ml-1",
    bottom: "top-full left-1/2 -translate-x-1/2 translate-y-1 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 -translate-x-1 mr-1",
  };

  return (
    <div className="relative group/tooltip inline-flex items-center justify-center">
      {children}
      <div
        className={`absolute ${positionClasses[position]} scale-0 group-hover/tooltip:scale-100 transition-all duration-200 origin-center z-50 min-w-max`}
      >
        <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {text}
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
