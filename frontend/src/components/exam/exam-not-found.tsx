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
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">This exam could not be found.</h2>
        <p className="text-gray-600">It may have been deleted or the link is incorrect.</p>
        <Button size="lg" onClick={() => router.push('/')}>Go back home</Button>
      </div>
    </motion.div>
  );
}
