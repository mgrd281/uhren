import { NextRequest, NextResponse } from "next/server";
import { deleteSale } from "@/lib/services";
import { prisma } from "@/lib/prisma";
import { getUserRole, canDelete, canEdit } from "@/lib/permissions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getUserRole();
  if (!canEdit(role)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const sale = await prisma.sale.update({
      where: { id },
      data: {
        salePrice: body.salePrice !== undefined ? parseFloat(body.salePrice) : undefined,
        quantitySold: body.quantitySold !== undefined ? parseInt(body.quantitySold) : undefined,
        totalAmount: body.salePrice !== undefined && body.quantitySold !== undefined
          ? parseFloat(body.salePrice) * parseInt(body.quantitySold)
            - (body.shippingCost !== undefined ? parseFloat(body.shippingCost) : 0)
            - (body.packagingCost !== undefined ? parseFloat(body.packagingCost) : 0)
          : undefined,
        customerName: body.customerName ?? undefined,
        invoiceNumber: body.invoiceNumber ?? undefined,
        paymentMethod: body.paymentMethod ?? undefined,
        marketplace: body.marketplace ?? undefined,
        notes: body.notes ?? undefined,
        shippingCost: body.shippingCost !== undefined ? parseFloat(body.shippingCost) : undefined,
        shippingCarrier: body.shippingCarrier ?? undefined,
        trackingNumber: body.trackingNumber ?? undefined,
        packagingCost: body.packagingCost !== undefined ? parseFloat(body.packagingCost) : undefined,
        shippingAddress: body.shippingAddress ?? undefined,
        soldAt: body.soldAt ? new Date(body.soldAt.length === 10 ? body.soldAt + "T12:00:00" : body.soldAt) : undefined,
      },
    });
    return NextResponse.json(sale);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = await getUserRole();
  if (!canDelete(role)) return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  try {
    const { id } = await params;
    await deleteSale(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Serverfehler";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
