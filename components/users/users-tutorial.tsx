'use client'

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TutorialStep {
  id: string
  target: string // CSS selector for target element
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface UsersTutorialProps {
  isOpen: boolean
  steps: TutorialStep[]
  onClose: () => void
}

export function UsersTutorial({ isOpen, steps, onClose }: UsersTutorialProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipSize, setTooltipSize] = useState<{ w: number; h: number }>({ w: 320, h: 160 })
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const currentStep = steps[currentIndex]

  useEffect(() => {
    if (!isOpen) return
    function compute() {
      const el = currentStep ? (document.querySelector(currentStep.target) as HTMLElement | null) : null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
      } else {
        setTargetRect(null)
      }
    }
    compute()
    const onResize = () => compute()
    const onScroll = () => compute()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    const int = setInterval(compute, 250)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
      clearInterval(int)
    }
  }, [isOpen, currentIndex, currentStep])

  // Measure tooltip size to prevent overflow and compute accurate placement
  useLayoutEffect(() => {
    if (!isOpen) return
    if (tooltipRef.current) {
      const r = tooltipRef.current.getBoundingClientRect()
      if (r.width && r.height) {
        setTooltipSize({ w: Math.round(r.width), h: Math.round(r.height) })
      }
    }
  }, [isOpen, currentIndex, currentStep])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(i + 1, steps.length - 1))
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, steps.length, onClose])

  useEffect(() => {
    if (!isOpen) setCurrentIndex(0)
  }, [isOpen])

  const tooltipStyle = useMemo(() => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const spacing = 12
    const margin = 12
    const vw = window.innerWidth
    const vh = window.innerHeight
    const dims = tooltipSize || { w: 320, h: 160 }
    const pref = currentStep?.placement || 'bottom'

    const fits = (pl: string) => {
      if (pl === 'bottom') return (vh - targetRect.bottom) >= (dims.h + spacing)
      if (pl === 'top') return (targetRect.top) >= (dims.h + spacing)
      if (pl === 'left') return (targetRect.left) >= (dims.w + spacing)
      if (pl === 'right') return (vw - targetRect.right) >= (dims.w + spacing)
      return false
    }
    const order = [pref, 'bottom', 'right', 'top', 'left'] as const
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
    for (const pl of order) {
      if (fits(pl)) { placement = pl as any; break }
    }

    let top = 0
    let left = 0
    if (placement === 'bottom') {
      top = targetRect.bottom + spacing
      left = targetRect.left + (targetRect.width - dims.w) / 2
    } else if (placement === 'top') {
      top = targetRect.top - dims.h - spacing
      left = targetRect.left + (targetRect.width - dims.w) / 2
    } else if (placement === 'left') {
      top = targetRect.top + (targetRect.height - dims.h) / 2
      left = targetRect.left - dims.w - spacing
    } else { // right
      top = targetRect.top + (targetRect.height - dims.h) / 2
      left = targetRect.right + spacing
    }

    // Clamp within viewport
    top = Math.min(Math.max(top, margin), vh - dims.h - margin)
    left = Math.min(Math.max(left, margin), vw - dims.w - margin)

    return { top: `${Math.round(top)}px`, left: `${Math.round(left)}px`, transform: 'none' }
  }, [targetRect, currentStep, tooltipSize])

  if (!isOpen) return null

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[9999]">
      {/* Pointer-capture overlay without blur to keep target crisp */}
      <div className="absolute inset-0" aria-hidden />
      {/* If no target is detected, dim whole screen lightly */}
      {!targetRect && <div className="absolute inset-0 bg-black/60 dark:bg-black/80" aria-hidden />}

      {/* Highlight box */}
      {targetRect && (
        <>
          {/* darken around target without overlaying the target itself */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top */}
            <div
              className="absolute left-0 right-0 bg-black/60 dark:bg-black/80"
              style={{ height: Math.max(0, targetRect.top - 8) + 'px', top: 0 }}
            />
            {/* Bottom */}
            <div
              className="absolute left-0 right-0 bg-black/60 dark:bg-black/80"
              style={{ top: targetRect.bottom + 8 + 'px', bottom: 0 }}
            />
            {/* Left */}
            <div
              className="absolute bg-black/60 dark:bg-black/80"
              style={{
                top: Math.max(0, targetRect.top - 8) + 'px',
                bottom: Math.max(0, window.innerHeight - (targetRect.bottom + 8)) + 'px',
                left: 0,
                width: Math.max(0, targetRect.left - 8) + 'px',
              }}
            />
            {/* Right */}
            <div
              className="absolute bg-black/60 dark:bg-black/80"
              style={{
                top: Math.max(0, targetRect.top - 8) + 'px',
                bottom: Math.max(0, window.innerHeight - (targetRect.bottom + 8)) + 'px',
                right: 0,
                width: Math.max(0, window.innerWidth - (targetRect.right + 8)) + 'px',
              }}
            />
          </div>
          {/* Focus ring around the target */}
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-primary"
            style={{
              top: `${Math.max(8, targetRect.top - 8)}px`,
              left: `${Math.max(8, targetRect.left - 8)}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
            }}
          />
        </>
      )}

      {/* Tooltip/Card */}
      <div
        className="absolute max-w-[90vw] sm:max-w-md bg-card text-foreground border border-border rounded-lg shadow-xl p-4"
        style={tooltipStyle as any}
        role="dialog"
        aria-modal="true"
        ref={tooltipRef}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold mb-1">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar tutorial">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            Paso {currentIndex + 1} de {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
            </Button>
            {currentIndex < steps.length - 1 ? (
              <Button size="sm" onClick={() => setCurrentIndex((i) => Math.min(steps.length - 1, i + 1))}>
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={onClose}>
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tutorial steps for user management
export const userManagementTutorialSteps: TutorialStep[] = [
  {
    id: 'users-overview',
    target: '[data-tutorial="users-header"]',
    title: 'Gestión de Usuarios',
    description: 'Esta sección te permite administrar todos los usuarios del sistema. Aquí puedes ver, crear, editar y eliminar usuarios.',
    placement: 'bottom'
  },
  {
    id: 'create-user-button',
    target: '[data-tutorial="create-user-btn"]',
    title: 'Crear Nuevo Usuario',
    description: 'Haz clic en este botón para crear un nuevo usuario. Te llevará a un formulario donde podrás ingresar toda la información necesaria.',
    placement: 'bottom'
  },
  {
    id: 'users-grid',
    target: '[data-tutorial="users-grid"]',
    title: 'Lista de Usuarios',
    description: 'Aquí se muestran todos los usuarios registrados en el sistema. Cada tarjeta muestra información básica del usuario.',
    placement: 'top'
  },
  {
    id: 'user-card',
    target: '[data-tutorial="user-card"]:first-child',
    title: 'Tarjeta de Usuario',
    description: 'Cada tarjeta muestra el nombre, email, rol y estado del usuario. Puedes hacer clic para ver más detalles o usar los botones de acción.',
    placement: 'right'
  },
  {
    id: 'user-actions',
    target: '[data-tutorial="user-actions"]:first-child',
    title: 'Acciones de Usuario',
    description: 'Estas opciones te permiten ver detalles, editar información o eliminar usuarios. El botón de vista muestra información completa.',
    placement: 'left'
  },
  {
    id: 'tutorial-button',
    target: '[data-tutorial="tutorial-btn"]',
    title: 'Ayuda y Tutorial',
    description: 'Siempre puedes acceder a este tutorial haciendo clic en el botón "Tutorial" para recordar cómo usar las funciones.',
    placement: 'bottom'
  }
]

// Tutorial steps for user creation
export const userCreationTutorialSteps: TutorialStep[] = [
  {
    id: 'create-user-header',
    target: '[data-tutorial="create-user-header"]',
    title: 'Crear Nuevo Usuario',
    description: 'Este formulario te permite crear un nuevo usuario en el sistema. Completa todos los campos requeridos.',
    placement: 'bottom'
  },
  {
    id: 'user-information',
    target: '[data-tutorial="user-info-section"]',
    title: 'Información del Usuario',
    description: 'Ingresa la información básica del usuario: nombre completo, email y contraseña. Todos estos campos son obligatorios.',
    placement: 'right'
  },
  {
    id: 'name-field',
    target: '[data-tutorial="name-field"]',
    title: 'Nombre Completo',
    description: 'Ingresa el nombre completo del usuario. Debe tener al menos 2 caracteres.',
    placement: 'bottom'
  },
  {
    id: 'email-field',
    target: '[data-tutorial="email-field"]',
    title: 'Correo Electrónico',
    description: 'Ingresa un email válido. Este será usado para el login y comunicaciones. El sistema validará el formato automáticamente.',
    placement: 'bottom'
  },
  {
    id: 'password-field',
    target: '[data-tutorial="password-field"]',
    title: 'Contraseña',
    description: 'Crea una contraseña segura de al menos 6 caracteres. El usuario podrá cambiarla después del primer login.',
    placement: 'bottom'
  },
  {
    id: 'role-selection',
    target: '[data-tutorial="role-section"]',
    title: 'Asignación de Rol',
    description: 'Selecciona el rol que tendrá el usuario. Cada rol tiene diferentes permisos y accesos en el sistema.',
    placement: 'left'
  },
  {
    id: 'role-permissions',
    target: '[data-tutorial="role-permissions"]',
    title: 'Permisos del Rol',
    description: 'Aquí puedes ver todos los permisos que tendrá el usuario con el rol seleccionado. Revisa que sean los correctos.',
    placement: 'left'
  },
  {
    id: 'submit-button',
    target: '[data-tutorial="submit-btn"]',
    title: 'Crear Usuario',
    description: 'Una vez completados todos los campos, haz clic aquí para crear el usuario. Se validará la información antes de guardar.',
    placement: 'top'
  },
  {
    id: 'cancel-button',
    target: '[data-tutorial="cancel-btn"]',
    title: 'Cancelar',
    description: 'Si necesitas cancelar la creación, usa este botón para regresar a la lista de usuarios sin guardar cambios.',
    placement: 'top'
  }
]