'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown,
  Package,
  DollarSign,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SwipeCardData {
  id: string
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange'
  description?: string
  icon?: any
}

interface MobileSwipeCardsProps {
  cards: SwipeCardData[]
  onCardTap?: (card: SwipeCardData) => void
  showIndicators?: boolean
}

export function MobileSwipeCards({ 
  cards, 
  onCardTap,
  showIndicators = true 
}: MobileSwipeCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning && cards.length > 1) {
        handleNext()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, isTransitioning, cards.length])

  const handleNext = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev + 1) % cards.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handlePrev = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrev()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const getColorClasses = (color: string, trend: 'up' | 'down') => {
    const baseClasses = {
      green: 'bg-green-100 text-green-700 border-green-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200'
    }
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.blue
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main swipeable container */}
      <div 
        className="overflow-hidden rounded-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${cards.length * 100}%`
          }}
        >
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className="w-full flex-shrink-0"
              style={{ width: `${100 / cards.length}%` }}
            >
              <Card 
                className="bg-white shadow-sm border-0 mx-1 cursor-pointer haptic-light"
                onClick={() => onCardTap?.(card)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {card.icon && <card.icon className="w-4 h-4 text-gray-600" />}
                        <p className="text-xs text-gray-500 font-medium">{card.title}</p>
                      </div>
                      <Badge 
                        className={`text-xs px-2 py-1 ${getColorClasses(card.color, card.trend)}`}
                      >
                        {card.trend === 'up' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {card.change}
                      </Badge>
                    </div>

                    {/* Value */}
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      {card.description && (
                        <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                      )}
                    </div>

                    {/* Trend indicator */}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        card.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.trend === 'up' ? 
                          <TrendingUp className="w-3 h-3" /> : 
                          <TrendingDown className="w-3 h-3" />
                        }
                        <span>{card.trend === 'up' ? 'Subiendo' : 'Bajando'}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {index + 1} de {cards.length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      {cards.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm shadow-sm"
            onClick={handlePrev}
            disabled={isTransitioning}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm shadow-sm"
            onClick={handleNext}
            disabled={isTransitioning}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && cards.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {cards.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-600 w-6' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true)
                  setCurrentIndex(index)
                  setTimeout(() => setIsTransitioning(false), 300)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Swipe hint */}
      {cards.length > 1 && (
        <div className="text-center mt-2">
          <p className="text-xs text-gray-400">Desliza para ver más</p>
        </div>
      )}
    </div>
  )
}

// Default export for easier importing
export default MobileSwipeCards 