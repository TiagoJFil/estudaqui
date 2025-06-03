"use client"

import React, { useState } from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { CreditCard, Smartphone } from 'lucide-react'
// Components
import InstantPackCard from '@/components/ui/InstantPackCard'
import SubscriptionPackCard from '@/components/ui/SubscriptionPackCard'
import PaymentModal from '@/components/PaymentModal'

export type PackType = {
  name: string
  price: number
  description: string
  amount?: number
  type: 'instant' | 'subscription'
}

// Define available packs
const PACKS: PackType[] = [
  { name: 'Basic Pack', price: 2.5, description: '10 tokens at $0.25 each', amount: 10, type: 'instant' },
  { name: 'Standard Pack', price: 10, description: '50 tokens at $0.20 each', amount: 50, type: 'instant' },
  { name: 'Unlimited Pack', price: 20, description: 'Unlimited tokens per month', type: 'subscription' },
]

const BuyPage = () => {
  const { setVisible } = useWalletModal()
  const { connected } = useWallet()
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Launch checkout modal
  const openCheckout = (pack: PackType) => {
    setSelectedPack(pack)
    setCheckoutOpen(true)
  }

  // Handles crypto payment: stub
  const handleCryptoPayment = (pack: PackType) => {
    if (!connected) {
      setVisible(true)
      return
    }
    console.log('Proceed payment for', pack)
    setCheckoutOpen(false)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Options</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKS.map((pack) =>
          pack.type === 'instant' ? (
            <InstantPackCard key={pack.name} pack={pack as any} onCryptoClick={() => openCheckout(pack)} />
          ) : (
            <SubscriptionPackCard key={pack.name} pack={pack} onCryptoClick={() => openCheckout(pack)} />
          )
        )}
      </div>
      
      <PaymentModal/>
    </div>
  )
}

export default BuyPage
