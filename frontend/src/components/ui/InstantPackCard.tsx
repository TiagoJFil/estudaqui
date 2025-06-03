import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { useWallet } from '@solana/wallet-adapter-react'
import { Smartphone, CreditCard } from 'lucide-react'
import { PackType } from '@/app/buy/page'

interface InstantPackCardProps {
  pack: PackType & { amount: number }
  onCryptoClick: () => void
}

const InstantPackCard: React.FC<InstantPackCardProps> = ({ pack, onCryptoClick }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const { connected, publicKey, connect, disconnect } = useWallet()
  return (
    <Card className="p-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4">{pack.name}</h2>
      <p className="text-4xl font-bold mb-4">{pack.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
      <p className="mb-6 text-gray-600">{pack.description}</p>
      <Dialog>
        <DialogTrigger asChild>
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Buy Now
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pack.name} Checkout</DialogTitle>
            <DialogDescription>Choose payment method for {pack.name}.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex h-64">
            {/* Left panel: method list */}
            <ul className="w-1/3 border-r divide-y divide-gray-200">
              <li
                className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedMethod === 'crypto' ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedMethod('crypto')}
                onMouseEnter={() => setSelectedMethod('crypto')}
              >
                <Smartphone className="inline-block w-5 h-5 mr-2" /> Pay with Crypto Wallet
              </li>
              <li
                className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedMethod === 'mbway' ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedMethod('mbway')}
                onMouseEnter={() => setSelectedMethod('mbway')}
              >
                <Smartphone className="inline-block w-5 h-5 mr-2" /> MB Way
              </li>
              <li
                className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedMethod === 'visa' ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedMethod('visa')}
                onMouseEnter={() => setSelectedMethod('visa')}
              >
                <CreditCard className="inline-block w-5 h-5 mr-2" /> Visa
              </li>
              <li
                className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedMethod === 'mastercard' ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedMethod('mastercard')}
                onMouseEnter={() => setSelectedMethod('mastercard')}
              >
                <CreditCard className="inline-block w-5 h-5 mr-2" /> Mastercard
              </li>
              <li
                className={`p-3 hover:bg-gray-100 cursor-pointer ${selectedMethod === 'multibanco' ? 'bg-gray-200' : ''}`}
                onClick={() => setSelectedMethod('multibanco')}
                onMouseEnter={() => setSelectedMethod('multibanco')}
              >
                <CreditCard className="inline-block w-5 h-5 mr-2" /> Multibanco
              </li>
            </ul>
            {/* Right panel: dynamic content */}
            <div className="w-2/3 p-4 relative">
              {!selectedMethod && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-400 animate-pulse">← Select a method</span>
                </div>
              )}
              {selectedMethod === 'crypto' && (
                <div>
                  <p className="font-medium">Wallet Status:</p>
                  <p>{connected && publicKey ? publicKey.toBase58() : 'Not connected'}</p>
                  <button
                    onClick={() => (connected ? disconnect() : connect())}
                    className="mt-2 bg-gray-100 p-2 rounded hover:bg-gray-200"
                  >
                    {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
                  </button>
                  {connected && (
                    <button
                      onClick={onCryptoClick}
                      className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    >
                      Confirm Crypto Payment
                    </button>
                  )}
                </div>
              )}
              {selectedMethod === 'mbway' && <p>MB Way checkout coming soon.</p>}
              {selectedMethod === 'visa' && <p>Visa checkout coming soon.</p>}
              {selectedMethod === 'mastercard' && <p>Mastercard checkout coming soon.</p>}
              {selectedMethod === 'multibanco' && <p>Multibanco checkout coming soon.</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Close</button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default InstantPackCard
