import React from 'react'
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
import { Smartphone, CreditCard } from 'lucide-react'
import { PackType } from '@/app/buy/page'

interface SubscriptionPackCardProps {
  pack: PackType
  onCryptoClick: () => void
}

const SubscriptionPackCard: React.FC<SubscriptionPackCardProps> = ({ pack, onCryptoClick }) => (
  <Card className="p-6 flex flex-col items-center">
    <h2 className="text-xl font-semibold mb-4">{pack.name}</h2>
    <p className="text-4xl font-bold mb-4">{pack.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/mo</p>
    <p className="mb-6 text-gray-600">{pack.description}</p>
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Subscribe
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pack.name} Subscription</DialogTitle>
          <DialogDescription>Choose payment method for {pack.name}.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-3">
          <DialogClose asChild>
            <button onClick={onCryptoClick} className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
              <Smartphone className="w-5 h-5" />
              Pay with Crypto Wallet
            </button>
          </DialogClose>
          <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
            <CreditCard className="w-5 h-5" />
            Card Payment
          </button>
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

export default SubscriptionPackCard
