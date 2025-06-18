import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { getSimpleCryptoPaymentIDMemo, getUserIdentifierServerside, NEXT_PUBLIC_USDC_MINT } from '@/lib/utils'
import { packService, PackService, UserService } from '@/lib/backend/data/data-service'
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Configuration via environment variables
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT!
const RECEIVER = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER!)
const connection = new Connection(RPC_ENDPOINT)

export async function POST(request: NextRequest) {
  try {
    const user = await getUserIdentifierServerside()
    const { signature, packID, orderID } = await request.json()
    if (
      typeof signature !== 'string' ||
      typeof packID !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if(orderID && typeof orderID !== 'string') {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }
    // Fetch parsed transaction
    const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed' })
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction not found or failed' }, { status: 404 })
    }

    const packInfo = await packService.getPackInfoById(packID)
    if (!packInfo) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 })
    }
    
    const paymentID = await getSimpleCryptoPaymentIDMemo(user, packID)
    let orderIDMemo = paymentID
    if (orderID) {
      orderIDMemo += `;${orderID}`
    }
    // Verify USDC transfer to receiver

    const receiverTokenAccount = await getAssociatedTokenAddress(
              new PublicKey(NEXT_PUBLIC_USDC_MINT),
              RECEIVER,
              false,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
    

    const found = tx.transaction.message.instructions.some((ix: any) => {
      return (
        ix.program === 'spl-token' &&
        ix.parsed?.type === 'transfer' &&
        ix.parsed.info.destination === receiverTokenAccount.toBase58() &&
        BigInt(ix.parsed.info.amount) === BigInt(Math.round(packInfo.priceUSD * 1_000_000)) 
      ) 
    })
    const memo = tx.transaction.message.instructions.find((ix: any) => {
      return (
        ix.program === 'spl-memo' &&
        ix.parsed === orderIDMemo
      )
    })

    if (!found || !memo) {
      return NextResponse.json({ error: 'Valid USDC transfer not detected' }, { status: 400 })
    }

    await UserService.registerPayment({
      userID: user,
      packID,
      method: 'solana',
      timestamp: new Date(),
      transactionId: signature,
    })

    await UserService.addCredits(user, packInfo.credits)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
