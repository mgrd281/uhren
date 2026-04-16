import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.accessRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json();
    if (!id || !["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.accessRequest.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      const req = await prisma.accessRequest.findUnique({ where: { id } });
      if (!req) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Update existing owner to the new user
      await prisma.authorizedUser.upsert({
        where: { id: "owner" },
        update: {
          googleUid: req.googleUid,
          email: req.email,
          name: req.name,
          image: req.image,
        },
        create: {
          id: "owner",
          googleUid: req.googleUid,
          email: req.email,
          name: req.name,
          image: req.image,
        },
      });

      await prisma.accessRequest.update({
        where: { id },
        data: { status: "approved" },
      });

      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      await prisma.accessRequest.update({
        where: { id },
        data: { status: "rejected" },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[access-requests] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
