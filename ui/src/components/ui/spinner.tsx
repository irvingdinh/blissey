import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", className)}
      size={sizeMap[size]}
      data-testid="spinner"
    />
  );
}
