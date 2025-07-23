'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ThemeProvider({ children }: Props) {
  return (
    <div suppressHydrationWarning>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </div>
  )
}

// Re-export useTheme from next-themes
export { useTheme } from 'next-themes'