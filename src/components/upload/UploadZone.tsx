import * as React from 'react'
import { UploadCloud, X, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFiles } from './uploadUtils'

export interface UploadZoneProps {
  /** Selected files */
  value?: File[]
  /** Callback when selection changes */
  onChange?: (files: File[]) => void
  /** Accepted file types */
  accept?: string
  /** Whether multiple selection is allowed */
  multiple?: boolean
  /** Maximum number of files */
  maxFiles?: number
  /** Maximum file size in MB */
  maxSizeMB?: number
  /** Whether the component is disabled */
  disabled?: boolean
  /** Label above the zone */
  label?: string
  /** Helper description text */
  description?: string
  /** Error message */
  error?: string
  /**
   * Extra synchronous check run after the built-in accept/size validation
   * passes. Return an error message to reject the selection and show it
   * inline instead of adding the files; return null/undefined to accept.
   */
  validate?: (files: File[]) => string | null | undefined
  /** Text shown in idle state */
  idleText?: string
  /** Text shown in active drag state */
  activeText?: string
  /** Additional CSS classes */
  className?: string
}

/** Formats a byte count into a compact human-readable size (e.g. "1.2 MB"). */
function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * UploadZone - UBITS component for drag & drop file selection.
 * Desktop-first, B2B enterprise style using native Drag/Drop API.
 */
export function UploadZone({
  value = [],
  onChange,
  accept,
  multiple = false,
  maxFiles,
  maxSizeMB,
  disabled = false,
  label,
  description,
  error,
  validate,
  idleText = 'Drag and drop files here or click to browse',
  activeText = 'Drop files here...',
  className,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const processFiles = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return

    const validation = validateFiles(selectedFiles, {
      accept,
      multiple,
      maxFiles,
      maxSizeMB
    }, multiple ? value.length : 0)

    if (!validation.isValid) {
      setLocalError(validation.error || 'Invalid file selection')
      return
    }

    const extraError = validate?.(selectedFiles)
    if (extraError) {
      setLocalError(extraError)
      return
    }

    setLocalError(null)
    const newFiles = multiple ? [...value, ...selectedFiles] : selectedFiles
    onChange?.(newFiles)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (disabled) return

    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    processFiles(selectedFiles)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange?.(newFiles)
  }

  const displayError = error || localError
  const hasError = !!displayError

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-foreground', disabled && 'opacity-50')}>
          {label}
        </label>
      )}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center min-h-[160px] p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer',
          'bg-surface border-border hover:bg-surface hover:border-primary/50',
          isDragActive && 'bg-primary/5 border-primary scale-[1.01] shadow-sm',
          hasError && 'bg-destructive/5 border-destructive/50 hover:border-destructive',
          disabled && 'opacity-50 cursor-not-allowed grayscale-[0.5] hover:border-border hover:bg-surface'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center gap-3">
          <div className={cn(
            'p-3 rounded-full bg-background shadow-sm border border-border/50',
            isDragActive && 'text-primary',
            hasError && 'text-destructive'
          )}>
            {hasError ? <AlertCircle className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {isDragActive ? activeText : idleText}
            </p>
            {description && !displayError && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {displayError && (
              <p className="text-xs text-destructive font-medium">{displayError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Selected files — same card style as the recent-loads list */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-surface"
            >
              <div className="h-9 w-9 rounded-lg bg-surface-muted text-text-secondary/50 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{file.name}</p>
                <p className="text-[10px] text-text-secondary/50 font-medium">{formatFileSize(file.size)}</p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="text-text-secondary/40 hover:text-destructive transition-colors shrink-0"
                  aria-label={`Quitar ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
