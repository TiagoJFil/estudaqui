import React from "react";

interface BuyCreditsButtonProps {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const BuyCreditsButton: React.FC<BuyCreditsButtonProps> = ({
  onClick,
  className = "",
  children = "Buy More Credits",
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}    className={
      `px-4 py-2 h-[38px] bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 hover:cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center ` +
      className
    }
    aria-label="Buy more credits"
  >
    {children}
  </button>
);

export const SignInButton: React.FC<BuyCreditsButtonProps> = ({
  onClick,
  className = "",
  children = "Sign In",
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}    className={
      `px-4 py-2 h-[38px] bg-gradient-to-tr from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 hover:cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center ` +
      className
    }
    aria-label="Sign in"
  >
    {children}
  </button>
);
