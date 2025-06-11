"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Smartphone } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { paymentMethods } from "@/lib/contants"
import { CustomModal } from "./custom-modal"
import { useSession } from "next-auth/react"
import { SolanaPayQR } from "./solana-qr"
import { useUserContext } from "@/context/user-context"
import { handleCryptoPayment, handleQRPayment } from "@/lib/frontend/payment-service"
import { CheckCircle } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { PackType } from "@/lib/frontend/types"



function StatusBadge({ label, value, variant = "default" }: { 
  label: string; 
  value: string; 
  variant?: "default" | "error" | "success" | "warning" 
}) {
  const variantClasses = {
    default: "bg-blue-50 border-blue-200 text-blue-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800"
  }

  const valueClasses = {
    default: "text-blue-600",
    error: "text-red-600",
    success: "text-green-600",
    warning: "text-yellow-600"
  }

  return (
    <div className={`p-4 border rounded-lg ${variantClasses[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}:</span>
        <span className={`font-semibold ${valueClasses[variant]}`}>{value}</span>
      </div>
    </div>
  )
}

// Reusable Form Input Component
function FormInput({ 
  label, 
  type = "text", 
  placeholder, 
  gridSpan = "full" 
}: { 
  label: string; 
  type?: string; 
  placeholder: string; 
  gridSpan?: "full" | "half" 
}) {
  const spanClass = gridSpan === "half" ? "" : "col-span-2"
  
  return (
    <div className={spanClass}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-base"
      />
    </div>
  )
}

// Reusable Info Panel Component
function InfoPanel({ icon: Icon, title, description }: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-blue-600 mt-1" />
        <div>
          <h5 className="font-semibold text-blue-800 mb-1">{title}</h5>
          <p className="text-blue-700 text-sm">{description}</p>
        </div>
      </div>
    </div>
  )
}

function CreditCardItem({ label }: { label: string }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{label}</span>
        <div className="flex items-center gap-2">
          <img
            className="h-5 w-auto object-contain"
            src="https://js.stripe.com/v3/fingerprinted/img/visa-fb36094822f73d7bc581f6c0bad1c201.svg"
            alt="Visa"
          />
          <img
            className="h-5 w-auto object-contain"
            src="https://js.stripe.com/v3/fingerprinted/img/mastercard-86e9a2b929496a34918767093c470935.svg"
            alt="Mastercard"
          />
          <img
            className="h-5 w-auto object-contain"
            src="https://js.stripe.com/v3/fingerprinted/img/amex-b933c9009eeaf8cfd07e789c549b8c57.svg"
            alt="American Express"
          />
          <span className="text-xs text-gray-500">+3 more</span>
        </div>
      </div>
    </div>
  )
}

function PaymentOptionItem({ id, label, icon: Icon, selected, onSelect }: { 
  id: string; 
  label: string; 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
  selected: boolean; 
  onSelect: (id: string) => void 
}) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-full p-4 text-left rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all ${
        selected ? "bg-purple-100 border-purple-600 shadow-sm" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      {id === "card" ? (
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 flex-shrink-0" />
          <CreditCardItem label={label} />
        </div>      ) : (
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <span className="font-medium">{label}</span>
        </div>
      )}
    </button>
  )
}

function PaymentOptionsList({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800 mb-2 text-lg">Payment Methods</h3>
      {paymentMethods.map(({ id, label, icon }) => (
        <PaymentOptionItem
          key={id}
          id={id}
          label={label}
          icon={icon}
          selected={selectedId === id}
          onSelect={onSelect}
        />
      ))}
</div>
  )
}

function PaymentDetailsPanel({
  useQRCode,
  setUseQRCode,
  selectedId,
  pack,
  userID,
  getOrderID,
  timerTIMEOUT
  
   }: { useQRCode: boolean; setUseQRCode: (value: boolean) => void;
     selectedId: string; pack : PackType, userID: string,timerTIMEOUT: number,
      getOrderID: () => string }) {

  const price = pack!.priceUSD
  const { disconnect, connecting, connected, publicKey, wallet, sendTransaction } = useWallet()
  const { setVisible } = useWalletModal()



  const handleWalletAction = async () => {
    try {
      if (connected) {
        await disconnect()
      } else {
        // Use the wallet modal for selection instead of direct connect
        setVisible(true)
      }
    } catch (error) {
      console.error("Wallet connection error:", error)
    }
  }

  const renderPaymentForm = () => {
    switch (selectedId) {      case "crypto":
        return (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">            {useQRCode ? (
              // QR Code Payment View
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-2xl text-gray-800">Pay with Crypto Wallet</h4>
                  <button
                    onClick={() => setUseQRCode(false)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Use Browser Wallet →
                  </button>
                </div>
                <p className="text-gray-600 mb-5  text-m">Open your Solana wallet app and scan this QR code to complete the payment of {price} USDC.</p>                  {/* QR Code Container */}
                <div className="flex flex-col items-center mb-1">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm ">
                    <SolanaPayQR timerTIMEOUT={timerTIMEOUT} amount={price}  userID={userID} packName={pack.name} packID={pack.id} getOrderID={getOrderID} />
                  </div>
                </div>
              </>
            ) : (
              // Browser Wallet Connection View
              <>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-2xl text-gray-800">Connect Your Wallet</h4>
                  <button
                    onClick={() => setUseQRCode(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    ← Back to QR Code
                  </button>
                </div>
                <p className="text-gray-600 mb-6 text-lg">Connect your Solana wallet to proceed with payment</p>
                
                <div className="space-y-4 mb-8">
                  <StatusBadge 
                    label="Wallet Status" 
                    value={connected ? "Connected" : "Not Connected"} 
                    variant={connected ? "success" : "error"} 
                  />
                  {connected && publicKey && wallet && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">Wallet Address</div>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={wallet.adapter.icon} 
                          alt={wallet.adapter.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-lg font-mono text-gray-800">
                          {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleWalletAction}
                  disabled={connecting}
                  className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting 
                    ? "Connecting..." 
                    : connected 
                      ? "Disconnect Wallet" 
                      : "Select Wallet"
                  }
                </button>
              </>
            )}
          </div>
        )
        
      case "visa":
      case "mastercard":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold mb-6 text-2xl text-gray-800">Card Information</h4>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormInput 
                  label="Card Number" 
                  placeholder="1234 5678 9012 3456" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput 
                    label="Expiry Date" 
                    placeholder="MM/YY" 
                    gridSpan="half"
                  />
                  <FormInput 
                    label="CVV" 
                    placeholder="123" 
                    gridSpan="half"
                  />
                </div>
              </div>
              
              <FormInput 
                label="Cardholder Name" 
                placeholder="John Doe" 
              />
              
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="save-card"
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="save-card" className="text-gray-700 font-medium">
                  Save this card for future payments
                </label>
              </div>
            </div>
          </div>
        )
        
      case "mbway":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold mb-6 text-2xl text-gray-800">MB Way Payment</h4>
            <div className="space-y-6">
              <FormInput 
                label="Phone Number" 
                type="tel"
                placeholder="+351 912 345 678" 
              />
              
              <InfoPanel 
                icon={Smartphone}
                title="How it works"
                description="You will receive a notification on your MB Way app to confirm the payment. Make sure your phone is nearby and the app is installed."
              />
            </div>
          </div>
        )
      
      default:
        return (
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-700 text-xl">Payment method: <span className="font-semibold capitalize">{selectedId}</span></p>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {renderPaymentForm()}
    </div>
  )
}

function PaymentSummary({ selectedPayment, onConfirm, isProcessing = false, price, useQRCode, walletConnected}: { 
  selectedPayment: string; 
  onConfirm: () => void; 
  isProcessing?: boolean; 
  price: number;
  useQRCode: boolean;
  walletConnected: boolean;
}) {
  const isCrypto = selectedPayment === "crypto"

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
      { useQRCode ? (
        <>
        <h3 className="font-semibold mb-6 text-2xl text-gray-800">Payment Status</h3>
        <div className="space-y-4 mb-8">
          <StatusBadge 
            label="Amount" 
            value={`${price} USDC`} 
            variant="success" 
          />
          <StatusBadge 
            label="Status" 
            value={isProcessing ? "Processing..." : "Pending"} 
            variant={isProcessing ? "warning" : "default"} 
          />
        </div>
        </>
        ) : (
        <>
      <h3 className="font-semibold mb-6 text-2xl text-gray-800">Payment Summary</h3>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 text-lg">Standard Pack</span>          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {isCrypto ? price : "$" + price.toFixed(2)}
            </span>            {isCrypto && (
              <Image 
                src="/USDC.png" 
                alt="USDC"
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
          </div>
        </div>
        

        
        <div className="">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-800">Total</span>            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-purple-600">
              {isCrypto ? price : "$" + price.toFixed(2)}
              </span>              {isCrypto && (
                <Image 
                  src="/USDC.png" 
                  alt="USDC"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>        <button
        onClick={onConfirm}
        disabled={isProcessing || (isCrypto && !useQRCode && !walletConnected)}
        className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-xl transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing 
          ? "Processing Payment..." 
          : (isCrypto && !useQRCode && !walletConnected)
            ? "Connect Wallet to Continue"
            : "Confirm Payment"
        }
      </button>
      </>
      )}
    </div>
  )
}

export default function PaymentModal({ 
    pack,
    isOpen, 
    onClose 
  }: { 
    pack :PackType;
    isOpen: boolean; 
    onClose: () => void 
  }) {
    
  const [selectedPayment, setSelectedPayment] = useState("crypto")
  const [isProcessing, setIsProcessing] = useState(false)
  const { connected, publicKey, sendTransaction } = useWallet()
  const { data: session, status  } = useSession()
  const { credits, setCredits } = useUserContext();
  const [useQRCode, setUseQRCode] = useState(true)
  const [orderID, setOrderID] = useState<string | null>(null)
  const TIMEOUT = 5 * 60 // 5 minutes timeout
  const checkerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
const [paymentSuccess, setPaymentSuccess] = useState(false)
const router = useRouter()

  const price = pack!.priceUSD
  const onPaymentSuccess = () => {
    setCredits(credits + pack.credits)
  setIsProcessing(false)
  setPaymentSuccess(true)
  toast.success(`Successfully purchased ${pack.name}!`)
  
  // Close modal after a short delay
  setTimeout(() => {
    onClose()
    router.push('/')
  }, 3000)
  }
  const onError = (error: Error) => {
    console.error("Payment error:", error)
    alert("An error occurred while processing your payment. Please try again.")
    setIsProcessing(false)
  }

  const handleConfirmPayment = async () => {
    switch (selectedPayment) {
      case "visa":
        // Handle card payment (not implemented)
        console.log("Proceeding with card payment for", selectedPayment)
        alert("This payment method is not yet implemented")
        onClose()
        break
      case "mastercard":
        // Handle card payment (not implemented)
        console.log("Proceeding with card payment for", selectedPayment)
        alert("This payment method is not yet implemented")
        onClose()
        break
      case "mbway":
        // Handle MB Way payment (not implemented)
        console.log("Proceeding with MB Way payment for", selectedPayment)
        alert("This payment method is not yet implemented")
        onClose()
        break
      case "crypto":
        setIsProcessing(true)      // Browser wallet payment flow
        if(connected && publicKey){
          await handleCryptoPayment(
            session!.user!.email!,
            pack.id,
            price,
            publicKey!,
            sendTransaction,
            onError,
            onPaymentSuccess
          )
        }
        break
    default: {
      // Handle other payment methods (not implemented)
      console.log("Proceeding with payment for", selectedPayment)
      alert("This payment method is not yet implemented")
      onClose()
    }
  }
}



  const generateOrderID = () => {
    const value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setOrderID(value)
    return value
  }

const paymentFlowStartedRef = React.useRef(false);

  React.useEffect(() => {
    const handlePaymentCheck = async () => {
      if(useQRCode && orderID && !checkerTimeoutRef.current && isOpen && !paymentFlowStartedRef.current) { 
        console.log("Using QR code payment flow")
      paymentFlowStartedRef.current = true;
          
        const timeout = await handleQRPayment(
              pack.id,
              session!.user!.email!,
              price,
              orderID,
              TIMEOUT,
              onError,
              onPaymentSuccess
            )
        checkerTimeoutRef.current = timeout
      }
      paymentFlowStartedRef.current = false;
    }
    handlePaymentCheck()

    return () => {
      if(checkerTimeoutRef.current){
        console.log("Clearing timeout for QR code payment: ", checkerTimeoutRef.current)
        clearInterval(checkerTimeoutRef.current)
        checkerTimeoutRef.current = null
      }
    };
  }, [useQRCode,orderID,isOpen])

  React.useEffect(() => {
    if (!isOpen && checkerTimeoutRef.current) {
      console.log("Modal closed, clearing timeout for QR code payment");
      clearInterval(checkerTimeoutRef.current);
      checkerTimeoutRef.current = null; 
    paymentFlowStartedRef.current = false;
    }
  }, [isOpen]);
  return (
    <>
      <CustomModal isOpen={isOpen} onClose={onClose}>
        <div className="grid grid-cols-[480px_1fr] h-[800px]">
          {/* Left side - Header and Payment Options */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 border-r border-gray-200">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Checkout</h1>
              <p className="text-gray-600 text-lg">
                Choose your preferred payment method for the {pack.name}.
              </p>
              <div className="mt-6 bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-semibold text-lg text-gray-800">{pack.name}</div>
                    <div className="text-gray-600 text-sm">{pack.description}</div>
                  </div>
                </div>
              </div>
            </div>
              <PaymentOptionsList
              selectedId={selectedPayment}
              onSelect={setSelectedPayment}
            />
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Privacy Disclaimer</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We respect your privacy. Your personal information will never be sold, shared, or used for any purpose other than processing your order.
              </p>
            </div>
          </div>
            {/* Right side - Payment Details and Summary */}
          <div className="bg-gray-50 p-8 flex flex-col overflow-y-auto">
            {/* Replace your existing PaymentDetailsPanel with this conditional rendering */}
<div className="flex-1">
  {paymentSuccess ? (
    <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm h-full flex flex-col items-center justify-center">
      <div className="animate-bounce-once">
        <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
      </div>
      <h2 className="font-bold text-2xl text-gray-800 mb-3 text-center">
        Payment Successful!
      </h2>
      <p className="text-gray-600 text-center mb-6">
        You've purchased {pack.name} for {price} USDC.
        {pack.credits} credits have been added to your account.
      </p>
      <div className="text-center text-lg font-medium text-green-700">
        Redirecting to your dashboard...
      </div>
      <div className="mt-8 w-full max-w-md bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-3000 ease-out"
             style={{ width: "100%" }} />
      </div>
    </div>
  ) : (
    <PaymentDetailsPanel 
      useQRCode={useQRCode}
      setUseQRCode={setUseQRCode}
      selectedId={selectedPayment} 
      pack={pack}
      userID={session!.user!.email!}
      getOrderID={generateOrderID}
      timerTIMEOUT={TIMEOUT}
    />
  )}
</div>            <PaymentSummary 
              selectedPayment={selectedPayment} 
              onConfirm={handleConfirmPayment}
              isProcessing={isProcessing}
              price={price}
              useQRCode={useQRCode}
              walletConnected={connected}
            />
            
          </div>
        </div>
      </CustomModal>
    </>
  )
}
