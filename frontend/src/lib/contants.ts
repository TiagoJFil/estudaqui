
import { Wallet, Smartphone, CreditCard } from "lucide-react";
import { PackType } from "./frontend/types";
import { disconnect } from "process";

export const paymentMethods = [
  { id: "crypto", label: "Pay with Crypto Wallet", icon: Wallet, discount : 0.10 }, // 10% discount for crypto payments
  { id: "mbway", label: "MB Way", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  /*{ id: "mastercard", label: "Mastercard", icon: CreditCard }*/
]

export const MAX_FILE_SIZE_MB = 20;

export const VALID_FILE_TYPES = {
    'application/pdf': ['.pdf']
   // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

export const NEXT_PUBLIC_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";