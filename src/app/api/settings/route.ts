import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    let settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: "default" },
      });
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({
      id: "default",
      storeName: "Luxusuhren Verwaltung",
      locale: "ar",
      currencyCode: "AED",
      rtlEnabled: true,
    });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const parsed = settingsSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const settings = await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json(settings);
}
