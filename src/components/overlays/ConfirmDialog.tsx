import * as React from "react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

export interface ConfirmDialogProps {
  /** Controlled open state */
  open?: boolean
  /** Event handler for open state changes */
  onOpenChange?: (open: boolean) => void
  /** The element that triggers the dialog */
  trigger?: React.ReactNode
  /** Main title of the confirmation */
  title: string
  /** Brief description or warning */
  description?: string
  /** Label for the confirmation button */
  confirmLabel?: string
  /** Label for the cancellation button */
  cancelLabel?: string
  /** Visual style variant */
  variant?: "default" | "warning" | "destructive"
  /** Callback when confirmed */
  onConfirm?: () => void
  /** Callback when cancelled */
  onCancel?: () => void
  /** Whether the confirm action is loading */
  loading?: boolean
  /** Whether the dialog is disabled */
  disabled?: boolean
  /** Custom classes for the dialog content */
  className?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  className,
}: ConfirmDialogProps) {
  // Map variant to button variant
  const actionVariant = variant === "destructive" ? "destructive" : "default"
  
  // For now, warning and default use the same button variant but could be extended
  
  /**
   * PATRÓN UBITS: Cierre manual tras éxito
   * 
   * Debido al uso de e.preventDefault() en la acción de confirmación para soportar
   * procesos asíncronos (loading), el diálogo NO se cerrará automáticamente si el
   * componente se usa de forma controlada.
   * 
   * El consumidor debe establecer open={false} una vez que la operación
   * asíncrona haya finalizado exitosamente.
   */
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className={className} aria-describedby={undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(
            variant === "destructive" && "text-destructive"
          )}>
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            disabled={loading || disabled}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={(e) => {
              if (onConfirm) {
                e.preventDefault()
                onConfirm()
              }
            }}
            disabled={loading || disabled}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
