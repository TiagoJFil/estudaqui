
import { Wallet, Smartphone, CreditCard } from "lucide-react";
import { PackType } from "./frontend/types";

export const paymentMethods = [
  { id: "crypto", label: "Pay with Crypto Wallet", icon: Wallet },
  { id: "mbway", label: "MB Way", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  /*{ id: "mastercard", label: "Mastercard", icon: CreditCard }*/
]
// Define available packs
export const PACKS: PackType[] = [
  { id: "basic_pack" , name: 'Basic Pack', priceUSD: 2.50, description: '10 tokens at $0.25 each', credits: 10, extraCredits:0, active: true, stripeID: "pack_basic" },
  { id: "standard_pack", name: 'Standard Pack', priceUSD: 10, description: '50 tokens at $0.20 each', credits: 50, extraCredits:0, active: true, stripeID: "pack_standard" },
  { id: "premium_pack", name: 'Premium Pack', priceUSD: 18, description: '120 tokens at $0.18 each', credits: 100, extraCredits:10, active: true, stripeID: "pack_premium" },
 // { name: 'Unlimited Pack', price: 20, description: 'Unlimited tokens per month', type: 'subscription' },
]