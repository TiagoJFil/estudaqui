import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center p-0 m-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-gray-700 text-lg font-semibold animate-pulse">Loading...</div>
      </div>
    </div>
  );
}
