"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-6">
      <h1 className="text-4xl font-bold text-gray-800">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600">Sorry, the page you are looking for does not exist.</p>
      <div className="flex space-x-4">
        <Button size="lg" onClick={() => router.push('/')}>Go to Home</Button>
      </div>
    </div>
  );
}
