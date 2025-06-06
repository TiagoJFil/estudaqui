import { getQRCryptoPaymentIDMemo, hashAndEncodeBase58, NEXT_PUBLIC_USDC_MINT } from "@/lib/utils"
import { TransferRequestURLFields, encodeURL, createQR } from "@solana/pay"
import { PublicKey } from "@solana/web3.js"
import { useState, useEffect, useRef, useMemo } from "react"
import BigNumber from "bignumber.js"

export function SolanaPayQR({ qrKey, amount, userID, packName, packID, getOrderID }: 
  { qrKey: number, amount: number, userID: string, packName: string, packID: string , getOrderID: () => string }) {
  const [qrCodeElement, setQrCodeElement] = useState<HTMLDivElement | null>(null)
  const timer_timeout = 30;
  const [timer, setTimer] = useState(timer_timeout); // Timer starts at 5 minutes
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
        const qr = createQR(url, 224, 'transparent')
        
        qrCodeElement.innerHTML = ''
        qr.append(qrCodeElement)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [amount, qrCodeElement,qrKey, refreshKey]);

  useEffect(() => {
    // Start the timer countdown
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          setRefreshKey((key) => key + 1); // Trigger QR regeneration
          return timer_timeout; // Reset timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleGenerateClick = () => {
    setRefreshKey((key) => key + 1); // Trigger QR regeneration
    setTimer(timer_timeout); // Reset timer
  };

  return (
    <div>
    <div className="w-54 h-54 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col items-center justify-center">
      <div 
        ref={setQrCodeElement}
        className="w-full h-full flex items-center justify-center"
      />
      
    </div>
    <div className="mt-2 text-gray-500 text-sm">Time remaining: {formattedTime}</div>
      <button 
        onClick={handleGenerateClick} 
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Generate
      </button>
      </div>
  );
}