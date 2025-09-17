'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function Logo({ 
  width = 24, 
  height = 24, 
  className,
  alt = "LUMO Logo"
}: LogoProps) {
  const { theme } = useTheme()
  
  return (
    <Image 
      src="/logo.png" 
      alt={alt}
      width={width} 
      height={height} 
      className={cn(
        "object-contain",
        (theme === 'dark' || theme === 'black') && "invert",
        className
      )}
    />
  )
}
