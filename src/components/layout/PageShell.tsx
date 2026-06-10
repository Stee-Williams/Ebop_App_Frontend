import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-teal-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-50/60 blur-3xl" />
      </div>
      <div className={cn("relative mx-auto max-w-7xl space-y-6 p-6 pb-10 lg:p-8", className)}>
        {children}
      </div>
    </div>
  );
}

type PageHeaderProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  icon,
  title,
  description,
  badge,
  action,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-gradient-to-br from-primary via-[hsl(215,55%,28%)] to-accent p-6 text-white shadow-lg lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          {icon}
        </div>
        <div>
          {badge && (
            <span className="mb-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
              {badge}
            </span>
          )}
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">{title}</h1>
          <p className="mt-1 max-w-xl text-sm text-white/80">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}
