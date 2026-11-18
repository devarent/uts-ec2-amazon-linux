import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-sky-200 bg-sky-50 text-sky-900 [&>svg]:text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-950 [&>svg]:text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-900 [&>svg]:text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm leading-6 opacity-90", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
