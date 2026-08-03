import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UbitsIcon } from "@/icons/UbitsIcon";
import type { AIButtonProps } from "./aiInteractionTypes";

export function AIButton({
  label,
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  helperText,
  onClick,
  type = "button",
  className,
}: AIButtonProps) {
  // Mapping AI variants to base Button variants
  const variantMap: Record<string, "default" | "secondary" | "ghost" | "outline"> = {
    primary: "default",
    secondary: "outline",
    subtle: "ghost",
    outline: "outline",
  };

  // Mapping AI sizes to base Button sizes
  const sizeMap: Record<string, "default" | "sm" | "lg"> = {
    xs: "sm",
    sm: "sm",
    md: "default",
    lg: "lg",
  };

  const isPrimary = variant === "primary";
  const isOutline = variant === "secondary" || variant === "outline";

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <Button
        type={type}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || loading}
        onClick={onClick}
        aria-busy={loading}
        className={cn(
          "relative overflow-hidden transition-all duration-300 font-bold rounded-full",
          isPrimary && !disabled && "bg-ai-gradient text-primary-foreground border-transparent shadow-ai-premium hover:opacity-90 active:scale-95",
          isOutline && !disabled && "border-ai-gradient hover:opacity-80 active:scale-95",
          size === "xs" && "h-7 px-3 text-[10px] gap-1",
          size === "sm" && "h-8 px-4 text-xs gap-1.5",
          size === "md" && "h-10 px-6 text-sm gap-2",
          size === "lg" && "h-12 px-8 text-base gap-2.5"
        )}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{label || children || "Generando..."}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {leftIcon && (
              <UbitsIcon 
                name={leftIcon} 
                size={size === "xs" ? "xs" : "sm"} 
                tone={isPrimary ? "inverse" : "default"}
                className={cn(!isPrimary && "text-ai-gradient")} 
              />
            )}
            {!leftIcon && (
              <UbitsIcon 
                name="sparkles" 
                size={size === "xs" ? "xs" : "sm"} 
                tone={isPrimary ? "inverse" : "default"}
                className={cn(!isPrimary && "text-ai-gradient")} 
              />
            )}
            <span className={cn(isPrimary && "text-primary-foreground")}>{label || children}</span>
            {rightIcon && (
              <UbitsIcon 
                name={rightIcon} 
                size={size === "xs" ? "xs" : "sm"} 
                tone={isPrimary ? "inverse" : "default"}
                className={cn(!isPrimary && "text-ai-gradient")} 
              />
            )}
          </div>
        )}
      </Button>
      {helperText && (
        <p className="px-1 text-[11px] text-muted-foreground opacity-80 italic">
          {helperText}
        </p>
      )}
    </div>
  );
}
