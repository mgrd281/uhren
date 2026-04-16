"use client";

import { useSession } from "next-auth/react";

export type UserRole = "owner" | "manager" | "editor" | "viewer";

export function useRole() {
  const { data: session } = useSession();
  const role = ((session as unknown as { role?: string })?.role as UserRole) || "viewer";

  return {
    role,
    isOwner: role === "owner",
    canEdit: role === "owner" || role === "manager" || role === "editor",
    canDelete: role === "owner" || role === "manager",
    canManageUsers: role === "owner",
  };
}
