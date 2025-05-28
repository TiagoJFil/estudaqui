"use client"

import React, { useState } from 'react'
import Slider from '@/components/ui/slider'
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
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey as SolanaPublicKey } from '@solana/web3.js'
import { encodeURL, createTransfer } from '@solana/pay'
import Big from 'big.js'
import bs58 from 'bs58'
import { useSession } from 'next-auth/react'
import { CreditCard, Smartphone } from 'lucide-react'
import { hashTextSHA256, NEXT_PUBLIC_USDC_MINT } from '@/lib/utils'

const MIN_TOKENS = 10
const MAX_TOKENS = 100
const START_PRICE = 0.25
const END_PRICE = 0.2


const BuyPage = () => {
  const { setVisible } = useWalletModal()
  const { connected, publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { data: session } = useSession()
  const [tokens, setTokens] = useState<number>(MIN_TOKENS)

  // Handles crypto payment: if not connected, opens wallet modal; if connected, proceeds with payment
  const handleCryptoPayment = async (packType: string, customAmount?: number) => {
    if (!connected || !publicKey) {
      setVisible(true)
      return
    }
    const receiver = process.env.NEXT_PUBLIC_SOLANA_RECEIVER!
    const amountUSD = packType === 'custom' ? customAmount! * pricePerToken : packType === 'starter' ? 9.99 : 19.99
    const usdcMintPubKey = new SolanaPublicKey(NEXT_PUBLIC_USDC_MINT)
    const recipientPubKey = new SolanaPublicKey(receiver)
    const userMail = session?.user?.email!
    const userIDHash = hashTextSHA256(userMail)
    const memoText = `payer=${publicKey.toBase58()};user=${userIDHash};pack=${packType}`

    // Build Solana Pay URL and send transfer via wallet adapter
    const url = encodeURL({
      recipient: recipientPubKey,
      amount: new Big(amountUSD),
      splToken: usdcMintPubKey,
      reference: publicKey,
      label: 'Estudaqui',
      message: `Purchase ${packType}`,
      memo: memoText,
    })

    try {
      // Perform Solana Pay transfer: returns signature buffer
      const { signature: sigBuffer } = await createTransfer(
        connection,
        url,
        sendTransaction
      )
      // Convert to base58 string and confirm
      const signature = bs58.encode(sigBuffer)
      await connection.confirmTransaction(signature, 'confirmed')
      console.log('Crypto payment successful', signature)
      // record on your backend
      await fetch('/api/v1/payment/solana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: publicKey.toString(), signature, amountUSD }),
      })
    } catch (error) {
      console.error('Solana Pay failed', error)
      alert('Crypto payment failed')
    }
  }

  const pricePerToken =
    START_PRICE +
    ((END_PRICE - START_PRICE) * (tokens - MIN_TOKENS)) / (MAX_TOKENS - MIN_TOKENS)
  const totalPrice = tokens * pricePerToken

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Purchase Options</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Pack */}
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Starter Pack</h2>
          <p className="text-4xl font-bold mb-4">$9.99</p>
          <p className="mb-6 text-gray-600">Great for beginners</p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Buy Now
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Payment Method</DialogTitle>
              </DialogHeader>
              <DialogDescription>Select how you'd like to pay for the Starter Pack.</DialogDescription>
              <div className="mt-4 flex flex-col gap-3">
                {/* Close dialog then open wallet modal */}
                <DialogClose asChild>
                  <button onClick={() => handleCryptoPayment('starter')} className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                    <Smartphone className="w-5 h-5" />
                    Pay with Crypto Wallet
                  </button>
                </DialogClose>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <Smartphone className="w-5 h-5" />
                  MB Way
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Visa
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Mastercard
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Multibanco
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

        {/* Premium Pack */}
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Premium Pack</h2>
          <p className="text-4xl font-bold mb-4">$19.99</p>
          <p className="mb-6 text-gray-600">Best value for regular users</p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Buy Now
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Payment Method</DialogTitle>
              </DialogHeader>
              <DialogDescription>Select how you'd like to pay for the Premium Pack.</DialogDescription>
              <div className="mt-4 flex flex-col gap-3">
                <DialogClose asChild>
                  <button onClick={() => handleCryptoPayment('premium')} className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                    <Smartphone className="w-5 h-5" />
                    Pay with Crypto Wallet
                  </button>
                </DialogClose>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <Smartphone className="w-5 h-5" />
                  MB Way
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Visa
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Mastercard
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Multibanco
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

        {/* Custom Pack */}
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Custom Pack</h2>
          <div className="w-full mb-4">
            <Slider
              min={MIN_TOKENS}
              max={MAX_TOKENS}
              value={[tokens]}
              onValueChange={(vals) => setTokens(vals[0])}
            />
          </div>
          <p className="mb-2">
            Tokens: <span className="font-medium">{tokens}</span>
          </p>
          <p className="mb-2">
            Price per token: <span className="font-medium">{formatCurrency(pricePerToken)}</span>
          </p>
          <p className="text-2xl font-bold mb-6">{formatCurrency(totalPrice)}</p>
          <Dialog>
            <DialogTrigger asChild>
              <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Buy {tokens} tokens
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Payment Method</DialogTitle>
              </DialogHeader>
              <DialogDescription>Select how you'd like to pay for {tokens} tokens.</DialogDescription>
              <div className="mt-4 flex flex-col gap-3">
                <DialogClose asChild>
                  <button onClick={() => handleCryptoPayment('custom', tokens)} className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                    <Smartphone className="w-5 h-5" />
                    Pay with Crypto Wallet
                  </button>
                </DialogClose>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <Smartphone className="w-5 h-5" />
                  MB Way
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Visa
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Mastercard
                </button>
                <button className="flex items-center gap-2 bg-gray-100 p-3 rounded hover:bg-gray-200">
                  <CreditCard className="w-5 h-5" />
                  Multibanco
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
      </div>
    </div>
  )
}

export default BuyPage
