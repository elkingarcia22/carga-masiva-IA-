import * as React from "react"
import { 
  Moon,
  Sun,
  User,
  Key,
  LogOut,
  Laptop,
  Bolt,
  BookOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { navigationConfig } from "@/config/navigation"

interface SidebarRailProps extends React.HTMLAttributes<HTMLDivElement> {
  activeId?: string
  onItemSelect?: (id: string) => void
}

const SidebarRail = React.forwardRef<HTMLDivElement, SidebarRailProps>(
  ({ className, activeId, onItemSelect, ...props }, ref) => {
    const [isDark, setIsDark] = React.useState(false)

    // Dark Mode Toggle Logic
    const toggleTheme = () => {
      const newTheme = !isDark
      setIsDark(newTheme)
      if (newTheme) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-screen w-20 flex-col items-center border-r border-border bg-surface-nav py-6 text-white shrink-0 transition-all z-40",
          className
        )}
        {...props}
      >
        {/* Official UBITS Logo */}
        <div className="mb-8 flex items-center justify-center">
          <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M12.0042 7.67725V17.5612C12.0042 20.2653 13.3633 21.8609 16.1197 21.8609C18.8284 21.8609 20.1821 20.2653 20.1821 17.9489V8.08158H23.9999V18.0484C23.9999 22.1849 21.4774 24.9999 16.1169 24.9999C10.7008 24.9999 8.17822 22.1594 8.17822 18.0727V11.2653C8.17822 10.3137 8.58103 9.40103 9.29803 8.72815C10.015 8.05527 10.9875 7.67725 12.0015 7.67725" fill="currentColor"/>
            <path d="M12.0051 4.05078C9.96636 4.05078 8.01107 4.81086 6.56942 6.1638C5.12778 7.51674 4.31787 9.35172 4.31787 11.2651H6.52647C6.52647 9.90132 7.10364 8.5934 8.13105 7.62897C9.15847 6.66453 10.552 6.12255 12.0051 6.12221V4.05078Z" fill="currentColor"/>
            <path d="M12.0044 2.42347V0C8.82076 0 5.76752 1.18688 3.51635 3.29953C1.26518 5.41218 0.000488281 8.27756 0.000488281 11.2653H2.58285C2.58285 8.9203 3.57547 6.67135 5.34235 5.01318C7.10923 3.35501 9.50564 2.42347 12.0044 2.42347" fill="currentColor"/>
          </svg>
        </div>

        {/* Navigation Icons Area */}
        <nav className="flex flex-1 flex-col items-center space-y-4">
          {navigationConfig.map((item) => (
            <NavItem 
              key={item.id}
              icon={<item.icon size={22} />} 
              active={activeId === item.id}
              label={item.label}
              submenu={item.submenu}
              onClick={() => onItemSelect?.(item.id)}
            />
          ))}
        </nav>

        {/* Bottom Actions Area */}
        <div className="flex flex-col items-center space-y-6 pb-2 w-full">
          <div className="w-12 h-[1px] border-t border-white/20" />
          
          <button 
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="text-white/60 hover:text-white transition-colors relative group"
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-md z-50">
              {isDark ? "Modo claro" : "Modo oscuro"}
            </div>
          </button>

          <NavItem 
            noButton
            icon={
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100" 
                alt="User Avatar"
                className="h-10 w-10 rounded-full border border-white/20 object-cover shadow-sm"
              />
            }
            label="Perfil"
            submenu={[
              { icon: User, text: "Ver mi perfil" },
              { icon: Laptop, text: "Modo Administrador" },
              { icon: Bolt, text: "Modo LMS Creator" },
              { icon: BookOpen, text: "Documentación" },
              { icon: Key, text: "Cambio de contraseña" },
              { icon: LogOut, text: "Cerrar sesión" },
            ]}
          />
        </div>
      </div>
    )
  }
)
SidebarRail.displayName = "SidebarRail"

function NavItem({ 
  icon, 
  active, 
  label,
  submenu,
  noButton,
  onClick,
  className 
}: { 
  icon: React.ReactNode; 
  active?: boolean; 
  label?: string;
  submenu?: { icon: any; text: string }[];
  noButton?: boolean;
  onClick?: () => void;
  className?: string 
}) {
  return (
    <div className="relative group">
      {noButton ? (
        <div className={cn("cursor-pointer", className)}>
          {icon}
        </div>
      ) : (
        <button
          onClick={onClick}
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200",
            active 
              ? "bg-white text-surface-nav shadow-lg" 
              : "text-white/60 hover:bg-white/5 hover:text-white",
            className
          )}
        >
          {icon}
        </button>
      )}

      {/* Hover Submenu (Fidelity 1:1) */}
      <div className="absolute left-16 top-0 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50">
        <div className="bg-surface-nav border border-white/10 rounded-2xl shadow-2xl p-4 w-60 text-white overflow-hidden">
          {label && (
            <h4 className="text-sm font-bold mb-3 px-2 text-white/90">{label}</h4>
          )}
          {submenu && (
            <div className="space-y-1">
              {submenu.map((item, idx) => (
                <button 
                  key={idx}
                  className="flex items-center space-x-3 w-full px-2 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="opacity-70"><item.icon size={16} /></span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          )}
          {!submenu && label && (
             <div className="text-[10px] text-white/40 italic px-2">
               Sección de {label}
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { SidebarRail }
