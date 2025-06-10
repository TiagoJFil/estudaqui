"use client"

import React, { useState } from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { CreditCard, Smartphone } from 'lucide-react'
// Components
import InstantPackCard from '@/components/instant-pack-card'
import SubscriptionPackCard from '@/components/subscription-pack-card'
import PaymentModal from '@/components/payment-modal'
import { PACKS } from '@/lib/contants'
import { useSession } from 'next-auth/react'
import { PackType } from '@/lib/frontend/types'




const BuyPage = () => {
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { data: session, status } = useSession()


  // Launch checkout modal
  const openCheckout = (pack: PackType) => {
    if (status === 'loading') return // Prevent action when session is loading
    setSelectedPack(pack)
    setCheckoutOpen(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Options</h1>      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKS.map((pack) =>
          pack.subscription == null ? (
            <InstantPackCard 
              key={pack.name} 
              pack={pack as any} 
              onBuyClick={() => openCheckout(pack)}
              disabled={status === 'loading'}
            />
          ) : (
            <SubscriptionPackCard 
              key={pack.name} 
              pack={pack as any}
              disabled={status === 'loading'}
            />
          )
        )}
      </div>
      
      { selectedPack && <PaymentModal
        pack={selectedPack}
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />}
    </div>
  )
}

export default BuyPage
