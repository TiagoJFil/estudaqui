import React from 'react'
import { Card } from '@/components/ui/card'
import { PackType } from '@/lib/interfaces'

interface InstantPackCardProps {
  pack: PackType 
  onBuyClick: () => void
  disabled?: boolean
}

const InstantPackCard: React.FC<InstantPackCardProps> = ({ pack, onBuyClick, disabled = false }) => {
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
            {disabled ? 'Loading...' : 'Buy Now'}
          </button>
          
        
     </Card>
  )
}

export default InstantPackCard
