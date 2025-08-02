'use client'

import { useCards } from './card-provider'
import { InfoCard as InfoCardComponent } from './info-card'
import { cn } from '@/lib/utils'

interface CardContainerProps {
  className?: string
  maxCards?: number
  layout?: 'grid' | 'list'
  columns?: number
}

export function CardContainer({ 
  className,
  maxCards,
  layout = 'grid',
  columns = 3
}: CardContainerProps) {
  const { visibleCards } = useCards()

  // Apply maxCards limit if specified
  const displayCards = maxCards ? visibleCards.slice(0, maxCards) : visibleCards

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'grid':
        // Use explicit classes instead of dynamic ones
        if (columns === 4) {
          return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3'
        } else if (columns === 3) {
          return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3'
        } else if (columns === 2) {
          return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3'
        } else {
          return 'grid grid-cols-1 gap-3'
        }
      case 'list':
        return cn('flex flex-col gap-4')
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3'
    }
  }

  if (displayCards.length === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 text-center",
        className
      )}>
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">No hay tarjetas para mostrar</p>
          <p className="text-sm mt-1">Las tarjetas aparecerán aquí cuando haya información relevante</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Cards container - simplified for external grid usage */}
      <div className="contents">
        {displayCards.map((card) => (
          <div key={card.id} className="w-full">
            <InfoCardComponent card={card} />
          </div>
        ))}
      </div>

      {/* Show count if maxCards is applied */}
      {maxCards && visibleCards.length > maxCards && (
        <div className="col-span-full mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Mostrando {maxCards} de {visibleCards.length} tarjetas
          </p>
        </div>
      )}
    </div>
  )
}

// Specialized containers for different contexts
export function DashboardCards({ className }: { className?: string }) {
  return (
    <CardContainer
      className={className}
      layout="grid"
      columns={4}
      maxCards={8}
    />
  )
}

export function SidebarCards({ className }: { className?: string }) {
  return (
    <CardContainer
      className={className}
      layout="list"
      maxCards={3}
    />
  )
}

export function FullPageCards({ className }: { className?: string }) {
  return (
    <CardContainer
      className={className}
      layout="grid"
      columns={4}
    />
  )
}