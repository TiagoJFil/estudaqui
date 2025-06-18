import { PackInfo, COLLECTIONS } from "../backend/data/data-interfaces";
import { db } from "../backend/data/firebase";
import { getSimpleCryptoPaymentIDMemo } from "../utils";


export async function createMBWayReq(
    phone: number,
    userEmail: string,
    packID: string,
    price: number
): Promise<{ paymentUrl: string, orderId: string }> {

    const paymentID = await getSimpleCryptoPaymentIDMemo(userEmail, packID)
    
    const response = await fetch(
    `https://api.prod.easypay.pt/2.0/single`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        AccountId: 'YOUR_API_KEY_HERE',
        ApiKey: 'YOUR_API_KEY_HERE'
      },
        body: JSON.stringify({
        currency: 'EUR',
        customer: {
          name: userEmail,
          email: userEmail,
          phone: phone,
          phone_indicative: '+351'
        },
        key: paymentID,
        value: price,
        type: 'sale',
        method: 'mbw',
        capture: {
          descriptive: 'Payment for Studaki Pack',
          transaction_key: paymentID
        }
      })
    });

    if (!response.ok) {
        throw new Error('Failed to create MBWay request');
    }

    const data = await response.json();
    console.log("MBWay response:", data);
    return data;
}