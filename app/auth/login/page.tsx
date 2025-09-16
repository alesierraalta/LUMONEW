'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { ConnectionIndicator } from '@/components/ui/connection-status'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalLoading(true)
    setError('')

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error)
      } else {
        // Success - the auth context will handle the redirect via ProtectedRoute
        router.push(redirectTo)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLocalLoading(false)
    }
  }

  // Auto-redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectTo)
    }
  }, [user, authLoading, router, redirectTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-4 px-4 sm:py-12 sm:px-6 lg:px-8 relative">
      {/* Connection Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <ConnectionIndicator />
      </div>
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-foreground">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Sistema de Gestión de Inventario LUMO
          </p>
        </div>

        <Card className="shadow-md sm:shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Acceso al Sistema</CardTitle>
            <CardDescription className="text-sm">
              Ingresa tus credenciales para acceder al sistema de inventario
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={localLoading || authLoading}
                  className="h-10 sm:h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={localLoading || authLoading}
                    className="h-10 sm:h-11 text-base pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={localLoading || authLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 sm:h-11 text-base font-medium"
                disabled={localLoading || authLoading}
              >
                {(localLoading || authLoading) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-center space-y-2">
              <Link
                href="/auth/reset-password"
                className="text-sm text-blue-600 hover:text-blue-500 block"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              
              <div className="text-xs sm:text-sm text-muted-foreground px-2">
                Sistema de acceso restringido - Solo usuarios autorizados
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}