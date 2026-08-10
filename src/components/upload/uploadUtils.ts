/**
 * Upload & Files Utilities using native HTML5 File API.
 */

import type { FileValidationRules, FileValidationResult, FileKind, UploadFileItem } from './uploadTypes'

/**
 * Format file size in bytes to human readable string (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from file name.
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

/**
 * Human-readable list of what an `accept` string actually allows.
 *
 * Derived instead of written by hand because the message it feeds is shown by
 * every upload zone in the app and they do not accept the same things: the
 * surveys one takes PDFs and images, the objectives one takes spreadsheets
 * only. A fixed sentence is wrong for one of them by construction, and telling
 * somebody a PDF would work when the dropzone will refuse it too is worse than
 * saying nothing.
 */
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic']

/** Extensions that roll up into a family name rather than being listed one by one. */
const ACCEPT_FAMILIES: Array<{ label: string; matches: string[] }> = [
  { label: 'Excel', matches: ['.xlsx', '.xls'] },
  { label: 'CSV', matches: ['.csv'] },
  { label: 'PDF', matches: ['.pdf'] },
  { label: 'imágenes', matches: IMAGE_EXTENSIONS },
]

function describeAccepted(accept: string): string {
  const types = accept.split(',').map((entry) => entry.trim().toLowerCase())
  const labels: string[] = []

  ACCEPT_FAMILIES.forEach(({ label, matches }) => {
    const matchesImages = label === 'imágenes' && types.some((type) => type.startsWith('image/'))
    if (matchesImages || matches.some((extension) => types.includes(extension))) {
      labels.push(label)
    }
  })

  // Anything no family claims is named by its own extension, so a newly
  // accepted type never silently drops out of the message.
  const claimed = new Set(ACCEPT_FAMILIES.flatMap((family) => family.matches))
  types
    .filter((type) => type.startsWith('.') && !claimed.has(type))
    .forEach((type) => labels.push(type))

  if (labels.length === 0) return ''
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} o ${labels[labels.length - 1]}`
}

/**
 * Validate a list of files against rules.
 */
export function validateFiles(
  files: File[],
  rules: FileValidationRules,
  currentCount: number = 0
): FileValidationResult {
  const { accept, maxSizeMB, maxFiles, multiple } = rules

  // 1. Check quantity
  if (!multiple && files.length > 1) {
    return { isValid: false, error: 'Solo se permite un archivo.' }
  }

  if (maxFiles && currentCount + files.length > maxFiles) {
    return { isValid: false, error: `Máximo ${maxFiles} archivos permitidos.` }
  }

  // 2. Validate each file
  for (const file of files) {
    // Check size
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      return {
        isValid: false,
        error: `"${file.name}" supera el límite de ${maxSizeMB} MB.`
      }
    }

    // Check type/extension
    if (accept) {
      const extension = `.${getFileExtension(file.name)}`
      const mimeType = file.type
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase())
      
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return extension === type
        }
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0]
          return mimeType.startsWith(`${baseType}/`)
        }
        return mimeType === type
      })

      if (!isAccepted) {
        const accepted = describeAccepted(accept)
        return {
          isValid: false,
          error: accepted
            ? `El tipo de archivo "${extension}" no está permitido. Acepta ${accepted}.`
            : `El tipo de archivo "${extension}" no está permitido.`
        }
      }
    }
  }

  return { isValid: true }
}

/**
 * Categorize file by its type or extension.
 */
export function getFileKind(file: File | UploadFileItem): FileKind {
  const mimeType = 'file' in file ? file.type : file.type
  const extension = getFileExtension(file.name)

  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf'
  
  if (
    mimeType === 'application/vnd.ms-excel' || 
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    ['csv', 'xls', 'xlsx'].includes(extension)
  ) {
    return 'spreadsheet'
  }

  if (
    mimeType === 'application/msword' || 
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ['doc', 'docx', 'txt', 'rtf'].includes(extension)
  ) {
    return 'document'
  }

  if (
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) ||
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed'
  ) {
    return 'archive'
  }

  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'

  return 'other'
}
