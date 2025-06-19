"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ExamNotFound() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Exam Not Found</h2>
      <p className="text-gray-600">This exam could not be found. It may have been deleted or the link is incorrect.</p>
      <Button size="lg" onClick={() => router.push('/')}>Go back home</Button>
    </div>
  );
}
