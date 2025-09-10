'use client'

import * as React from 'react'
import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  onImageRemove?: () => void
  currentImage?: string
  maxSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  currentImage,
  maxSize = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  disabled = false
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de archivo no válido. Solo se permiten: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo es demasiado grande. Máximo ${maxSize}MB permitido.`
    }
    
    return null
  }, [acceptedTypes, maxSize])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)
    
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    
    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      // Simulate upload delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onImageSelect(file)
    } catch (err) {
      setError('Error al procesar la imagen')
    } finally {
      setIsUploading(false)
    }
  }, [validateFile, onImageSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleRemoveImage = useCallback(() => {
    setPreview(null)
    setError(null)
    onImageRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onImageRemove])

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer group',
          isDragOver && !disabled
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          preview ? 'border-solid border-border' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClick()
                  }}
                  className="p-2 bg-background rounded-full shadow-lg hover:bg-muted transition-colors"
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage()
                  }}
                  className="p-2 bg-background rounded-full shadow-lg hover:bg-muted transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Procesando...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                'p-4 rounded-full transition-colors',
                isDragOver ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
              )}>
                <ImageIcon className={cn(
                  'h-8 w-8 transition-colors',
                  isDragOver ? 'text-blue-600' : 'text-gray-400'
                )} />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  {isDragOver ? 'Suelta la imagen aquí' : 'Sube una imagen de perfil'}
                </p>
                <p className="text-sm text-gray-500">
                  Arrastra y suelta o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-400">
                  Máximo {maxSize}MB • {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

// Compact version for forms
interface CompactImageUploadProps extends Omit<ImageUploadProps, 'className'> {
  size?: 'sm' | 'md' | 'lg'
  shape?: 'square' | 'circle'
  className?: string
}

export function CompactImageUpload({
  size = 'md',
  shape = 'circle',
  className,
  ...props
}: CompactImageUploadProps) {
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  }

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full'
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn(
        'relative border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer group overflow-hidden',
        sizeClasses[size],
        shapeClasses[shape]
      )}>
        <ImageUpload
          {...props}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}