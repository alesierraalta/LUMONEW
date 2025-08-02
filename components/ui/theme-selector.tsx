'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Circle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themes = [
    {
      name: 'light',
      label: 'Claro',
      icon: Sun,
      description: 'Tema claro para uso diurno'
    },
    {
      name: 'dark',
      label: 'Oscuro',
      icon: Moon,
      description: 'Tema oscuro suave'
    },
    {
      name: 'black',
      label: 'Negro',
      icon: Circle,
      description: 'Tema negro puro para OLED'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Tema de la Aplicación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon
            const isSelected = theme === themeOption.name
            
            return (
              <Button
                key={themeOption.name}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  'h-auto p-4 flex flex-col items-center gap-2 text-center',
                  isSelected && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => setTheme(themeOption.name)}
              >
                <Icon className="h-6 w-6" />
                <div>
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {themeOption.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>• <strong>Claro:</strong> Ideal para uso durante el día</p>
          <p>• <strong>Oscuro:</strong> Reduce la fatiga visual en ambientes con poca luz</p>
          <p>• <strong>Negro:</strong> Ahorra batería en pantallas OLED y proporciona máximo contraste</p>
        </div>
      </CardContent>
    </Card>
  )
}