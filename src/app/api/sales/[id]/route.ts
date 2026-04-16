import { NextRequest, NextResponse } from "next/server";
import { deleteSale } from "@/lib/services";
import { getUserRole, canDelete } from "@/lib/permissions";

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
