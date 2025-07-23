import React, { ReactNode, createContext } from 'react'
import { vi } from 'vitest'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { render, RenderOptions } from '@testing-library/react'

// Auth context type (matching the real implementation)
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  // Additional test utilities
  hasPermission?: (permission: string) => boolean
  hasRole?: (role: string) => boolean
  isAdmin?: boolean
  isManager?: boolean
  updateProfile?: (updates: any) => Promise<{ data: { user: User | null }, error: AuthError | null }>
}

// Create test auth context
const TestAuthContext = createContext<AuthContextType | undefined>(undefined)

// Test user roles and permissions
export const TEST_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer'
} as const

export type TestRole = typeof TEST_ROLES[keyof typeof TEST_ROLES]

// Test user factory interface
export interface TestUser {
  id: string
  email: string
  name: string
  role: TestRole
  status: 'active' | 'inactive'
  permissions: string[]
  created_at: string
  updated_at: string
}

// Mock JWT token structure
export interface MockJWTPayload {
  sub: string
  email: string
  role: string
  exp: number
  iat: number
  aud: string
  iss: string
}

// Test user factories
const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => {
  const baseUser: TestUser = {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    name: 'Test User',
    role: TEST_ROLES.USER,
    status: 'active',
    permissions: ['read'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }

  // Set role-based permissions
  switch (baseUser.role) {
    case TEST_ROLES.ADMIN:
      baseUser.permissions = ['read', 'write', 'delete', 'admin', 'manage_users', 'manage_inventory', 'view_analytics']
      break
    case TEST_ROLES.MANAGER:
      baseUser.permissions = ['read', 'write', 'manage_inventory', 'view_analytics']
      break
    case TEST_ROLES.USER:
      baseUser.permissions = ['read', 'write']
      break
    case TEST_ROLES.VIEWER:
      baseUser.permissions = ['read']
      break
  }

  return baseUser
}

// Predefined test users
export const TEST_USERS = {
  ADMIN: createTestUser({
    id: 'admin-user-id',
    email: 'admin@lumo.com',
    name: 'Admin User',
    role: TEST_ROLES.ADMIN
  }),
  MANAGER: createTestUser({
    id: 'manager-user-id',
    email: 'manager@lumo.com',
    name: 'Manager User',
    role: TEST_ROLES.MANAGER
  }),
  USER: createTestUser({
    id: 'regular-user-id',
    email: 'user@lumo.com',
    name: 'Regular User',
    role: TEST_ROLES.USER
  }),
  VIEWER: createTestUser({
    id: 'viewer-user-id',
    email: 'viewer@lumo.com',
    name: 'Viewer User',
    role: TEST_ROLES.VIEWER
  }),
  INACTIVE: createTestUser({
    id: 'inactive-user-id',
    email: 'inactive@lumo.com',
    name: 'Inactive User',
    role: TEST_ROLES.USER,
    status: 'inactive'
  })
}

// Mock JWT token generator
const createMockJWT = (user: TestUser, expiresIn: number = 3600): string => {
  const payload: MockJWTPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000),
    aud: 'authenticated',
    iss: 'supabase'
  }

  // Simple base64 encoding for testing (not secure, just for mocking)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payloadEncoded = btoa(JSON.stringify(payload))
  const signature = btoa('mock-signature')

  return `${header}.${payloadEncoded}.${signature}`
}

// Convert test user to Supabase User
const testUserToSupabaseUser = (testUser: TestUser): User => ({
  id: testUser.id,
  aud: 'authenticated',
  role: 'authenticated',
  email: testUser.email,
  email_confirmed_at: testUser.created_at,
  phone: '',
  confirmed_at: testUser.created_at,
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {
    provider: 'email',
    providers: ['email']
  },
  user_metadata: {
    name: testUser.name,
    role: testUser.role,
    status: testUser.status
  },
  identities: [],
  created_at: testUser.created_at,
  updated_at: testUser.updated_at
})

// Create mock session
const createMockSession = (testUser: TestUser): Session => ({
  access_token: createMockJWT(testUser),
  refresh_token: `refresh-${testUser.id}`,
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: testUserToSupabaseUser(testUser)
})

// Mock authentication context values
const createMockAuthContext = (
  user: TestUser | null = null,
  overrides: Partial<AuthContextType> = {}
): AuthContextType => {
  const session = user ? createMockSession(user) : null
  const supabaseUser = user ? testUserToSupabaseUser(user) : null

  return {
    user: supabaseUser,
    session,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ data: { user: supabaseUser, session }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: supabaseUser, session }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateProfile: vi.fn().mockResolvedValue({ data: { user: supabaseUser }, error: null }),
    hasPermission: vi.fn().mockImplementation((permission: string) => 
      user?.permissions.includes(permission) || false
    ),
    hasRole: vi.fn().mockImplementation((role: string) => user?.role === role),
    isAdmin: user?.role === TEST_ROLES.ADMIN || false,
    isManager: user?.role === TEST_ROLES.MANAGER || false,
    ...overrides
  }
}

// Mock authentication provider component
interface MockAuthProviderProps {
  children: ReactNode
  mockUser?: TestUser | null
  mockLoading?: boolean
  mockError?: Error | null
  contextOverrides?: Partial<AuthContextType>
}

const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  mockUser = null,
  mockLoading = false,
  mockError = null,
  contextOverrides = {}
}) => {
  const mockContext = createMockAuthContext(mockUser, {
    loading: mockLoading,
    ...contextOverrides
  })

  return (
    <TestAuthContext.Provider value={mockContext}>
      {children}
    </TestAuthContext.Provider>
  )
}

// Custom render function with authentication context
interface AuthRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mockUser?: TestUser | null
  mockLoading?: boolean
  mockError?: Error | null
  contextOverrides?: Partial<AuthContextType>
}

const renderWithAuth = (
  ui: React.ReactElement,
  options: AuthRenderOptions = {}
) => {
  const {
    mockUser = null,
    mockLoading = false,
    mockError = null,
    contextOverrides = {},
    ...renderOptions
  } = options

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <MockAuthProvider
      mockUser={mockUser}
      mockLoading={mockLoading}
      mockError={mockError}
      contextOverrides={contextOverrides}
    >
      {children}
    </MockAuthProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Authentication state utilities
export const authStateUtils = {
  // Simulate login process
  simulateLogin: (user: TestUser = TEST_USERS.USER) => {
    const session = createMockSession(user)
    const supabaseUser = testUserToSupabaseUser(user)
    
    return {
      user: supabaseUser,
      session,
      loading: false
    }
  },

  // Simulate logout
  simulateLogout: () => ({
    user: null,
    session: null,
    loading: false
  }),

  // Simulate loading state
  simulateLoading: () => ({
    user: null,
    session: null,
    loading: true
  }),

  // Simulate authentication error
  simulateAuthError: (message: string = 'Authentication failed') => ({
    user: null,
    session: null,
    loading: false,
    error: new Error(message)
  })
}

// Permission testing utilities
export const permissionUtils = {
  // Check if user has specific permission
  hasPermission: (user: TestUser | null, permission: string): boolean => {
    return user?.permissions.includes(permission) || false
  },

  // Check if user has specific role
  hasRole: (user: TestUser | null, role: TestRole): boolean => {
    return user?.role === role
  },

  // Check if user is admin
  isAdmin: (user: TestUser | null): boolean => {
    return user?.role === TEST_ROLES.ADMIN
  },

  // Check if user is manager or above
  isManagerOrAbove: (user: TestUser | null): boolean => {
    return user?.role === TEST_ROLES.ADMIN || user?.role === TEST_ROLES.MANAGER
  },

  // Get user permissions
  getUserPermissions: (user: TestUser | null): string[] => {
    return user?.permissions || []
  }
}

// Route protection testing utilities
export const routeProtectionUtils = {
  // Test protected route access
  canAccessRoute: (user: TestUser | null, requiredPermission: string): boolean => {
    if (!user || user.status !== 'active') return false
    return permissionUtils.hasPermission(user, requiredPermission)
  },

  // Test admin route access
  canAccessAdminRoute: (user: TestUser | null): boolean => {
    return permissionUtils.isAdmin(user) && user?.status === 'active'
  },

  // Test manager route access
  canAccessManagerRoute: (user: TestUser | null): boolean => {
    return permissionUtils.isManagerOrAbove(user) && user?.status === 'active'
  }
}

// Authentication flow testing utilities
export const authFlowUtils = {
  // Mock successful login flow
  mockSuccessfulLogin: (user: TestUser = TEST_USERS.USER) => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: {
        user: testUserToSupabaseUser(user),
        session: createMockSession(user)
      },
      error: null
    })

    return { mockSignIn, user, session: createMockSession(user) }
  },

  // Mock failed login flow
  mockFailedLogin: (errorMessage: string = 'Invalid credentials') => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: errorMessage }
    })

    return { mockSignIn, error: errorMessage }
  },

  // Mock signup flow
  mockSignupFlow: (user: TestUser = TEST_USERS.USER) => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: {
        user: testUserToSupabaseUser(user),
        session: createMockSession(user)
      },
      error: null
    })

    return { mockSignUp, user, session: createMockSession(user) }
  },

  // Mock logout flow
  mockLogoutFlow: () => {
    const mockSignOut = vi.fn().mockResolvedValue({
      error: null
    })

    return { mockSignOut }
  },

  // Mock password reset flow
  mockPasswordResetFlow: () => {
    const mockResetPassword = vi.fn().mockResolvedValue({
      data: {},
      error: null
    })

    return { mockResetPassword }
  }
}

// Session management utilities
export const sessionUtils = {
  // Create expired session
  createExpiredSession: (user: TestUser): Session => ({
    ...createMockSession(user),
    expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    access_token: createMockJWT(user, -3600) // Expired token
  }),

  // Create session expiring soon
  createExpiringSession: (user: TestUser, expiresInSeconds: number = 300): Session => ({
    ...createMockSession(user),
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    access_token: createMockJWT(user, expiresInSeconds)
  }),

  // Check if session is valid
  isSessionValid: (session: Session | null): boolean => {
    if (!session || !session.expires_at) return false
    return session.expires_at > Math.floor(Date.now() / 1000)
  },

  // Get session time remaining
  getSessionTimeRemaining: (session: Session | null): number => {
    if (!session || !session.expires_at) return 0
    return Math.max(0, session.expires_at - Math.floor(Date.now() / 1000))
  }
}

// Multi-user scenario utilities
export const multiUserUtils = {
  // Create multiple test users
  createTestUsers: (count: number, role: TestRole = TEST_ROLES.USER): TestUser[] => {
    return Array.from({ length: count }, (_, index) => 
      createTestUser({
        id: `user-${index + 1}`,
        email: `user${index + 1}@example.com`,
        name: `Test User ${index + 1}`,
        role
      })
    )
  },

  // Create mixed role users
  createMixedRoleUsers: (): TestUser[] => [
    createTestUser({ role: TEST_ROLES.ADMIN, email: 'admin@test.com', name: 'Admin' }),
    createTestUser({ role: TEST_ROLES.MANAGER, email: 'manager@test.com', name: 'Manager' }),
    createTestUser({ role: TEST_ROLES.USER, email: 'user1@test.com', name: 'User 1' }),
    createTestUser({ role: TEST_ROLES.USER, email: 'user2@test.com', name: 'User 2' }),
    createTestUser({ role: TEST_ROLES.VIEWER, email: 'viewer@test.com', name: 'Viewer' })
  ],

  // Switch user context
  switchUser: (newUser: TestUser | null) => {
    return createMockAuthContext(newUser)
  }
}

// Export all utilities
export {
  MockAuthProvider,
  renderWithAuth,
  createMockAuthContext,
  createTestUser,
  createMockSession,
  createMockJWT,
  testUserToSupabaseUser,
  TestAuthContext as AuthContext,
  type AuthContextType
}

export default MockAuthProvider