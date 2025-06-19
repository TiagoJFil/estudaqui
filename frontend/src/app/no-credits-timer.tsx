import React from "react";

export function NoCreditsTimer({ duration = 5000 }: { duration?: number }) {
  const [remaining, setRemaining] = React.useState(Math.ceil(duration / 1000));
  const [percent, setPercent] = React.useState(100);

  React.useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        clearInterval(timer);
      } else {
        setRemaining(Math.ceil((duration - elapsed) / 1000));
        setPercent(((duration - elapsed) / duration) * 100);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [duration]);

  return (
    <>
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden mt-2">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          style={{ width: `${percent}%`, transition: 'width 0.1s linear' }}
        />
      </div>
      <div className="text-right text-xs text-gray-500">Closing in {remaining}s</div>
    </>
  );
}
