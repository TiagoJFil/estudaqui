import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { NEXT_PUBLIC_USDC_MINT } from '@/lib/utils'

// Configuration via environment variables
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT!
const RECEIVER = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER!)
const connection = new Connection(RPC_ENDPOINT)

export async function POST(request: NextRequest) {
  try {
    const { publicKey, signature, amountUSD } = await request.json()
    if (
      typeof publicKey !== 'string' ||
      typeof signature !== 'string' ||
      typeof amountUSD !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Fetch parsed transaction
    const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed' })
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 404 })
    }

    // Verify USDC transfer to receiver
    const found = tx.transaction.message.instructions.some((ix: any) => {
      return (
        ix.program === 'spl-token' &&
        ix.parsed?.type === 'transfer' &&
        ix.parsed.info.mint === NEXT_PUBLIC_USDC_MINT &&
        ix.parsed.info.destination === RECEIVER.toBase58() &&
        BigInt(ix.parsed.info.amount) === BigInt(Math.round(amountUSD * 1_000_000))
      )
    })

    if (!found) {
      return NextResponse.json({ error: 'Valid USDC transfer not detected' }, { status: 400 })
    }

    // TODO: record the purchase in your database
    // await yourDatabase.payments.create({ payer: publicKey, signature, amountUSD })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
