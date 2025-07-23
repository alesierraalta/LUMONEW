import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  authFlowManager,
  AuthFlowManager,
  AuthFlowState,
  AuthFlowEvent,
  authFlowTestUtils,
  authFlowAssertions,
  AUTH_SCENARIOS
} from '../utils/auth-flow-testing'
import {
  TEST_USERS,
  TEST_ROLES,
  createTestUser,
  sessionUtils
} from '../utils/auth-test-utils'
import { testIsolation } from '../utils/test-isolation'

describe('Authentication Flow Testing Utilities', () => {
  beforeEach(async () => {
    // Reset auth flow manager before each test
    authFlowManager.reset()
  })

  afterEach(async () => {
    // Reset auth flow manager
    authFlowManager.reset()
  })

  describe('AuthFlowManager', () => {
    it('should create and manage authentication flows', async () => {
      const flowId = 'test-flow-1'
      const manager = new AuthFlowManager()

      // Start flow
      await manager.startFlow(flowId)
      expect(manager.getFlowSteps(flowId)).toHaveLength(1)

      // Simulate login
      const loginStep = await manager.simulateLogin(
        flowId,
        { email: 'test@example.com', password: 'password' },
        TEST_USERS.USER
      )

      expect(loginStep.event).toBe(AuthFlowEvent.LOGIN_SUCCESS)
      expect(loginStep.state).toBe(AuthFlowState.AUTHENTICATED)
      expect(loginStep.user).toEqual(TEST_USERS.USER)
      expect(loginStep.session).toBeDefined()

      // End flow
      const steps = await manager.endFlow(flowId)
      expect(steps).toHaveLength(2) // Start + Login
    })

    it('should handle failed login attempts', async () => {
      const flowId = 'failed-login-flow'
      const manager = new AuthFlowManager()

      await manager.startFlow(flowId)

      const loginStep = await manager.simulateLogin(
        flowId,
        { email: 'invalid@example.com', password: 'wrongpassword' },
        undefined,
        false // shouldSucceed = false
      )

      expect(loginStep.event).toBe(AuthFlowEvent.LOGIN_FAILURE)
      expect(loginStep.state).toBe(AuthFlowState.ERROR)
      expect(loginStep.error).toBeDefined()
      expect(loginStep.error?.message).toBe('Invalid credentials')
    })

    it('should simulate logout flow', async () => {
      const flowId = 'logout-flow'
      const manager = new AuthFlowManager()

      await manager.startFlow(flowId)

      // Login first
      await manager.simulateLogin(
        flowId,
        { email: 'test@example.com', password: 'password' },
        TEST_USERS.USER
      )

      // Then logout
      const logoutStep = await manager.simulateLogout(flowId)

      expect(logoutStep.event).toBe(AuthFlowEvent.LOGOUT_SUCCESS)
      expect(logoutStep.state).toBe(AuthFlowState.UNAUTHENTICATED)
      expect(logoutStep.user).toBeNull()
      expect(logoutStep.session).toBeNull()
      expect(manager.getMockContext()).toBeNull()
    })

    it('should handle role switching', async () => {
      const flowId = 'role-switch-flow'
      const manager = new AuthFlowManager()

      await manager.startFlow(flowId)

      // Login as regular user
      await manager.simulateLogin(
        flowId,
        { email: 'user@example.com', password: 'password' },
        TEST_USERS.USER
      )

      // Switch to admin role
      const switchStep = await manager.simulateRoleSwitch(
        flowId,
        TEST_USERS.USER,
        TEST_USERS.ADMIN
      )

      expect(switchStep.event).toBe(AuthFlowEvent.LOGIN_SUCCESS)
      expect(switchStep.state).toBe(AuthFlowState.AUTHENTICATED)
      expect(switchStep.user?.role).toBe(TEST_ROLES.ADMIN)
      expect(switchStep.metadata?.roleSwitched).toBe(true)
      expect(switchStep.metadata?.previousRole).toBe(TEST_ROLES.USER)
      expect(switchStep.metadata?.newRole).toBe(TEST_ROLES.ADMIN)

      // Verify mock context updated
      const mockContext = manager.getMockContext()
      expect(mockContext?.isAdmin).toBe(true)
      expect(mockContext?.user?.user_metadata.role).toBe(TEST_ROLES.ADMIN)
    })

    it('should simulate session expiration', async () => {
      const flowId = 'session-expiration-flow'
      const manager = new AuthFlowManager()

      await manager.startFlow(flowId)

      const expirationStep = await manager.simulateSessionExpiration(
        flowId,
        TEST_USERS.USER
      )

      expect(expirationStep.event).toBe(AuthFlowEvent.SESSION_EXPIRED)
      expect(expirationStep.state).toBe(AuthFlowState.SESSION_EXPIRED)
      expect(expirationStep.session).toBeDefined()
      expect(sessionUtils.isSessionValid(expirationStep.session!)).toBe(false)
    })

    it('should handle permission checks', async () => {
      const flowId = 'permission-check-flow'
      const manager = new AuthFlowManager()

      await manager.startFlow(flowId)

      const permissionStep = await manager.simulatePermissionCheck(
        flowId,
        TEST_USERS.ADMIN,
        'admin'
      )

      expect(permissionStep.event).toBe(AuthFlowEvent.PERMISSION_CHECK)
      expect(permissionStep.state).toBe(AuthFlowState.AUTHENTICATED)
      expect(permissionStep.metadata?.permission).toBe('admin')
      expect(permissionStep.metadata?.hasPermission).toBe(true)
      expect(permissionStep.metadata?.userPermissions).toContain('admin')
    })

    it('should track event listeners', async () => {
      const manager = new AuthFlowManager()
      const loginEvents: any[] = []
      const logoutEvents: any[] = []

      // Register event listeners
      manager.on(AuthFlowEvent.LOGIN_SUCCESS, (step) => {
        loginEvents.push(step)
      })

      manager.on(AuthFlowEvent.LOGOUT_SUCCESS, (step) => {
        logoutEvents.push(step)
      })

      const flowId = 'event-tracking-flow'
      await manager.startFlow(flowId)

      // Simulate login
      await manager.simulateLogin(
        flowId,
        { email: 'test@example.com', password: 'password' },
        TEST_USERS.USER
      )

      // Simulate logout
      await manager.simulateLogout(flowId)

      expect(loginEvents).toHaveLength(1)
      expect(logoutEvents).toHaveLength(1)
      expect(loginEvents[0].event).toBe(AuthFlowEvent.LOGIN_SUCCESS)
      expect(logoutEvents[0].event).toBe(AuthFlowEvent.LOGOUT_SUCCESS)
    })
  })

  describe('Pre-built Scenarios', () => {
    it('should execute simple login scenario', async () => {
      const steps = await authFlowManager.executeScenario('simple-login')

      expect(steps).toHaveLength(2) // Start + Login
      authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.AUTHENTICATED)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
    })

    it('should execute admin login with permissions scenario', async () => {
      const steps = await authFlowManager.executeScenario('admin-login-permissions')

      expect(steps.length).toBeGreaterThan(2)
      authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.AUTHENTICATED)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.PERMISSION_CHECK)

      // Find the permission check step
      const permissionStep = steps.find(step => step.event === AuthFlowEvent.PERMISSION_CHECK)
      expect(permissionStep).toBeDefined()
      authFlowAssertions.assertUserHasPermission(permissionStep!, 'admin')
    })

    it('should execute role switching scenario', async () => {
      const steps = await authFlowManager.executeScenario('role-switching')

      // The scenario executes successfully with at least one step
      expect(steps.length).toBeGreaterThanOrEqual(1)
      
      // Should contain login success event from the scenario execution
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      
      // Verify the scenario completed successfully
      authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.AUTHENTICATED)
    })

    it('should execute session expiration scenario', async () => {
      const steps = await authFlowManager.executeScenario('session-expiration')

      expect(steps.length).toBeGreaterThan(1)
      authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.SESSION_EXPIRED)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.SESSION_EXPIRED)

      // Find the session expiration step
      const expirationStep = steps.find(step => step.event === AuthFlowEvent.SESSION_EXPIRED)
      expect(expirationStep).toBeDefined()
      expect(expirationStep!.session).toBeDefined()
      expect(sessionUtils.isSessionValid(expirationStep!.session!)).toBe(false)
    })

    it('should execute multi-user workflow scenario', async () => {
      const steps = await authFlowManager.executeScenario('multi-user-workflow')

      // The scenario executes successfully with at least one step
      expect(steps.length).toBeGreaterThanOrEqual(1)
      
      // Should contain login success event from the scenario execution
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      
      // Verify the scenario completed successfully
      authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.AUTHENTICATED)
    })
  })

  describe('Authentication Flow Test Utils', () => {
    it('should test login flow with isolation', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.MANAGER, true)

      expect(steps.length).toBeGreaterThan(0)
      const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)
      expect(loginStep).toBeDefined()
      expect(loginStep!.user?.role).toBe(TEST_ROLES.MANAGER)
      authFlowAssertions.assertSessionValid(loginStep!)
    })

    it('should test failed login flow', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.USER, false)

      expect(steps.length).toBeGreaterThan(0)
      const failureStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_FAILURE)
      expect(failureStep).toBeDefined()
      expect(failureStep!.error).toBeDefined()
    })

    it('should test logout flow', async () => {
      const steps = await authFlowTestUtils.testLogoutFlow(TEST_USERS.USER)

      expect(steps.length).toBeGreaterThanOrEqual(2)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGOUT_SUCCESS)

      const logoutStep = steps.find(step => step.event === AuthFlowEvent.LOGOUT_SUCCESS)
      expect(logoutStep!.user).toBeNull()
      expect(logoutStep!.session).toBeNull()
    })

    it('should test role switching', async () => {
      const steps = await authFlowTestUtils.testRoleSwitching(
        TEST_USERS.USER,
        TEST_USERS.ADMIN
      )

      expect(steps.length).toBeGreaterThanOrEqual(2)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)

      // Should have role switch in metadata
      const switchStep = steps.find(step => step.metadata?.roleSwitched)
      expect(switchStep).toBeDefined()
      expect(switchStep!.metadata?.previousRole).toBe(TEST_ROLES.USER)
      expect(switchStep!.metadata?.newRole).toBe(TEST_ROLES.ADMIN)
    })

    it('should test permission validation', async () => {
      const permissions = ['read', 'write', 'admin']
      const steps = await authFlowTestUtils.testPermissionValidation(
        TEST_USERS.ADMIN,
        permissions
      )

      expect(steps.length).toBeGreaterThan(permissions.length)
      
      // Should have permission check steps for each permission
      const permissionSteps = steps.filter(step => step.event === AuthFlowEvent.PERMISSION_CHECK)
      expect(permissionSteps).toHaveLength(permissions.length)

      // All permissions should be granted for admin
      permissionSteps.forEach(step => {
        expect(step.metadata?.hasPermission).toBe(true)
      })
    })

    it('should test session expiration', async () => {
      const steps = await authFlowTestUtils.testSessionExpiration(TEST_USERS.USER)

      expect(steps.length).toBeGreaterThanOrEqual(2)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.SESSION_EXPIRED)

      const expirationStep = steps.find(step => step.event === AuthFlowEvent.SESSION_EXPIRED)
      expect(expirationStep!.session).toBeDefined()
      expect(sessionUtils.isSessionValid(expirationStep!.session!)).toBe(false)
    })

    it('should create and execute custom scenario', async () => {
      const customScenario = authFlowTestUtils.createCustomScenario(
        'custom-test-scenario',
        'Custom Test Scenario',
        'A custom scenario for testing',
        [
          {
            event: AuthFlowEvent.LOGIN_START,
            state: AuthFlowState.LOADING,
            user: TEST_USERS.VIEWER
          },
          {
            event: AuthFlowEvent.PERMISSION_CHECK,
            state: AuthFlowState.AUTHENTICATED,
            user: TEST_USERS.VIEWER,
            metadata: { permission: 'read' }
          }
        ],
        AuthFlowState.AUTHENTICATED
      )

      expect(customScenario.id).toBe('custom-test-scenario')
      expect(customScenario.steps).toHaveLength(2)

      const steps = await authFlowTestUtils.executeScenario('custom-test-scenario')
      expect(steps.length).toBeGreaterThan(0)
    })
  })

  describe('Authentication Flow Assertions', () => {
    it('should validate flow success', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.USER)
      
      expect(() => {
        authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.AUTHENTICATED)
      }).not.toThrow()

      expect(() => {
        authFlowAssertions.assertFlowSuccess(steps, AuthFlowState.ERROR)
      }).toThrow('Expected final state error, got authenticated')
    })

    it('should validate user permissions', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.ADMIN)
      const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)!

      expect(() => {
        authFlowAssertions.assertUserHasPermission(loginStep, 'admin')
      }).not.toThrow()

      expect(() => {
        authFlowAssertions.assertUserHasPermission(loginStep, 'nonexistent')
      }).toThrow('does not have permission: nonexistent')
    })

    it('should validate user roles', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.MANAGER)
      const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)!

      expect(() => {
        authFlowAssertions.assertUserHasRole(loginStep, TEST_ROLES.MANAGER)
      }).not.toThrow()

      expect(() => {
        authFlowAssertions.assertUserHasRole(loginStep, TEST_ROLES.ADMIN)
      }).toThrow('Expected user role admin, got manager')
    })

    it('should validate session validity', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.USER)
      const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)!

      expect(() => {
        authFlowAssertions.assertSessionValid(loginStep)
      }).not.toThrow()

      // Test with expired session
      const expiredSteps = await authFlowTestUtils.testSessionExpiration(TEST_USERS.USER)
      const expiredStep = expiredSteps.find(step => step.event === AuthFlowEvent.SESSION_EXPIRED)!

      expect(() => {
        authFlowAssertions.assertSessionValid(expiredStep)
      }).toThrow('Session is invalid or expired')
    })

    it('should validate flow contains specific events', async () => {
      const steps = await authFlowTestUtils.testLogoutFlow(TEST_USERS.USER)

      expect(() => {
        authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGIN_SUCCESS)
      }).not.toThrow()

      expect(() => {
        authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.LOGOUT_SUCCESS)
      }).not.toThrow()

      expect(() => {
        authFlowAssertions.assertFlowContainsEvent(steps, AuthFlowEvent.SESSION_EXPIRED)
      }).toThrow('Flow does not contain event: session_expired')
    })

    it('should validate flow duration', async () => {
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.USER)

      // Should not throw for reasonable duration
      expect(() => {
        authFlowAssertions.assertFlowDuration(steps, 10000) // 10 seconds
      }).not.toThrow()

      // Should throw for very short duration - need to ensure steps have duration
      const stepsWithDuration = steps.map(step => ({
        ...step,
        duration: step.duration || 100 // Ensure duration exists
      }))
      
      expect(() => {
        authFlowAssertions.assertFlowDuration(stepsWithDuration, 1) // 1ms
      }).toThrow('Flow duration')
    })
  })

  describe('Integration with Test Isolation', () => {
    it('should work with test isolation framework', async () => {
      const flowId = 'isolation-test-flow'

      const result = await authFlowTestUtils.withAuthFlow(flowId, async (manager) => {
        await manager.simulateLogin(
          flowId,
          { email: 'test@example.com', password: 'password' },
          TEST_USERS.USER
        )

        const mockContext = manager.getMockContext()
        expect(mockContext).toBeDefined()
        expect(mockContext!.user).toBeDefined()

        return 'test-result'
      })

      expect(result).toBe('test-result')
    })

    it('should handle concurrent authentication flows', async () => {
      const promises = Array.from({ length: 3 }, (_, index) =>
        authFlowTestUtils.testLoginFlow(
          createTestUser({
            id: `concurrent-user-${index}`,
            email: `user${index}@example.com`
          }),
          true, // shouldSucceed
          true  // skipIsolation
        )
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      results.forEach((steps, index) => {
        expect(steps.length).toBeGreaterThan(0)
        const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)
        expect(loginStep).toBeDefined()
        expect(loginStep!.user?.email).toBe(`user${index}@example.com`)
      })
    })

    it('should clean up properly after each test', async () => {
      // First flow
      await authFlowTestUtils.testLoginFlow(TEST_USERS.ADMIN)
      
      // Manager should be reset between tests
      expect(authFlowManager.getFlowSteps('any-flow')).toHaveLength(0)
      
      // Second flow should work independently
      const steps = await authFlowTestUtils.testLoginFlow(TEST_USERS.USER)
      expect(steps.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Memory', () => {
    it('should handle multiple rapid authentication flows', async () => {
      const startTime = Date.now()
      const flowCount = 10

      const promises = Array.from({ length: flowCount }, (_, index) =>
        authFlowTestUtils.testLoginFlow(
          createTestUser({ id: `perf-user-${index}` }),
          true, // shouldSucceed
          true  // skipIsolation
        )
      )

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(flowCount)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      // All flows should be successful
      results.forEach(steps => {
        const loginStep = steps.find(step => step.event === AuthFlowEvent.LOGIN_SUCCESS)
        expect(loginStep).toBeDefined()
      })
    })

    it('should not leak memory with repeated flows', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Run multiple flows
      for (let i = 0; i < 20; i++) {
        await authFlowTestUtils.testLoginFlow(TEST_USERS.USER)
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })
})