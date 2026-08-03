import * as React from "react"
import { cn } from "@/lib/utils"

interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, children, sidebar, header, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-screen w-full overflow-hidden bg-app font-body", className)}
        {...props}
      >
        {/* Sidebar Navigation Slot */}
        {sidebar}

        {/* Main Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header Slot */}
          {header}
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
AppShell.displayName = "AppShell"

export { AppShell }
