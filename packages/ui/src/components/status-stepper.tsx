import { cn } from "../lib/cn";

export interface StatusStep {
  label: string;
  done: boolean;
  active: boolean;
}

/**
 * The one status-stepper pattern reused identically across the customer order-tracking
 * screen, merchant order queue, and delivery app (Wireframes §3 layout principle) —
 * defined once here rather than reimplemented per app.
 */
export function StatusStepper({ steps, className }: { steps: StatusStep[]; className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                step.done && "border-primary bg-primary text-primary-foreground",
                step.active && !step.done && "border-primary text-primary",
                !step.done && !step.active && "border-muted-foreground/30 text-muted-foreground/50",
              )}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-[11px] font-medium",
                step.active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mx-1 h-0.5 flex-1 rounded", step.done ? "bg-primary" : "bg-muted-foreground/20")} />
          )}
        </div>
      ))}
    </div>
  );
}
