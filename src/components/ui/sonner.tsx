import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

type ToasterTheme = "light" | "dark" | "system"

const Toaster = ({ theme = "system", ...props }: ToasterProps & { theme?: ToasterTheme }) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-status-positive" />
        ),
        info: (
          <InfoIcon className="size-4 text-status-info" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-status-warning" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-status-negative" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-status-positive/20",
          error: "group-[.toaster]:border-status-negative/20",
          warning: "group-[.toaster]:border-status-warning/20",
          info: "group-[.toaster]:border-status-info/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
