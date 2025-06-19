"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { GoogleIcon } from "./google-icon"
import { GithubIcon } from "./github-icon"
import { TwitterIcon } from "./twitter-icon"
import { SignInButton } from "./BuyCreditsButton";

interface StyledAuthDropDownProps {
  onSignIn: (platform: string) => void;
}

export function StyledAuthDropDown({ onSignIn }: StyledAuthDropDownProps) {
  return (
    <DropdownMenu>      <DropdownMenuTrigger asChild>
        <button className="px-4 py-2 h-[38px] bg-gradient-to-tr from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 hover:cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 flex items-center justify-center">
          Sign In
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white shadow-lg rounded-md p-2 w-48 mt-2">
        <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md" 
          onClick={() => onSignIn("google")}>
          <GoogleIcon width={20} height={20} />
          Sign in with Google
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md" 
          onClick={() => onSignIn("github")}>
          <GithubIcon width={20} height={20} />
          Sign in with GitHub
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md" 
          onClick={() => onSignIn("twitter")}>
          <TwitterIcon width={20} height={20} />
          Sign in with Twitter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
