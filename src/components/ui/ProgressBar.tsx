import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  indicatorClassName,
  showValue = false,
  size = "md",
  animate = true,
  label
}: ProgressBarProps) {
  const percentage = max === 100 ? value : (value / max) * 100;
  
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  };
  
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <p className="text-muted-foreground">{label}</p>}
          {showValue && (
            <p className="text-muted-foreground font-medium">{value}/{max}</p>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          sizeClasses[size]
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 bg-primary transition-all",
            animate ? "" : "transition-none",
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - Math.min(percentage, 100)}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
