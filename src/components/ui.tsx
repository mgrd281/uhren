import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/* ─── Card (floating with depth, minimal) ─── */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm shadow-zinc-100/50 transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─── KPI Card ─── */
export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accent ?? "bg-zinc-100 text-zinc-600"
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-zinc-400">{label}</p>
        <p className="mt-1 text-xl font-bold tracking-tight text-zinc-900">
          {value}
        </p>
        {sub && <p className="mt-0.5 text-[11px] text-zinc-400">{sub}</p>}
      </div>
    </Card>
  );
}

/* ─── Badge ─── */
export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─── Button ─── */
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary:
      "bg-zinc-900 text-white shadow-md shadow-zinc-900/20 hover:bg-zinc-800 active:bg-zinc-950",
    secondary:
      "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300",
    ghost: "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[12px]",
    md: "h-10 px-4 text-[13px]",
    lg: "h-12 px-6 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── Input ─── */
export function Input({
  label,
  error,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[12px] font-medium text-zinc-500">{label}</label>
      )}
      <input
        className={cn(
          "h-10 rounded-xl border bg-white px-3 text-[13px] text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-300",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Textarea ─── */
export function Textarea({
  label,
  error,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[12px] font-medium text-zinc-500">{label}</label>
      )}
      <textarea
        className={cn(
          "min-h-[80px] rounded-xl border bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-300",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Select ─── */
export function Select({
  label,
  error,
  className,
  children,
  ...props
}: {
  label?: string;
  error?: string;
  className?: string;
  children: ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[12px] font-medium text-zinc-500">{label}</label>
      )}
      <select
        className={cn(
          "h-10 rounded-xl border bg-white px-3 text-[13px] text-zinc-900 outline-none transition-all duration-200",
          error
            ? "border-red-300 focus:border-red-500"
            : "border-zinc-200 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Empty state ─── */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-zinc-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-[12px] text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ─── Page Header ─── */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[13px] text-zinc-400">{description}</p>
        )}
      </div>
      {actions && <div className="mt-3 flex gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
}

/* ─── Skeleton loader ─── */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-zinc-100", className)}
    />
  );
}
