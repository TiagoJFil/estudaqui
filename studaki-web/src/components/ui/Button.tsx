import React from "react";

/**
 * Props for the Button component.
 */
interface ButtonProps {
  /**
   * The content to be displayed inside the button.
   */
  children: React.ReactNode;
  /**
   * The function to call when the button is clicked.
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * The style variant of the button.
   * @default 'solid'
   */
  variant?: "solid" | "outlined";
  /**
   * The width of the button (e.g., '200px', '100%').
   */
  width?: string;
  /**
   * The height of the button (e.g., '50px', '3rem').
   */
  height?: string;
  /**
   * Additional CSS classes to apply to the button.
   */
  className?: string;
  /**
   * The type of the button.
   * @default 'button'
   */
  type?: "button" | "submit" | "reset";
}

/**
 * A reusable button component with solid and outlined variants.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "solid",
  width,
  height,
  className = "",
  type = "button",
}) => {
  const baseStyles =
    "rounded-full flex items-center justify-center font-semibold transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyles = {
    solid:
      "bg-accent text-white font-semibold py-2 px-6 rounded-2xl hover:bg-accentHover",
    outlined:
      "bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-gray-400",
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      style={{ width, height }}
    >
        <div className="bg-red-500 text-white p-4">Tailwind is working?</div>
      {children}
    </button>
  );
};
