import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-[var(--surface-soft)] text-[var(--ink)]",
        lime: "bg-[var(--lime)] text-[#111]",
        muted: "bg-white/10 text-white/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
