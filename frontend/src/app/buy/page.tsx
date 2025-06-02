"use client"

import React, { useState } from 'react'
import Slider from '@/components/ui/slider'
import { Card } from '@/components/ui/card'

const MIN_TOKENS = 10
const MAX_TOKENS = 200
const START_PRICE = 0.2
const END_PRICE = 0.16

const BuyPage = () => {
  const [tokens, setTokens] = useState<number>(MIN_TOKENS)

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
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Buy Now
          </button>
        </Card>

        {/* Premium Pack */}
        <Card className="p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Premium Pack</h2>
          <p className="text-4xl font-bold mb-4">$19.99</p>
          <p className="mb-6 text-gray-600">Best value for regular users</p>
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Buy Now
          </button>
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
          <button className="mt-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Buy {tokens} tokens
          </button>
        </Card>
      </div>
    </div>
  )
}

export default BuyPage
