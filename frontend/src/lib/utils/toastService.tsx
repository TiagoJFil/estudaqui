import React, { useState, useEffect } from 'react'
import toast, { Toast } from 'react-hot-toast'

/**
 * Display a modern "No Credits" toast with countdown and Buy More action.
 * @param onBuy callback invoked when "Buy More Credits" is clicked
 * @param duration duration in milliseconds (default: 5000)
 */
export function showNoCreditsToast(onBuy: () => void, duration = 5000) {
  toast.custom((t: Toast) => {
    const [remaining, setRemaining] = useState(Math.ceil(duration / 1000))
    const [percent, setPercent] = useState(100)

    useEffect(() => {
      const start = Date.now()
      const timer = setInterval(() => {
        const elapsed = Date.now() - start
        if (elapsed >= duration) {
          clearInterval(timer)
          toast.dismiss(t.id)
        } else {
          setRemaining(Math.ceil((duration - elapsed) / 1000))
          setPercent(((duration - elapsed) / duration) * 100)
        }
      }, 100)
      return () => clearInterval(timer)
    }, [])

    return (
      <div className="w-80 bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg p-4 flex flex-col gap-2">
        <div className="text-gray-900 font-semibold text-lg">No Credits Remaining</div>
        <div className="text-gray-700 text-sm">Purchase more credits to continue.</div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            style={{ width: `${percent}%`, transition: 'width 0.1s linear' }}
          />
        </div>
        <div className="text-right text-xs text-gray-500">Closing in {remaining}s</div>
        <button
          onClick={() => { onBuy(); toast.dismiss(t.id) }}
          className="mt-2 px-3 py-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 transition-transform"
        >
          Buy More Credits
        </button>
      </div>
    )
  }, { duration })
}
