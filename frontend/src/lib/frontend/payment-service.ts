import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createTransferInstruction } from "@solana/spl-token"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { NEXT_PUBLIC_USDC_MINT, getSimpleCryptoPaymentIDMemo } from "../utils"
import { API } from "./api-service"


export async function handleQRPayment(
    packID: string,
    userID: string,
    packPrice: number,
    orderID: string,
    TIMEOUT: number,
    setError: (error: Error) => void,
    onSuccess: () => void
){
    const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com")
    const receiverPublicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER || "")
    const usdcMint = new PublicKey(NEXT_PUBLIC_USDC_MINT)
    const amountUSD = packPrice
    const amountInLowestAmt = Math.round(amountUSD * 1_000_000)
      const paymentID = await getSimpleCryptoPaymentIDMemo(userID, packID)
    
    // Start polling for payment
    const startTime = Date.now()
    const POLL_INTERVAL = 5000 
    console.log(TIMEOUT, "TIMEOUT")
    console.log(startTime, "startTime")
    const pollForPayment = async () => {
      try {
        // Check if timeout exceeded
        console.log("Polling for payment... with ID:", orderID + " and payment ID:", paymentID)
      console.log("Current time:", Date.now(), "Start time:", startTime, "Timeout:", TIMEOUT)
        if (Date.now() - startTime > (TIMEOUT * 1000)) {
          console.log("Payment timeout exceeded")
          
        }

        // Get recent transactions for the receiver
        const receiverTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          receiverPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        // Get recent signatures for the receiver's token account
        const signatures = await connection.getSignaturesForAddress(
          receiverTokenAccount,
          { limit: 5 },
          'confirmed'
        )
        console.log("Recent signatures:", signatures)
        // Check each recent transaction
        for (const signatureInfo of signatures) {
          if (signatureInfo.err) continue // Skip failed transactions
          
          try {
            const tx = await connection.getParsedTransaction(
              signatureInfo.signature, 
              { commitment: 'confirmed' }
            )
            
            if (!tx) continue

            // Check for USDC transfer with correct amount
            const hasCorrectTransfer = tx.transaction.message.instructions.some((ix: any) => {
              return (
                ix.program === 'spl-token' &&
                ix.parsed?.type === 'transfer' &&
                ix.parsed.info.destination === receiverTokenAccount.toBase58() &&
                BigInt(ix.parsed.info.amount) === BigInt(amountInLowestAmt)
              )
            })

            const qrMemo = paymentID + ";" + orderID
            const hasCorrectMemo = tx.transaction.message.instructions.some((ix: any) => {
              return (
                ix.program === 'spl-memo' &&
                ix.parsed === qrMemo
              )
            })
           // console.log("Transaction memo:", tx.transaction.message.instructions)
           // console.log("Has correct transfer:", hasCorrectTransfer)
            console.log("Has correct memo:", hasCorrectMemo)

            // If both conditions are met, payment found
            if (hasCorrectTransfer && hasCorrectMemo) {
              try {
                const result = await API.completePackCryptoPurchase(
                  signatureInfo.signature, 
                  packID,
                  orderID
                )
                
                if (result.success) {
                  onSuccess()
                  return
                } else {
                  setError(new Error("Payment verification failed"))
                  return
                }
              } catch (verificationError) {
                console.error("Payment verification error:", verificationError)
                setError(new Error("Payment verification failed"))
                return
              }
            }
          } catch (txError) {
            console.error("Error processing transaction:", txError)
            // Continue checking other transactions
          }
        }
        
      } catch (error) {
        console.error("Polling error:", error)
        setError(error instanceof Error ? error : new Error(String(error)))
      }
    }
console.log("pooling here")
    // Start polling after a short delay
    return setInterval(pollForPayment, POLL_INTERVAL)
}

export async function handleCryptoPayment(
    userEmail: string,
    packID: string,
    price: number,
    userPublicKey: PublicKey,
    sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>,
    onError: (error: Error) => void,
    onSuccess: () => void,
){
    try {
        const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com")
        const receiverPublicKey = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_RECEIVER || "")
        const usdcMint = new PublicKey(NEXT_PUBLIC_USDC_MINT)
        
        const paymentID = await getSimpleCryptoPaymentIDMemo(userEmail, packID)
        
        const amountUSD = price
        const amountInLowestAmt = Math.round(amountUSD * 1_000_000)

        const senderTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          userPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        const receiverTokenAccount = await getAssociatedTokenAddress(
          usdcMint,
          receiverPublicKey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )

        const transferInstruction = createTransferInstruction(
          senderTokenAccount,
          receiverTokenAccount,
          userPublicKey,
          amountInLowestAmt,
          [],
          TOKEN_PROGRAM_ID
        )

        const transaction = new Transaction()
        transaction.addMemo(paymentID) 
        transaction.add(transferInstruction)

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = userPublicKey
        let signature;
        try{
          signature = await sendTransaction(
            transaction, 
            connection
          )
          console.log("Transaction sent:", signature)
        } catch (error) {
            onError(Error("Transaction failed to send"))
          return
        }
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed')
        

        if (confirmation.value.err) {
          throw new Error("Transaction failed")
        }       
        const result = await API.completePackCryptoPurchase(signature, packID)
        if (result.success) {
          onSuccess()
        } else {
            onError(Error("Payment verification failed"))
        }

      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)))
      }
}