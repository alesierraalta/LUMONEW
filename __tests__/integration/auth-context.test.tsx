import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000'
  },
  writable: true
})

describe('Auth Context Integration Tests', () => {
  let mockSupabase: any
  let mockAuth: any
  let mockSubscription: any

  beforeEach(() => {
    mockSubscription = {
      unsubscribe: vi.fn()
    }

    mockAuth = {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: mockSubscription } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn()
    }

    mockSupabase = {
      auth: mockAuth
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AuthProvider', () => {
    it('should render children', () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should initialize with loading state', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should get initial session on mount', async () => {
      const mockSession: Partial<Session> = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        } as User
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: mockSession } })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toEqual(mockSession)
      expect(result.current.user).toEqual(mockSession.user)
      expect(mockAuth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should set up auth state change listener', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(mockAuth.onAuthStateChange).toHaveBeenCalledTimes(1)
      })

      expect(mockAuth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle auth state changes', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      let authStateChangeCallback: any

      mockAuth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateChangeCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate auth state change
      const newSession: Partial<Session> = {
        access_token: 'new-token',
        user: {
          id: 'user-2',
          email: 'newuser@example.com',
          created_at: '2023-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        } as User
      }

      await act(async () => {
        authStateChangeCallback('SIGNED_IN', newSession)
      })

      expect(result.current.session).toEqual(newSession)
      expect(result.current.user).toEqual(newSession.user)
      expect(result.current.loading).toBe(false)
    })

    it('should cleanup subscription on unmount', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(mockAuth.onAuthStateChange).toHaveBeenCalledTimes(1)
      })

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1)
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should return auth context when used within AuthProvider', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('session')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('signIn')
      expect(result.current).toHaveProperty('signUp')
      expect(result.current).toHaveProperty('signOut')
      expect(result.current).toHaveProperty('resetPassword')
    })
  })

  describe('Authentication methods', () => {
    beforeEach(() => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })
    })

    describe('signIn', () => {
      it('should call supabase signInWithPassword', async () => {
        mockAuth.signInWithPassword.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signIn('test@example.com', 'password123')

        expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
        expect(response).toEqual({ error: null })
      })

      it('should return error on failed sign in', async () => {
        const mockError: Partial<AuthError> = {
          message: 'Invalid credentials',
          status: 400
        }

        mockAuth.signInWithPassword.mockResolvedValue({ error: mockError })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signIn('test@example.com', 'wrongpassword')

        expect(response).toEqual({ error: mockError })
      })

      it('should handle sign in with empty credentials', async () => {
        mockAuth.signInWithPassword.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        await result.current.signIn('', '')

        expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
          email: '',
          password: ''
        })
      })
    })

    describe('signUp', () => {
      it('should call supabase signUp without user data', async () => {
        mockAuth.signUp.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signUp('newuser@example.com', 'password123')

        expect(mockAuth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          options: {
            data: undefined
          }
        })
        expect(response).toEqual({ error: null })
      })

      it('should call supabase signUp with user data', async () => {
        mockAuth.signUp.mockResolvedValue({ error: null })

        const userData = {
          firstName: 'John',
          lastName: 'Doe',
          role: 'employee'
        }

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signUp('newuser@example.com', 'password123', userData)

        expect(mockAuth.signUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          options: {
            data: userData
          }
        })
        expect(response).toEqual({ error: null })
      })

      it('should return error on failed sign up', async () => {
        const mockError: Partial<AuthError> = {
          message: 'Email already registered',
          status: 422
        }

        mockAuth.signUp.mockResolvedValue({ error: mockError })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signUp('existing@example.com', 'password123')

        expect(response).toEqual({ error: mockError })
      })
    })

    describe('signOut', () => {
      it('should call supabase signOut', async () => {
        mockAuth.signOut.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signOut()

        expect(mockAuth.signOut).toHaveBeenCalledTimes(1)
        expect(response).toEqual({ error: null })
      })

      it('should return error on failed sign out', async () => {
        const mockError: Partial<AuthError> = {
          message: 'Sign out failed',
          status: 500
        }

        mockAuth.signOut.mockResolvedValue({ error: mockError })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.signOut()

        expect(response).toEqual({ error: mockError })
      })
    })

    describe('resetPassword', () => {
      it('should call supabase resetPasswordForEmail', async () => {
        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.resetPassword('user@example.com')

        expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
          redirectTo: 'http://localhost:3000/auth/reset-password'
        })
        expect(response).toEqual({ error: null })
      })

      it('should return error on failed password reset', async () => {
        const mockError: Partial<AuthError> = {
          message: 'Email not found',
          status: 404
        }

        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: mockError })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        const response = await result.current.resetPassword('nonexistent@example.com')

        expect(response).toEqual({ error: mockError })
      })

      it('should use correct redirect URL', async () => {
        mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null })

        // Change window.location.origin
        Object.defineProperty(window, 'location', {
          value: {
            origin: 'https://myapp.com'
          },
          writable: true
        })

        const { result } = renderHook(() => useAuth(), {
          wrapper: AuthProvider
        })

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        await result.current.resetPassword('user@example.com')

        expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
          redirectTo: 'https://myapp.com/auth/reset-password'
        })
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete authentication flow', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })
      mockAuth.signInWithPassword.mockResolvedValue({ error: null })
      mockAuth.signOut.mockResolvedValue({ error: null })

      let authStateChangeCallback: any

      mockAuth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateChangeCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      // Initial state
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)

      // Sign in
      await result.current.signIn('test@example.com', 'password123')

      // Simulate successful sign in
      const mockSession: Partial<Session> = {
        access_token: 'token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        } as User
      }

      await act(async () => {
        authStateChangeCallback('SIGNED_IN', mockSession)
      })

      expect(result.current.user).toEqual(mockSession.user)
      expect(result.current.session).toEqual(mockSession)

      // Sign out
      await result.current.signOut()

      // Simulate successful sign out
      await act(async () => {
        authStateChangeCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should handle session recovery on page refresh', async () => {
      const existingSession: Partial<Session> = {
        access_token: 'existing-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          created_at: '2023-01-01T00:00:00Z',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated'
        } as User
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: existingSession } })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(existingSession.user)
      expect(result.current.session).toEqual(existingSession)
    })

    it('should handle multiple rapid auth state changes', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      let authStateChangeCallback: any

      mockAuth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateChangeCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const session1: Partial<Session> = {
        access_token: 'token1',
        user: { id: 'user-1', email: 'user1@example.com' } as User
      }

      const session2: Partial<Session> = {
        access_token: 'token2',
        user: { id: 'user-2', email: 'user2@example.com' } as User
      }

      // Rapid state changes
      await act(async () => {
        authStateChangeCallback('SIGNED_IN', session1)
        authStateChangeCallback('SIGNED_OUT', null)
        authStateChangeCallback('SIGNED_IN', session2)
      })

      expect(result.current.user).toEqual(session2.user)
      expect(result.current.session).toEqual(session2)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle getSession errors gracefully', async () => {
      mockAuth.getSession.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      // Should not crash and should eventually set loading to false
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 1000 })

      expect(result.current.user).toBe(null)
      expect(result.current.session).toBe(null)
    })

    it('should handle auth state change errors gracefully', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: null } })

      let authStateChangeCallback: any

      mockAuth.onAuthStateChange.mockImplementation((callback: any) => {
        authStateChangeCallback = callback
        return { data: { subscription: mockSubscription } }
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate error in auth state change callback
      await act(async () => {
        try {
          authStateChangeCallback('TOKEN_REFRESHED', null)
        } catch (error) {
          // Should handle gracefully
        }
      })

      expect(result.current.loading).toBe(false)
    })
  })
})