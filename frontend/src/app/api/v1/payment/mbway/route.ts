import { createMBWayReq } from "@/lib/payments/pack-service";
import { getUserIdentifierServerside } from "@/lib/utils";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
){
    const user = await getUserIdentifierServerside()
    const body = await request.json();
    const { phone, packID, price } = body;
    if (!phone || !packID || !price) {
        return new Response(JSON.stringify({ error: "Invalid request. Provide phone, packID, and price." }), { status: 400 });
    }

    const req = await createMBWayReq(
        phone,
        user,
        packID,
        price
    )

    return new Response(JSON.stringify(req), { status: 200, headers: { "Content-Type": "application/json" } });

    
}