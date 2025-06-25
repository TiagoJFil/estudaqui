import { getQRCryptoPaymentIDMemo } from "@/lib/utils"
import { TransferRequestURLFields, encodeURL, createQR } from "@solana/pay"
import { PublicKey } from "@solana/web3.js"
import { useState, useEffect, useRef, useMemo } from "react"
import BigNumber from "bignumber.js"
import { NEXT_PUBLIC_USDC_MINT } from "@/lib/contants"

export function SolanaPayQR({ amount, userID, packName, packID, timerTIMEOUT, getOrderID }: 
  {  amount: number, userID: string, packName: string, packID: string, timerTIMEOUT : number , getOrderID: () => string }) {
  const [qrCodeElement, setQrCodeElement] = useState<HTMLDivElement | null>(null)
  const [timer, setTimer] = useState(timerTIMEOUT); // Timer starts at 5 minutes
  const [refreshKey, setRefreshKey] = useState(0); // Key to trigger QR regeneration
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [timer]);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const orderID = getOrderID();
        if (!qrCodeElement) return;

        // Create the transfer URL for Solana Pay
        const recipient = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER || "");
        const splToken = new PublicKey(NEXT_PUBLIC_USDC_MINT);

        const paymentMemo = await getQRCryptoPaymentIDMemo(userID, packID, orderID);
        const transferFields: TransferRequestURLFields = {
          recipient,
          amount: new BigNumber(amount),
          splToken,
          memo: paymentMemo,
          label: "Studaki " + packName + " Pack",
          message: "Payment for " + packName + " Pack subscription",
        };

        const url = encodeURL(transferFields)
        const qr = createQR(url, 220, 'transparent')
        
        qrCodeElement.innerHTML = ''
        qr.append(qrCodeElement)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [amount, qrCodeElement, refreshKey]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setRefreshKey((key) => key + 1); 
          return timerTIMEOUT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleGenerateClick = () => {
    setRefreshKey((key) => key + 1); 
    setTimer(timerTIMEOUT); 
  };
  // Determine timer color based on remaining time
  const timerColor = useMemo(() => {
    if (timer < 30) return "text-red-500"; // Less than 30 seconds
    if (timer < 60) return "text-amber-500"; // Less than 1 minute
    return "text-green-500"; // More than 1 minute
  }, [timer]);
  
  // Calculate symmetric timer gradient values
  const timePercentage = useMemo(() => (timer / timerTIMEOUT) * 100, [timer, timerTIMEOUT]);
  const halfPercentage = timePercentage / 2;
  
  // Generate color for the border animation based on remaining time
  const borderColor = useMemo(() => {
    if (timer < 30) return "#ef4444"; // red-500
    if (timer < 60) return "#f59e0b"; // amber-500
    return "#3b82f6"; // blue-500
  }, [timer]);
  
  const startAngle = useMemo(() => Math.round((timePercentage / 100) * 180), [timePercentage]);
  const endAngle = useMemo(() => 360 - startAngle, [startAngle]);

  return (
    <div className="flex flex-col items-center">
      {/* QR Code container with animated border */}
      <div 
        className="relative w-56 h-56 flex items-center justify-center  bg-white rounded-lg shadow-md" 
        style={{
          background: `linear-gradient(white, white) padding-box, 
                      conic-gradient(
                        from 180deg,
                        ${borderColor} 0deg ${startAngle}deg,
                        transparent ${startAngle}deg ${endAngle}deg,
                        ${borderColor} ${endAngle}deg 360deg
                      ) border-box`,
          border: "4px solid transparent",
          borderRadius: "8px",
          transition: "background 0.5s ease"
        }}
      >
        <div 
          ref={setQrCodeElement}
          className="w-full h-full flex items-center justify-center"
        />
      </div>

      {/* Timer display */}
      <div className={`mt-2 font-mono text-lg font-bold ${timerColor} flex items-center justify-center`}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {formattedTime}
      </div>

      {/* Refresh button with improved styling */}
      <button 
        onClick={handleGenerateClick} 
        className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md 
          shadow-md hover:shadow-lg transform transition-all duration-200 hover:scale-105 
          active:scale-95 flex items-center justify-center gap-2 font-medium text-base"
      >
        <svg className="w-5 h-5 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Regenerate QR
      </button>
    </div>
  );
}