import React from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PackType } from '@/lib/frontend/types'

interface InstantPackCardProps {
  pack: PackType 
  onBuyClick: () => void
  disabled?: boolean
  isLoading?: boolean
  hasSession?: boolean
}

const InstantPackCard: React.FC<InstantPackCardProps> = ({ 
  pack, 
  onBuyClick, 
  disabled = false, 
  isLoading = false, 
  hasSession = false 
}) => {
  const getButtonText = () => {
    if (disabled) return 'Sign In'
    return 'Buy Now'
  }

  if (isLoading) {
    return (
      <Card className="p-6 flex flex-col items-center">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-4 w-40 mb-6" />
        <Skeleton className="h-10 w-20 mt-auto" />
      </Card>
    )
  }
  return (
    <Card className="p-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4">{pack.name}</h2>
      <p className="text-4xl font-bold mb-4">{pack.priceUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
      <p className="mb-6 text-gray-600">{pack.description}</p>          <button
            onClick={onBuyClick}
            disabled={disabled}
           className={`mt-auto px-4 py-2 rounded transition-colors ${
             disabled 
               ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
               : 'bg-purple-600 text-white hover:bg-purple-700'
           }`}>
            {getButtonText()}
          </button>
          
        
     </Card>
  )
}

export default InstantPackCard
