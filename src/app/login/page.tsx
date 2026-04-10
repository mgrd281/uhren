"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";
import { Watch } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulated — in production, connect to NextAuth or your auth provider
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 lg:ps-0">
      <Card className="mx-auto w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <Watch size={28} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900">
            دار الساعات الفاخرة
          </h1>
          <p className="mt-1 text-[13px] text-zinc-400">
            سجّل دخولك للمتابعة
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="admin@luxurywatch.ae"
            defaultValue="admin@luxurywatch.ae"
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="••••••••"
            defaultValue="password"
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-zinc-300">
          demo mode — أي بيانات تعمل
        </p>
      </Card>
    </div>
  );
}
