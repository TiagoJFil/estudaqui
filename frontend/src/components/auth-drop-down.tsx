"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./ui/google-icon"
import { GithubIcon } from "./ui/github-icon"

interface AuthDropDownProps {
  onSignIn: (platform: string) => void;
}
export function AuthDropDown({ onSignIn }: AuthDropDownProps) {
  
    return (
        <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="hover:bg-gray-200 hover:text-black transition-colors">
                  Sign in
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white shadow-lg rounded-md p-2 w-48">
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md" 
                onClick={() => onSignIn("google")}>
                  <GoogleIcon width={20} height={20} />
                  Sign in with Google
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md" onClick={() => onSignIn("github") }>
                  <GithubIcon width={20} height={20} />
                  Sign in with GitHub
                </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
     );
}