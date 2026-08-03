import * as React from "react"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

/**
 * UbitsToaster
 * 
 * Wrapper for Sonner notifications following UBITS B2B standards.
 * Positioned by default at bottom-right for non-invasive feedback.
 * Detects the system theme (light/dark) from documentElement classes.
 */
export function UbitsToaster() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    // Initial check
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")

    // Observer to react to manual theme changes in SidebarRail
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const isDarkNow = document.documentElement.classList.contains("dark")
          setTheme(isDarkNow ? "dark" : "light")
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster 
      theme={theme}
      position="bottom-right"
      closeButton
      richColors={false} // Keeping it sober as per UBITS rules
      expand={false}
    />
  )
}
