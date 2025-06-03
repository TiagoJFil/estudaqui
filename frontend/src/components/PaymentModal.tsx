"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { XIcon, CreditCard, Smartphone, Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js"
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { NEXT_PUBLIC_USDC_MINT } from "@/lib/utils"


const paymentMethods = [
  { id: "crypto", label: "Pay with Crypto Wallet", icon: Wallet },
  { id: "mbway", label: "MB Way", icon: Smartphone },
  { id: "visa", label: "Visa", icon: CreditCard },
  { id: "mastercard", label: "Mastercard", icon: CreditCard },
]

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

function CustomModal({ isOpen, onClose, children }: CustomModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm transition-colors"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <XIcon className="w-5 h-5 text-gray-500" />
        </button>
        {children}
      </div>
    </div>
  )
}

// Reusable Status Badge Component
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
      className={`flex items-center gap-3 w-full px-4 py-4 text-base rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all ${
        selected ? "bg-purple-100 border-purple-600 shadow-sm" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="font-medium">{label}</span>
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

function PaymentDetailsPanel({ selectedId }: { selectedId: string; }) {
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
    switch (selectedId) {
      case "crypto":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-semibold mb-4 text-2xl text-gray-800">Connect Your Wallet</h4>
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

function PaymentSummary({ selectedPayment, onConfirm, isProcessing = false }: { 
  selectedPayment: string; 
  onConfirm: () => void | Promise<void>; 
  isProcessing?: boolean; 
}) {
  const isCrypto = selectedPayment === "crypto"
  
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-6">
      <h3 className="font-semibold mb-6 text-2xl text-gray-800">Payment Summary</h3>
      
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center py-3 border-b border-gray-100">
          <span className="text-gray-600 text-lg">Standard Pack</span>          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">
              {isCrypto ? "10.00" : "$10.00"}
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
                {isCrypto ? "10.00" : "$10.00"}
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
      </div>
        <button
        onClick={onConfirm}
        disabled={isProcessing}
        className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-xl transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing Payment..." : "Confirm Payment"}
      </button>
    </div>
  )
}

export default function PaymentModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState("mastercard")
  const [isProcessing, setIsProcessing] = useState(false)
  const { connected, publicKey, sendTransaction } = useWallet()

  const handleConfirmPayment = async () => {
    if (selectedPayment === "crypto") {
      if (!connected || !publicKey) {
        alert("Please connect your wallet first")
        return
      }

      setIsProcessing(true)
      try {
        // Create connection to Solana
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com")
        const receiverPublicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER || "")
        const usdcMint = new PublicKey(NEXT_PUBLIC_USDC_MINT)
        
        // Calculate amount in USDC (10.00 USDC = 10,000,000 lamports)
        const amountUSD = 10.00
        const amountInLowestAmt = Math.round(amountUSD * 1_000_000)

        // Get associated token accounts
        const senderTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          publicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const receiverTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          receiverPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
          senderTokenAccount,
          receiverTokenAccount,
          publicKey,
          amountInLowestAmt,
          [],
          TOKEN_PROGRAM_ID
        )

        // Create transaction
        const transaction = new Transaction()
        transaction.add(transferInstruction)

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        // Send transaction
        const signature = await sendTransaction(transaction, connection)
        console.log("Transaction sent:", signature)

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        })

        if (confirmation.value.err) {
          throw new Error("Transaction failed")
        }

        // Verify payment with backend
        const response = await fetch("/api/v1/payment/solana", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicKey: publicKey.toBase58(),
            signature,
            amountUSD
          }),
        })

        if (!response.ok) {
          throw new Error("Payment verification failed")
        }

        const result = await response.json()
        if (result.success) {
          alert("Payment successful!")
          setIsOpen(false)
        } else {
          throw new Error("Payment verification failed")
        }

      } catch (error) {
        console.error("Payment error:", error)
        alert(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsProcessing(false)
      }
    } else {
      // Handle other payment methods (not implemented)
      console.log("Proceeding with payment for", selectedPayment)
      alert("This payment method is not yet implemented")
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors shadow-md"
      >
        Open Payment Modal
      </button>

      <CustomModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="grid grid-cols-[480px_1fr] h-[800px]">
          {/* Left side - Header and Payment Options */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 border-r border-gray-200">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Standard Pack Checkout</h1>
              <p className="text-gray-600 text-lg">
                Choose your preferred payment method for the Standard Pack.
              </p>
            </div>
            
            <PaymentOptionsList
              selectedId={selectedPayment}
              onSelect={setSelectedPayment}
            />
          </div>
            {/* Right side - Payment Details and Summary */}
          <div className="bg-gray-50 p-8 flex flex-col overflow-y-auto">
            <div className="flex-1">
              <PaymentDetailsPanel 
                selectedId={selectedPayment} 
              />
            </div>
              <PaymentSummary 
              selectedPayment={selectedPayment} 
              onConfirm={handleConfirmPayment}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </CustomModal>
    </>
  )
}
