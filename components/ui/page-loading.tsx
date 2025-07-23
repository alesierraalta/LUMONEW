'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PageLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const PageLoading = memo(({
  message,
  size = 'md',
  className
}: PageLoadingProps) => {
  const t = useTranslations('common')
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[200px] space-y-4",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      <p className="text-sm text-muted-foreground animate-pulse">
        {message || t('loading')}
      </p>
    </div>
  )
})

PageLoading.displayName = 'PageLoading'