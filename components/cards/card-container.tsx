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
        return cn(
          'grid gap-4',
          `grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`
        )
      case 'list':
        return cn('flex flex-col gap-4')
      default:
        return cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4')
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
      {/* Cards container */}
      <div className={getLayoutClasses()}>
        {displayCards.map((card) => (
          <div key={card.id}>
            <InfoCardComponent card={card} />
          </div>
        ))}
      </div>

      {/* Show count if maxCards is applied */}
      {maxCards && visibleCards.length > maxCards && (
        <div className="mt-4 text-center">
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
      columns={3}
      maxCards={6}
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