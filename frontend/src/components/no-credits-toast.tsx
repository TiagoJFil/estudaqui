import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface NoCreditsToastProps {
  toastId: string;
  duration?: number;
}

const NoCreditsToast: React.FC<NoCreditsToastProps> = ({ toastId, duration = 5000 }) => {
  const [remaining, setRemaining] = useState(Math.ceil(duration / 1000));
  const [percent, setPercent] = useState(100);
  const router = useRouter();

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        clearInterval(timer);
        toast.dismiss(toastId);
      } else {
        setRemaining(Math.ceil((duration - elapsed) / 1000));
        setPercent(((duration - elapsed) / duration) * 100);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [duration, toastId]);

  return (
    <div className="w-80 bg-white bg-opacity-70 backdrop-blur-md rounded-xl shadow-lg p-4 flex flex-col animate-fadeIn">
      <h4 className="text-gray-900 font-semibold text-lg">No Credits Remaining</h4>
      <p className="text-gray-700 text-sm">Purchase more credits to continue.</p>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ width: `${percent}%`, transition: 'width 0.1s linear' }}
        />
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">Closing in {remaining}s</div>
      <button
        onClick={() => {
          router.push('/buy');
          toast.dismiss(toastId);
        }}
        className="mt-3 px-3 py-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 transition-transform"
      >
        Buy More Credits
      </button>
    </div>
  );
};

export default NoCreditsToast;
