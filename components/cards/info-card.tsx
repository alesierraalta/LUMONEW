'use client'

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Info, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  InfoCard as InfoCardType,
  StatCard,
  NotificationCard
} from '@/lib/types'

interface InfoCardProps {
  card: InfoCardType
  className?: string
}

// Type guard functions
const isStatCard = (card: InfoCardType): card is StatCard => {
  return card.type === 'stat' && 'value' in card
}

const isNotificationCard = (card: InfoCardType): card is NotificationCard => {
  return card.type === 'notification' && 'message' in card
}

// Simple render functions for each card type
const renderStatCard = (card: StatCard) => {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {card.format === 'currency' ? '$' : ''}
          {String(card.value)}
          {card.unit && (
            <span className="text-sm font-normal ml-1">{card.unit}</span>
          )}
        </span>
        {card.change && (
          <div className="flex items-center gap-1">
            {getTrendIcon(card.change.trend)}
            <span className={cn(
              'text-sm font-medium',
              card.change.trend === 'up' ? 'text-green-600' :
              card.change.trend === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {card.change.percentage > 0 ? '+' : ''}{card.change.percentage}%
            </span>
          </div>
        )}
      </div>
      {card.previousValue && (
        <p className="text-xs text-muted-foreground">
          Anterior: {String(card.previousValue)}
        </p>
      )}
    </div>
  )
}

const renderNotificationCard = (card: NotificationCard) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        {card.severity && (
          <span>{getSeverityIcon(card.severity)}</span>
        )}
        <p className="text-sm">{card.message}</p>
      </div>
    </div>
  )
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-500" />
    case 'stable':
      return <Minus className="w-4 h-4 text-gray-500" />
  }
}

const getSeverityIcon = (severity: 'info' | 'warning' | 'error' | 'success' | 'critical') => {
  switch (severity) {
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'critical':
      return <AlertCircle className="w-4 h-4 text-red-600" />
  }
}

export function InfoCard({ card, className }: InfoCardProps) {
  const getCardColor = () => {
    const baseColors = {
      blue: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20',
      green: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
      yellow: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20',
      red: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
      purple: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20',
      gray: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
    }
    return card.color ? baseColors[card.color] : baseColors.gray
  }

  const getPriorityIndicator = () => {
    const indicators = {
      low: 'border-l-4 border-l-gray-400',
      medium: 'border-l-4 border-l-yellow-400',
      high: 'border-l-4 border-l-orange-400',
      critical: 'border-l-4 border-l-red-500'
    }
    return indicators[card.priority]
  }

  const getSizeClasses = () => {
    const sizes = {
      small: 'min-h-[120px]',
      medium: 'min-h-[160px]',
      large: 'min-h-[200px]',
      full: 'min-h-[240px]'
    }
    return sizes[card.size]
  }

  return (
    <Card
      className={cn(
        'transition-colors duration-200',
        getSizeClasses(),
        getCardColor(),
        getPriorityIndicator(),
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {card.title}
            </CardTitle>
            {card.subtitle && (
              <CardDescription className="text-sm mt-1">
                {card.subtitle}
              </CardDescription>
            )}
          </div>
          {card.priority === 'critical' && (
            <Badge variant="destructive" className="text-xs">
              Crítico
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Render card content based on type */}
          {isStatCard(card) && renderStatCard(card)}
          {isNotificationCard(card) && renderNotificationCard(card)}

          {/* Generic Content */}
          {card.content && (
            <div className="text-sm text-foreground">
              {card.content}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}