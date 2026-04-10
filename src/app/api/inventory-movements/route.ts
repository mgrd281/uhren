import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, type, quantity, note } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "Fehlende Pflichtfelder" }, { status: 400 });
    }

    const movement = await prisma.inventoryMovement.create({
      data: {
        productId,
        type,
        quantity: parseInt(quantity),
        note: note || null,
      },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
