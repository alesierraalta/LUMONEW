import { vi } from 'vitest'
import { User, Session, AuthError } from '@supabase/supabase-js'
import {
  TestUser,
  TEST_USERS,
  TEST_ROLES,
  TestRole,
  createTestUser,
  createMockSession,
  testUserToSupabaseUser,
  authStateUtils,
  sessionUtils,
  multiUserUtils,
  AuthContextType
} from './auth-test-utils'
import { testIsolation, withTestIsolation, TestTransaction } from './test-isolation'

// Authentication flow states
export enum AuthFlowState {
  INITIAL = 'initial',
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error',
  SESSION_EXPIRED = 'session_expired',
  ROLE_SWITCHING = 'role_switching',
  LOGGING_OUT = 'logging_out'
}

// Authentication flow events
export enum AuthFlowEvent {
  LOGIN_START = 'login_start',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT_START = 'logout_start',
  LOGOUT_SUCCESS = 'logout_success',
  LOGOUT_FAILURE = 'logout_failure',
  SESSION_REFRESH = 'session_refresh',
  SESSION_EXPIRED = 'session_expired',
  ROLE_SWITCH = 'role_switch',
  PERMISSION_CHECK = 'permission_check',
  PROFILE_UPDATE = 'profile_update'
}

// Authentication flow step
export interface AuthFlowStep {
  id: string
  event: AuthFlowEvent
  state: AuthFlowState
  user?: TestUser | null
  session?: Session | null
  error?: AuthError | null
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

// Authentication flow scenario
export interface AuthFlowScenario {
  id: string
  name: string
  description: string
  steps: AuthFlowStep[]
  expectedOutcome: AuthFlowState
  cleanup?: () => Promise<void>
}

// Authentication flow manager
export class AuthFlowManager {
  private scenarios: Map<string, AuthFlowScenario> = new Map()
  private activeFlows: Map<string, AuthFlowStep[]> = new Map()
  private mockAuthContext: AuthContextType | null = null
  private eventListeners: Map<AuthFlowEvent, ((step: AuthFlowStep) => void)[]> = new Map()

  constructor() {
    this.initializeEventListeners()
  }

  private initializeEventListeners(): void {
    // Initialize event listener arrays
    Object.values(AuthFlowEvent).forEach(event => {
      this.eventListeners.set(event, [])
    })
  }

  // Register event listener
  on(event: AuthFlowEvent, listener: (step: AuthFlowStep) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  // Remove event listener
  off(event: AuthFlowEvent, listener: (step: AuthFlowStep) => void): void {
    const listeners = this.eventListeners.get(event) || []
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  // Emit event
  private emit(step: AuthFlowStep): void {
    const listeners = this.eventListeners.get(step.event) || []
    listeners.forEach(listener => listener(step))
  }

  // Create authentication flow step
  private createStep(
    flowId: string,
    event: AuthFlowEvent,
    state: AuthFlowState,
    options: Partial<AuthFlowStep> = {}
  ): AuthFlowStep {
    const step: AuthFlowStep = {
      id: `${flowId}-${event}-${Date.now()}`,
      event,
      state,
      timestamp: Date.now(),
      ...options
    }

    // Add to active flow
    const flow = this.activeFlows.get(flowId) || []
    flow.push(step)
    this.activeFlows.set(flowId, flow)

    // Emit event
    this.emit(step)

    return step
  }

  // Start authentication flow
  async startFlow(flowId: string): Promise<void> {
    this.activeFlows.set(flowId, [])
    this.createStep(flowId, AuthFlowEvent.LOGIN_START, AuthFlowState.LOADING)
  }

  // End authentication flow
  async endFlow(flowId: string): Promise<AuthFlowStep[]> {
    const flow = this.activeFlows.get(flowId) || []
    this.activeFlows.delete(flowId)
    return flow
  }

  // Simulate login flow
  async simulateLogin(
    flowId: string,
    credentials: { email: string; password: string },
    user?: TestUser,
    shouldSucceed: boolean = true
  ): Promise<AuthFlowStep> {
    const startTime = Date.now()

    if (shouldSucceed && user) {
      // Simulate successful login
      const session = createMockSession(user)
      const supabaseUser = testUserToSupabaseUser(user)

      const step = this.createStep(flowId, AuthFlowEvent.LOGIN_SUCCESS, AuthFlowState.AUTHENTICATED, {
        user,
        session,
        duration: Date.now() - startTime,
        metadata: { credentials: { email: credentials.email } }
      })

      // Update mock context
      this.mockAuthContext = {
        user: supabaseUser,
        session,
        loading: false,
        signIn: vi.fn().mockResolvedValue({ data: { user: supabaseUser, session }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: supabaseUser, session }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
        hasPermission: vi.fn().mockImplementation((permission: string) => 
          user.permissions.includes(permission)
        ),
        hasRole: vi.fn().mockImplementation((role: string) => user.role === role),
        isAdmin: user.role === TEST_ROLES.ADMIN,
        isManager: user.role === TEST_ROLES.MANAGER
      }

      return step
    } else {
      // Simulate failed login
      const error: AuthError = {
        message: 'Invalid credentials',
        status: 401
      } as AuthError

      return this.createStep(flowId, AuthFlowEvent.LOGIN_FAILURE, AuthFlowState.ERROR, {
        error,
        duration: Date.now() - startTime,
        metadata: { credentials: { email: credentials.email } }
      })
    }
  }

  // Simulate logout flow
  async simulateLogout(flowId: string): Promise<AuthFlowStep> {
    const startTime = Date.now()

    this.createStep(flowId, AuthFlowEvent.LOGOUT_START, AuthFlowState.LOGGING_OUT)

    // Simulate logout delay
    await new Promise(resolve => setTimeout(resolve, 100))

    const step = this.createStep(flowId, AuthFlowEvent.LOGOUT_SUCCESS, AuthFlowState.UNAUTHENTICATED, {
      user: null,
      session: null,
      duration: Date.now() - startTime
    })

    // Clear mock context
    this.mockAuthContext = null

    return step
  }

  // Simulate role switching
  async simulateRoleSwitch(
    flowId: string,
    fromUser: TestUser,
    toUser: TestUser
  ): Promise<AuthFlowStep> {
    const startTime = Date.now()

    this.createStep(flowId, AuthFlowEvent.ROLE_SWITCH, AuthFlowState.ROLE_SWITCHING, {
      user: fromUser,
      metadata: { switchingTo: toUser.role }
    })

    // Simulate role switch delay
    await new Promise(resolve => setTimeout(resolve, 200))

    const session = createMockSession(toUser)
    const supabaseUser = testUserToSupabaseUser(toUser)

    const step = this.createStep(flowId, AuthFlowEvent.LOGIN_SUCCESS, AuthFlowState.AUTHENTICATED, {
      user: toUser,
      session,
      duration: Date.now() - startTime,
      metadata: { 
        roleSwitched: true,
        previousRole: fromUser.role,
        newRole: toUser.role
      }
    })

    // Update mock context
    if (this.mockAuthContext) {
      this.mockAuthContext.user = supabaseUser
      this.mockAuthContext.session = session
      this.mockAuthContext.isAdmin = toUser.role === TEST_ROLES.ADMIN
      this.mockAuthContext.isManager = toUser.role === TEST_ROLES.MANAGER
    }

    return step
  }

  // Simulate session expiration
  async simulateSessionExpiration(flowId: string, user: TestUser): Promise<AuthFlowStep> {
    const expiredSession = sessionUtils.createExpiredSession(user)

    return this.createStep(flowId, AuthFlowEvent.SESSION_EXPIRED, AuthFlowState.SESSION_EXPIRED, {
      user,
      session: expiredSession,
      metadata: { reason: 'token_expired' }
    })
  }

  // Simulate permission check
  async simulatePermissionCheck(
    flowId: string,
    user: TestUser,
    permission: string
  ): Promise<AuthFlowStep> {
    const hasPermission = user.permissions.includes(permission)

    return this.createStep(flowId, AuthFlowEvent.PERMISSION_CHECK, AuthFlowState.AUTHENTICATED, {
      user,
      metadata: {
        permission,
        hasPermission,
        userPermissions: user.permissions
      }
    })
  }

  // Get current mock context
  getMockContext(): AuthContextType | null {
    return this.mockAuthContext
  }

  // Get flow steps
  getFlowSteps(flowId: string): AuthFlowStep[] {
    return this.activeFlows.get(flowId) || []
  }

  // Register scenario
  registerScenario(scenario: AuthFlowScenario): void {
    this.scenarios.set(scenario.id, scenario)
  }

  // Check if scenario exists
  hasScenario(scenarioId: string): boolean {
    return this.scenarios.has(scenarioId)
  }

  // Get all registered scenario IDs
  getRegisteredScenarioIds(): string[] {
    return Array.from(this.scenarios.keys())
  }

  // Execute scenario
  async executeScenario(scenarioId: string): Promise<AuthFlowStep[]> {
    // Ensure scenarios are registered
    ensureScenariosRegistered(this)
    
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found. Available scenarios: ${this.getRegisteredScenarioIds().join(', ')}`)
    }

    await this.startFlow(scenario.id)

    // Execute scenario steps
    let currentUser: TestUser | undefined
    
    for (const step of scenario.steps) {
      // Simulate the step based on its event type
      switch (step.event) {
        case AuthFlowEvent.LOGIN_START:
          currentUser = step.user || TEST_USERS.USER
          await this.simulateLogin(scenario.id,
            { email: currentUser.email, password: 'password' },
            currentUser
          )
          break
        case AuthFlowEvent.LOGOUT_START:
          await this.simulateLogout(scenario.id)
          currentUser = undefined
          break
        case AuthFlowEvent.ROLE_SWITCH:
          if (currentUser && step.metadata?.switchingTo) {
            const toUser = createTestUser({ role: step.metadata.switchingTo })
            await this.simulateRoleSwitch(scenario.id, currentUser, toUser)
            currentUser = toUser
          }
          break
        case AuthFlowEvent.SESSION_EXPIRED:
          if (currentUser) {
            await this.simulateSessionExpiration(scenario.id, currentUser)
          }
          break
        case AuthFlowEvent.PERMISSION_CHECK:
          if (currentUser && step.metadata?.permission) {
            await this.simulatePermissionCheck(scenario.id, currentUser, step.metadata.permission)
          }
          break
      }
    }

    const executedSteps = await this.endFlow(scenario.id)

    // Execute cleanup if provided
    if (scenario.cleanup) {
      await scenario.cleanup()
    }

    return executedSteps
  }

  // Reset manager state (preserve scenarios)
  reset(): void {
    this.activeFlows.clear()
    // Don't clear scenarios - they should persist
    this.mockAuthContext = null
    this.initializeEventListeners()
  }

  // Force re-register scenarios (for testing)
  reregisterScenarios(): void {
    Object.values(AUTH_SCENARIOS).forEach(scenario => {
      this.registerScenario(scenario)
    })
  }
}

// Global auth flow manager instance
export const authFlowManager = new AuthFlowManager()

// Pre-built authentication scenarios
export const AUTH_SCENARIOS = {
  SIMPLE_LOGIN: {
    id: 'simple-login',
    name: 'Simple Login Flow',
    description: 'Basic login with valid credentials',
    steps: [
      {
        id: 'login-step',
        event: AuthFlowEvent.LOGIN_START,
        state: AuthFlowState.LOADING,
        user: TEST_USERS.USER,
        timestamp: Date.now()
      }
    ],
    expectedOutcome: AuthFlowState.AUTHENTICATED
  } as AuthFlowScenario,

  ADMIN_LOGIN_WITH_PERMISSIONS: {
    id: 'admin-login-permissions',
    name: 'Admin Login with Permission Checks',
    description: 'Admin login followed by permission validation',
    steps: [
      {
        id: 'admin-login',
        event: AuthFlowEvent.LOGIN_START,
        state: AuthFlowState.LOADING,
        user: TEST_USERS.ADMIN,
        timestamp: Date.now()
      },
      {
        id: 'permission-check',
        event: AuthFlowEvent.PERMISSION_CHECK,
        state: AuthFlowState.AUTHENTICATED,
        user: TEST_USERS.ADMIN,
        timestamp: Date.now(),
        metadata: { permission: 'admin' }
      }
    ],
    expectedOutcome: AuthFlowState.AUTHENTICATED
  } as AuthFlowScenario,

  ROLE_SWITCHING_FLOW: {
    id: 'role-switching',
    name: 'Role Switching Flow',
    description: 'User switches from regular user to admin role',
    steps: [
      {
        id: 'initial-login',
        event: AuthFlowEvent.LOGIN_START,
        state: AuthFlowState.LOADING,
        user: TEST_USERS.USER,
        timestamp: Date.now()
      },
      {
        id: 'role-switch',
        event: AuthFlowEvent.ROLE_SWITCH,
        state: AuthFlowState.ROLE_SWITCHING,
        user: TEST_USERS.USER,
        timestamp: Date.now(),
        metadata: { switchingTo: TEST_ROLES.ADMIN }
      }
    ],
    expectedOutcome: AuthFlowState.AUTHENTICATED
  } as AuthFlowScenario,

  SESSION_EXPIRATION_FLOW: {
    id: 'session-expiration',
    name: 'Session Expiration Flow',
    description: 'User session expires and requires re-authentication',
    steps: [
      {
        id: 'login',
        event: AuthFlowEvent.LOGIN_START,
        state: AuthFlowState.LOADING,
        user: TEST_USERS.USER,
        timestamp: Date.now()
      },
      {
        id: 'session-expired',
        event: AuthFlowEvent.SESSION_EXPIRED,
        state: AuthFlowState.SESSION_EXPIRED,
        user: TEST_USERS.USER,
        timestamp: Date.now()
      }
    ],
    expectedOutcome: AuthFlowState.SESSION_EXPIRED
  } as AuthFlowScenario,

  MULTI_USER_WORKFLOW: {
    id: 'multi-user-workflow',
    name: 'Multi-User Workflow',
    description: 'Multiple users with different roles performing actions',
    steps: [
      {
        id: 'admin-login',
        event: AuthFlowEvent.LOGIN_START,
        state: AuthFlowState.LOADING,
        user: TEST_USERS.ADMIN,
        timestamp: Date.now()
      },
      {
        id: 'manager-switch',
        event: AuthFlowEvent.ROLE_SWITCH,
        state: AuthFlowState.ROLE_SWITCHING,
        user: TEST_USERS.ADMIN,
        timestamp: Date.now(),
        metadata: { switchingTo: TEST_ROLES.MANAGER }
      },
      {
        id: 'user-switch',
        event: AuthFlowEvent.ROLE_SWITCH,
        state: AuthFlowState.ROLE_SWITCHING,
        user: TEST_USERS.MANAGER,
        timestamp: Date.now(),
        metadata: { switchingTo: TEST_ROLES.USER }
      }
    ],
    expectedOutcome: AuthFlowState.AUTHENTICATED
  } as AuthFlowScenario
}

// Function to register all pre-built scenarios
const registerPrebuiltScenarios = (manager: AuthFlowManager) => {
  Object.values(AUTH_SCENARIOS).forEach(scenario => {
    manager.registerScenario(scenario)
  })
}

// Register pre-built scenarios on the global manager
registerPrebuiltScenarios(authFlowManager)

// Ensure scenarios are available before execution
const ensureScenariosRegistered = (manager: AuthFlowManager) => {
  // Check if scenarios are registered, if not, register them
  const scenarioIds = Object.values(AUTH_SCENARIOS).map(s => s.id)
  const missingScenarios = scenarioIds.filter(id => !manager.hasScenario(id))
  
  if (missingScenarios.length > 0) {
    registerPrebuiltScenarios(manager)
  }
}

// Authentication flow testing utilities
export const authFlowTestUtils = {
  // Execute authentication flow with isolation
  withAuthFlow: async <T>(
    flowId: string,
    testFn: (flowManager: AuthFlowManager) => Promise<T>
  ): Promise<T> => {
    return withTestIsolation(`auth-flow-${flowId}`, async () => {
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        const result = await testFn(manager)
        return result
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    })
  },

  // Test login flow
  testLoginFlow: async (
    user: TestUser = TEST_USERS.USER,
    shouldSucceed: boolean = true,
    skipIsolation: boolean = false
  ): Promise<AuthFlowStep[]> => {
    const flowId = `login-test-${Date.now()}`
    
    if (skipIsolation) {
      // Direct execution without isolation for concurrent tests
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        await manager.simulateLogin(
          flowId,
          { email: user.email, password: 'password' },
          user,
          shouldSucceed
        )
        return manager.getFlowSteps(flowId)
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    }
    
    return authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
      await manager.simulateLogin(
        flowId,
        { email: user.email, password: 'password' },
        user,
        shouldSucceed
      )
      return manager.getFlowSteps(flowId)
    })
  },

  // Test logout flow
  testLogoutFlow: async (
    user: TestUser = TEST_USERS.USER,
    skipIsolation: boolean = false
  ): Promise<AuthFlowStep[]> => {
    const flowId = `logout-test-${Date.now()}`
    
    if (skipIsolation) {
      // Direct execution without isolation for concurrent tests
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        // First login
        await manager.simulateLogin(
          flowId,
          { email: user.email, password: 'password' },
          user
        )
        
        // Then logout
        await manager.simulateLogout(flowId)
        
        return manager.getFlowSteps(flowId)
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    }
    
    return authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
      // First login
      await manager.simulateLogin(
        flowId,
        { email: user.email, password: 'password' },
        user
      )
      
      // Then logout
      await manager.simulateLogout(flowId)
      
      return manager.getFlowSteps(flowId)
    })
  },

  // Test role switching
  testRoleSwitching: async (
    fromUser: TestUser,
    toUser: TestUser,
    skipIsolation: boolean = false
  ): Promise<AuthFlowStep[]> => {
    const flowId = `role-switch-test-${Date.now()}`
    
    if (skipIsolation) {
      // Direct execution without isolation for concurrent tests
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        // Login as first user
        await manager.simulateLogin(
          flowId,
          { email: fromUser.email, password: 'password' },
          fromUser
        )
        
        // Switch to second user
        await manager.simulateRoleSwitch(flowId, fromUser, toUser)
        
        return manager.getFlowSteps(flowId)
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    }
    
    return authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
      // Login as first user
      await manager.simulateLogin(
        flowId,
        { email: fromUser.email, password: 'password' },
        fromUser
      )
      
      // Switch to second user
      await manager.simulateRoleSwitch(flowId, fromUser, toUser)
      
      return manager.getFlowSteps(flowId)
    })
  },

  // Test permission validation
  testPermissionValidation: async (
    user: TestUser,
    permissions: string[],
    skipIsolation: boolean = false
  ): Promise<AuthFlowStep[]> => {
    const flowId = `permission-test-${Date.now()}`
    
    if (skipIsolation) {
      // Direct execution without isolation for concurrent tests
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        // Login first
        await manager.simulateLogin(
          flowId,
          { email: user.email, password: 'password' },
          user
        )
        
        // Check each permission
        for (const permission of permissions) {
          await manager.simulatePermissionCheck(flowId, user, permission)
        }
        
        return manager.getFlowSteps(flowId)
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    }
    
    return authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
      // Login first
      await manager.simulateLogin(
        flowId,
        { email: user.email, password: 'password' },
        user
      )
      
      // Check each permission
      for (const permission of permissions) {
        await manager.simulatePermissionCheck(flowId, user, permission)
      }
      
      return manager.getFlowSteps(flowId)
    })
  },

  // Test session expiration
  testSessionExpiration: async (
    user: TestUser = TEST_USERS.USER,
    skipIsolation: boolean = false
  ): Promise<AuthFlowStep[]> => {
    const flowId = `session-expiration-test-${Date.now()}`
    
    if (skipIsolation) {
      // Direct execution without isolation for concurrent tests
      const manager = new AuthFlowManager()
      await manager.startFlow(flowId)
      
      try {
        // Login first
        await manager.simulateLogin(
          flowId,
          { email: user.email, password: 'password' },
          user
        )
        
        // Simulate session expiration
        await manager.simulateSessionExpiration(flowId, user)
        
        return manager.getFlowSteps(flowId)
      } finally {
        await manager.endFlow(flowId)
        manager.reset()
      }
    }
    
    return authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
      // Login first
      await manager.simulateLogin(
        flowId,
        { email: user.email, password: 'password' },
        user
      )
      
      // Simulate session expiration
      await manager.simulateSessionExpiration(flowId, user)
      
      return manager.getFlowSteps(flowId)
    })
  },

  // Execute pre-built scenario
  executeScenario: async (scenarioId: string): Promise<AuthFlowStep[]> => {
    return authFlowManager.executeScenario(scenarioId)
  },

  // Create custom scenario
  createCustomScenario: (
    id: string,
    name: string,
    description: string,
    steps: Partial<AuthFlowStep>[],
    expectedOutcome: AuthFlowState
  ): AuthFlowScenario => {
    const scenario: AuthFlowScenario = {
      id,
      name,
      description,
      steps: steps.map((step, index) => ({
        id: `${id}-step-${index}`,
        event: step.event || AuthFlowEvent.LOGIN_START,
        state: step.state || AuthFlowState.LOADING,
        timestamp: step.timestamp || Date.now(),
        ...step
      })) as AuthFlowStep[],
      expectedOutcome
    }
    
    authFlowManager.registerScenario(scenario)
    return scenario
  }
}

// Authentication flow assertions
export const authFlowAssertions = {
  // Assert flow completed successfully
  assertFlowSuccess: (steps: AuthFlowStep[], expectedFinalState: AuthFlowState): void => {
    const lastStep = steps[steps.length - 1]
    if (!lastStep || lastStep.state !== expectedFinalState) {
      throw new Error(`Expected final state ${expectedFinalState}, got ${lastStep?.state}`)
    }
  },

  // Assert user has permission
  assertUserHasPermission: (step: AuthFlowStep, permission: string): void => {
    if (!step.user?.permissions.includes(permission)) {
      throw new Error(`User ${step.user?.email} does not have permission: ${permission}`)
    }
  },

  // Assert user has role
  assertUserHasRole: (step: AuthFlowStep, role: TestRole): void => {
    if (step.user?.role !== role) {
      throw new Error(`Expected user role ${role}, got ${step.user?.role}`)
    }
  },

  // Assert session is valid
  assertSessionValid: (step: AuthFlowStep): void => {
    if (!step.session || !sessionUtils.isSessionValid(step.session)) {
      throw new Error('Session is invalid or expired')
    }
  },

  // Assert flow contains event
  assertFlowContainsEvent: (steps: AuthFlowStep[], event: AuthFlowEvent): void => {
    const hasEvent = steps.some(step => step.event === event)
    if (!hasEvent) {
      throw new Error(`Flow does not contain event: ${event}`)
    }
  },

  // Assert flow duration
  assertFlowDuration: (steps: AuthFlowStep[], maxDurationMs: number): void => {
    const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0)
    if (totalDuration > maxDurationMs) {
      throw new Error(`Flow duration ${totalDuration}ms exceeds maximum ${maxDurationMs}ms`)
    }
  }
}

export default authFlowManager