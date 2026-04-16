import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const owner = await prisma.authorizedUser.findUnique({ where: { id: "owner" } });
    if (owner?.email === session.user.email) {
      return NextResponse.json({ role: "owner", permissions: { all: true } });
    }

    const req = await prisma.accessRequest.findFirst({
      where: { email: session.user.email, status: "approved" },
    });

    if (!req) {
      return NextResponse.json({ role: null }, { status: 403 });
    }

    const role = req.role || "viewer";

    const permissions = {
      viewDashboard: true,
      viewProducts: true,
      viewSales: true,
      viewReports: true,
      addProducts: role === "editor" || role === "manager",
      editProducts: role === "editor" || role === "manager",
      deleteProducts: role === "manager",
      addSales: role === "editor" || role === "manager",
      editSales: role === "manager",
      editSettings: false,
      manageUsers: false,
    };

    return NextResponse.json({ role, permissions });
  } catch {
    return NextResponse.json({ role: "viewer", permissions: {} });
  }
}
