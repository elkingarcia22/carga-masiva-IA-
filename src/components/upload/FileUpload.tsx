import * as React from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatFileSize, validateFiles } from './uploadUtils'

export interface FileUploadProps {
  /** Selected files */
  value?: File[]
  /** Callback when selection changes */
  onChange?: (files: File[]) => void
  /** Accepted file types (e.g. ".jpg,.png,application/pdf") */
  accept?: string
  /** Whether multiple selection is allowed */
  multiple?: boolean
  /** Maximum number of files */
  maxFiles?: number
  /** Maximum file size in MB */
  maxSizeMB?: number
  /** Whether the input is disabled */
  disabled?: boolean
  /** Label for the component */
  label?: string
  /** Helper description text */
  description?: string
  /** Error message */
  error?: string
  /** Label for the select button */
  buttonLabel?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * FileUpload - UBITS component for selecting files via button.
 * Uses native HTML5 File API.
 */
export function FileUpload({
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
  buttonLabel = 'Choose file',
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const validation = validateFiles(selectedFiles, {
      accept,
      multiple,
      maxFiles,
      maxSizeMB
    })

    if (!validation.isValid) {
      setLocalError(validation.error || 'Invalid file selection')
      return
    }

    setLocalError(null)
    const newFiles = multiple ? [...value, ...selectedFiles] : selectedFiles
    onChange?.(newFiles)

    // Reset input so the same file can be selected again
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

      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={handleButtonClick}
          className={cn(
            'w-fit h-10 px-4 gap-2',
            hasError && 'border-destructive text-destructive hover:bg-destructive/5'
          )}
        >
          <Upload className="h-4 w-4" />
          {multiple && value.length > 0 ? 'Add more' : buttonLabel}
        </Button>

        {/* Simple text list of selected files */}
        {value.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {value.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium truncate">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {description && !displayError && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {displayError && (
        <p className="text-xs text-destructive font-medium">{displayError}</p>
      )}
    </div>
  )
}
