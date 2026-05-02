import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email || !email.includes("@")) {
    return NextResponse.json({ status: "unknown" });
  }

  try {
    const record = await prisma.accessRequest.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { status: true },
    });
    return NextResponse.json({ status: record?.status ?? "unknown" });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
