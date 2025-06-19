"use client"

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ExamNotFound() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full min-h-screen flex items-center justify-center p-0 m-0"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Exam Not Found</h2>
        <p className="text-gray-600">This exam could not be found. It may have been deleted or the link is incorrect.</p>
        <Button size="lg" onClick={() => router.push('/')}>Go back home</Button>
      </div>
    </motion.div>
  );
}
