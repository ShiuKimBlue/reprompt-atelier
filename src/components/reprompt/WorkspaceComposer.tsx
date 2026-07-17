import { useRef, useState, type KeyboardEvent } from 'react'
import { Check, FileText, ImagePlus, Sparkles, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { WorkspaceImage, WorkspaceTextAttachmentPayload } from '@/types'

interface WorkspaceComposerProps {
  value: string
  placeholder: string
  disabled?: boolean
  loading?: boolean
  stopped?: boolean
  allowImages?: boolean
  allowTextAttachments?: boolean
  images?: WorkspaceImage[]
  textAttachments?: WorkspaceTextAttachmentPayload[]
  helperText?: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  onImagesChange?: (images: WorkspaceImage[]) => void
  onTextAttachmentsChange?: (attachments: WorkspaceTextAttachmentPayload[]) => void
}

const MAX_IMAGES = 4
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
const MAX_TEXT_ATTACHMENTS = 6
const MAX_TEXT_ATTACHMENT_SIZE_BYTES = 512 * 1024
const MAX_SINGLE_TEXT_ATTACHMENT_CHARS = 40_000
const MAX_TOTAL_TEXT_ATTACHMENT_CHARS = 120_000
const TEXT_ATTACHMENT_ACCEPT = '.txt,.md,.csv,.json,.yaml,.yml,.xml,.html,.css,.scss,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.cpp,.c,.cs,.sql,.log,.ini,.toml,.env.example'
const SUPPORTED_TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'csv', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx',
  'py', 'java', 'go', 'rs', 'cpp', 'c', 'cs', 'sql', 'log', 'ini', 'toml', 'env.example',
])
const SUPPORTED_TEXT_MIME_TYPES = new Set([
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-javascript',
  'application/typescript',
  'text/javascript',
  'text/typescript',
])

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function getExtension(fileName: string) {
  const lowerName = fileName.toLowerCase()
  if (lowerName.endsWith('.env.example')) return 'env.example'
  const lastDot = lowerName.lastIndexOf('.')
  return lastDot >= 0 ? lowerName.slice(lastDot + 1) : ''
}

function isSupportedTextFile(file: File) {
  const extension = getExtension(file.name)
  if (extension === 'env') return false
  if (SUPPORTED_TEXT_EXTENSIONS.has(extension)) return true
  return file.type.startsWith('text/') || SUPPORTED_TEXT_MIME_TYPES.has(file.type)
}

function truncateAttachmentText(text: string, remainingBudget: number) {
  const singleLimit = Math.min(MAX_SINGLE_TEXT_ATTACHMENT_CHARS, Math.max(0, remainingBudget))
  const includedText = text.slice(0, singleLimit)
  return {
    text: includedText,
    truncated: includedText.length < text.length,
    includedCharCount: includedText.length,
    originalCharCount: text.length,
  }
}

async function filesToImages(files: File[]): Promise<WorkspaceImage[]> {
  return Promise.all(files.map((file) => new Promise<WorkspaceImage>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve({
      id: crypto.randomUUID(),
      name: file.name,
      dataUrl: String(reader.result),
      mimeType: file.type,
    })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })))
}

export function WorkspaceComposer({
  value,
  placeholder,
  disabled = false,
  loading = false,
  stopped = false,
  allowImages = false,
  allowTextAttachments = false,
  images = [],
  textAttachments = [],
  helperText,
  onChange,
  onSubmit,
  onStop,
  onImagesChange,
  onTextAttachmentsChange,
}: WorkspaceComposerProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const textInputRef = useRef<HTMLInputElement | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const canSubmit = !disabled && !loading && (value.trim().length > 0 || images.length > 0 || textAttachments.length > 0)

  const removeImage = (id: string) => {
    onImagesChange?.(images.filter((image) => image.id !== id))
  }

  const removeTextAttachment = (id: string) => {
    onTextAttachmentsChange?.(textAttachments.filter((attachment) => attachment.id !== id))
  }

  const handleImageFilesSelected = async (files: FileList | null) => {
    if (!files) return
    setAttachmentError(null)

    const selectedFiles = Array.from(files)
    const validFiles = selectedFiles.filter((file) => file.type.startsWith('image/'))
    if (validFiles.length !== selectedFiles.length) {
      setAttachmentError('只能上传图片文件。')
      return
    }

    if (images.length + validFiles.length > MAX_IMAGES) {
      setAttachmentError(`最多上传 ${MAX_IMAGES} 张图片。`)
      return
    }

    const oversized = validFiles.find((file) => file.size > MAX_IMAGE_SIZE_BYTES)
    if (oversized) {
      setAttachmentError(`${oversized.name} 超过 ${formatFileSize(MAX_IMAGE_SIZE_BYTES)}，请压缩后再上传。`)
      return
    }

    try {
      const nextImages = await filesToImages(validFiles)
      onImagesChange?.([...images, ...nextImages])
    } catch {
      setAttachmentError('图片读取失败，请重新选择。')
    }
  }

  const handleTextFilesSelected = async (files: FileList | null) => {
    if (!files) return
    setAttachmentError(null)

    const selectedFiles = Array.from(files)
    if (textAttachments.length + selectedFiles.length > MAX_TEXT_ATTACHMENTS) {
      setAttachmentError(`最多上传 ${MAX_TEXT_ATTACHMENTS} 个文本附件。`)
      return
    }

    const envFile = selectedFiles.find((file) => getExtension(file.name) === 'env')
    if (envFile) {
      setAttachmentError('为避免泄露密钥，暂不支持上传 .env 文件。可上传脱敏后的 .env.example。')
      return
    }

    const unsupported = selectedFiles.find((file) => !isSupportedTextFile(file))
    if (unsupported) {
      setAttachmentError('暂不支持该文件类型，请上传 txt、md、csv、json、yaml、代码或日志等纯文本文件。')
      return
    }

    const oversized = selectedFiles.find((file) => file.size > MAX_TEXT_ATTACHMENT_SIZE_BYTES)
    if (oversized) {
      setAttachmentError(`${oversized.name} 文件过大，单个文本附件最大支持 ${formatFileSize(MAX_TEXT_ATTACHMENT_SIZE_BYTES)}。`)
      return
    }

    try {
      const existingChars = textAttachments.reduce((total, attachment) => total + (attachment.includedCharCount ?? 0), 0)
      let remainingBudget = Math.max(0, MAX_TOTAL_TEXT_ATTACHMENT_CHARS - existingChars)
      const nextAttachments: WorkspaceTextAttachmentPayload[] = []

      for (const file of selectedFiles) {
        if (remainingBudget <= 0) {
          setAttachmentError('文本附件总长度已达上限，部分文件未添加。')
          break
        }

        const rawText = await file.text()
        if (!rawText.trim()) {
          setAttachmentError(`${file.name} 是空文件，请选择包含文本内容的文件。`)
          return
        }

        const result = truncateAttachmentText(rawText, remainingBudget)
        if (!result.text.trim()) {
          setAttachmentError('文本附件总长度已达上限，部分文件未添加。')
          break
        }

        remainingBudget -= result.includedCharCount
        nextAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          extension: getExtension(file.name) || undefined,
          lineCount: result.text.split(/\r\n|\r|\n/).length,
          truncated: result.truncated,
          originalCharCount: result.originalCharCount,
          includedCharCount: result.includedCharCount,
          text: result.text,
        })
      }

      if (nextAttachments.length > 0) onTextAttachmentsChange?.([...textAttachments, ...nextAttachments])
    } catch {
      setAttachmentError('文本附件读取失败，请重新选择。')
    }
  }

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      const textarea = event.currentTarget
      const nextValue = `${value.slice(0, textarea.selectionStart)}\n${value.slice(textarea.selectionEnd)}`
      const nextCursor = textarea.selectionStart + 1
      onChange(nextValue)
      requestAnimationFrame(() => {
        textarea.selectionStart = nextCursor
        textarea.selectionEnd = nextCursor
      })
      return
    }

    event.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]">
              <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                aria-label="移除图片"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {textAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {textAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group flex min-w-0 max-w-[260px] items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-xs shadow-sm"
              title={`${attachment.name}${attachment.truncated ? ` · 本次使用 ${attachment.includedCharCount} / ${attachment.originalCharCount} 字符` : ''}`}
            >
              <FileText className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-[var(--text-primary)]">{attachment.name}</span>
                <span className="block truncate text-[var(--text-muted)]">
                  {formatFileSize(attachment.size)} · {attachment.extension || attachment.mimeType}{attachment.truncated ? ' · 已截断' : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeTextAttachment(attachment.id)}
                className="rounded-full p-0.5 text-[var(--text-muted)] opacity-70 transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/45"
                aria-label={`移除 ${attachment.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 shadow-sm">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] max-h-[150px] resize-none appearance-none rounded-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {allowImages && (
              <Button
                type="button"
                size="icon-lg"
                onClick={() => imageInputRef.current?.click()}
                className="h-9 w-9 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                title="添加图片"
                aria-label="添加图片"
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            )}
            {allowImages && (
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (event) => {
                  await handleImageFilesSelected(event.target.files)
                  event.target.value = ''
                }}
              />
            )}
            {allowTextAttachments && (
              <Button
                type="button"
                size="icon-lg"
                onClick={() => textInputRef.current?.click()}
                className="h-9 w-9 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                title="上传文本附件"
                aria-label="上传文本附件"
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            {allowTextAttachments && (
              <input
                ref={textInputRef}
                type="file"
                accept={TEXT_ATTACHMENT_ACCEPT}
                multiple
                className="hidden"
                onChange={async (event) => {
                  await handleTextFilesSelected(event.target.files)
                  event.target.value = ''
                }}
              />
            )}
          </div>

          {loading ? (
            <Button
              type="button"
              size="icon-lg"
              onClick={onStop}
              className="h-9 w-9 rounded-xl bg-red-500 text-white hover:bg-red-600"
              aria-label="停止生成"
              title="停止生成"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : stopped ? (
            <Button
              type="button"
              size="icon-lg"
              disabled
              className="h-9 w-9 rounded-xl border border-[var(--accent-primary)]/20 bg-[var(--accent-light)] text-[var(--accent-primary)] disabled:opacity-100"
              aria-label="已停止"
              title="已停止"
            >
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon-lg"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="h-9 w-9 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]"
              aria-label="开始生成"
              title="开始生成"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {helperText && <p className="text-xs text-[var(--text-muted)]">{helperText}</p>}
      {allowTextAttachments && <p className="text-xs text-[var(--text-muted)]">文本附件正文只用于本次生成，不会保存到历史记录。</p>}
      {attachmentError && <p className="text-xs text-red-500">{attachmentError}</p>}
    </div>
  )
}
