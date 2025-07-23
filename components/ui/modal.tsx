'use client'

import * as React from 'react'
import { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalContextType {
  isOpen: boolean
  openModal: (content: React.ReactNode, options?: ModalOptions) => void
  closeModal: () => void
}

interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  overlay?: boolean
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState<React.ReactNode>(null)
  const [options, setOptions] = useState<ModalOptions>({})

  const openModal = useCallback((content: React.ReactNode, modalOptions: ModalOptions = {}) => {
    setContent(content)
    setOptions({ size: 'md', closable: true, overlay: true, ...modalOptions })
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    const timeoutId = setTimeout(() => {
      setContent(null)
      setOptions({})
    }, 300)
    
    // Store timeout ID for cleanup in tests
    if (typeof window !== 'undefined') {
      ;(window as any).__modalTimeoutId = timeoutId
    }
    
    return timeoutId
  }, [])

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      {isOpen && <ModalOverlay content={content} options={options} />}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalOverlayProps {
  content: React.ReactNode
  options: ModalOptions
}

function ModalOverlay({ content, options }: ModalOverlayProps) {
  const { closeModal } = useModal()
  const [isVisible, setIsVisible] = useState(false)

  React.useEffect(() => {
    setIsVisible(true)
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && options.closable !== false) {
      handleClose()
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(closeModal, 300)
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300',
        options.overlay !== false && 'bg-black/50 backdrop-blur-sm',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl transition-all duration-300 transform',
          sizeClasses[options.size || 'md'],
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {options.closable !== false && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        {content}
      </div>
    </div>
  )
}

// Pre-built confirmation modal
interface ConfirmationModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmationModal({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'info'
}: ConfirmationModalProps) {
  const { closeModal } = useModal()

  const handleConfirm = () => {
    onConfirm()
    closeModal()
  }

  const handleCancel = () => {
    onCancel?.()
    closeModal()
  }

  const typeStyles = {
    danger: {
      icon: '⚠️',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      titleClass: 'text-red-600'
    },
    warning: {
      icon: '⚠️',
      confirmClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      titleClass: 'text-yellow-600'
    },
    info: {
      icon: 'ℹ️',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      titleClass: 'text-blue-600'
    }
  }

  const style = typeStyles[type]

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{style.icon}</span>
        <h3 className={cn('text-lg font-semibold', style.titleClass)}>
          {title}
        </h3>
      </div>
      
      <p className="text-gray-600 mb-6 leading-relaxed">
        {message}
      </p>
      
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            style.confirmClass
          )}
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}