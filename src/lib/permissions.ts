import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UserRole = "owner" | "manager" | "editor" | "viewer";

export async function getUserRole(): Promise<UserRole> {
  try {
    const session = await auth();
    if (!session?.user?.email) return "viewer";

    const owner = await prisma.authorizedUser.findUnique({ where: { id: "owner" } });
    if (owner?.email === session.user.email) return "owner";

    const req = await prisma.accessRequest.findFirst({
      where: { email: session.user.email, status: "approved" },
    });
    return (req?.role as UserRole) || "viewer";
  } catch {
    return "viewer";
  }
}

export function canEdit(role: UserRole): boolean {
  return role === "owner" || role === "manager" || role === "editor";
}

export function canDelete(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "owner";
}
