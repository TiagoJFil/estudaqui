
import { Wallet, Smartphone, CreditCard } from "lucide-react";
import { PackType } from "./frontend/types";
import { disconnect } from "process";

export const paymentMethods = [
  { id: "crypto", label: "Pay with Crypto Wallet", icon: Wallet, discount : 0.10 }, // 10% discount for crypto payments
  { id: "mbway", label: "MB Way", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  /*{ id: "mastercard", label: "Mastercard", icon: CreditCard }*/
]