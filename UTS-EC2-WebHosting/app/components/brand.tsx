import Link from "next/link";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  className,
  compact = false,
}: {
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label="UTS Cloud Computing — AWS EC2 — beranda"
    >
      <span className="relative flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm">
        <Cloud className="size-4.5" strokeWidth={1.8} aria-hidden="true" />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-brand" />
      </span>
      {!compact ? (
        <span className="flex flex-col">
          <span className="text-[13px] font-semibold leading-tight tracking-tight">
            UTS Cloud Computing
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            TIFM · UTS
          </span>
        </span>
      ) : null}
    </Link>
  );
}
