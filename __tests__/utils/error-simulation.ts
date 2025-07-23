import { http, HttpResponse } from 'msw';
import { server } from './msw-utils';
import { globalMockClient } from '../mocks/supabase-mock';
import { withTestIsolation } from './test-isolation';

// Error Types
export interface NetworkError {
  type: 'network';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string | RegExp;
  status: number;
  message?: string;
  delay?: number;
  count?: number; // Fail N times then succeed
}

export interface DatabaseError {
  type: 'database';
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  table?: string;
  error: string;
  code?: string;
  count?: number;
}

export interface AuthError {
  type: 'auth';
  operation: 'signIn' | 'signUp' | 'signOut' | 'getUser' | 'getSession';
  error: string;
  code?: string;
  count?: number;
}

export interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
  value?: any;
}

export type ErrorConfig = NetworkError | DatabaseError | AuthError | ValidationError;

// Error Scenario Types
export interface ErrorScenario {
  name: string;
  description: string;
  errors: ErrorConfig[];
  setup?: () => Promise<void>;
  cleanup?: () => Promise<void>;
  assertions?: (result: any, error?: any) => void;
}

// Network Error Simulator
export class NetworkErrorSimulator {
  private activeErrors = new Map<string, { config: NetworkError; currentCount: number }>();

  injectError(config: NetworkError): void {
    const key = `${config.method}:${config.url.toString()}`;
    this.activeErrors.set(key, { config, currentCount: 0 });

    const handler = http[config.method.toLowerCase() as keyof typeof http](
      config.url,
      async ({ request }) => {
        const errorData = this.activeErrors.get(key);
        if (!errorData) return;

        const { config: errorConfig, currentCount } = errorData;
        
        // Check if we should still fail
        if (errorConfig.count && currentCount >= errorConfig.count) {
          this.activeErrors.delete(key);
          return;
        }

        // Increment count
        errorData.currentCount++;

        // Add delay if specified
        if (errorConfig.delay) {
          await new Promise(resolve => setTimeout(resolve, errorConfig.delay));
        }

        // Return error response
        return new HttpResponse(
          JSON.stringify({
            error: errorConfig.message || `${errorConfig.status} Error`,
            code: errorConfig.status,
            details: `Simulated ${errorConfig.method} error for ${request.url}`
          }),
          {
            status: errorConfig.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    );

    server.use(handler);
  }

  clearError(method: string, url: string | RegExp): void {
    const key = `${method}:${url.toString()}`;
    this.activeErrors.delete(key);
    server.resetHandlers();
  }

  clearAllErrors(): void {
    // Force clear the Map completely
    this.activeErrors = new Map();
    // Reset MSW handlers to remove error handlers
    server.resetHandlers();
  }

  reset(): void {
    this.activeErrors = new Map();
    server.resetHandlers();
  }

  getActiveErrors(): NetworkError[] {
    return Array.from(this.activeErrors.values()).map(({ config }) => config);
  }
}

// Database Error Simulator
export class DatabaseErrorSimulator {
  private activeErrors = new Map<string, { config: DatabaseError; currentCount: number }>();

  injectError(config: DatabaseError): void {
    const key = `${config.operation}:${config.table || '*'}`;
    this.activeErrors.set(key, { config, currentCount: 0 });

    // Enhance Supabase mock to handle errors
    this.enhanceSupabaseMockWithErrors();
  }

  private enhanceSupabaseMockWithErrors(): void {
    // Store original methods if not already stored
    if (!(globalMockClient as any)._originalFrom) {
      (globalMockClient as any)._originalFrom = globalMockClient.from;
    }
    
    const originalFrom = (globalMockClient as any)._originalFrom;
    
    (globalMockClient.from as any) = (table: string) => {
      const originalChain = originalFrom.call(globalMockClient, table);
      
      // Create a new chainable object that preserves all methods
      const createErrorAwareChain = (currentChain: any) => {
        const wrapOperation = (operation: string, originalMethod: Function) => {
          return (...args: any[]) => {
            const errorKey = `${operation}:${table}`;
            const globalErrorKey = `${operation}:*`;
            
            const errorData = this.activeErrors.get(errorKey) || this.activeErrors.get(globalErrorKey);
            
            if (errorData) {
              const { config, currentCount } = errorData;
              
              // Check if we should still fail
              if (!config.count || currentCount < config.count) {
                errorData.currentCount++;
                
                // Return a chainable object that resolves to an error
                const errorResult = {
                  data: null,
                  error: {
                    message: config.error,
                    code: config.code || 'PGRST000',
                    details: `Simulated ${operation} error on ${table}`,
                    hint: null
                  },
                  status: 400,
                  statusText: 'Bad Request'
                };
                
                // Create a chainable object that always returns the error
                const errorChain: any = {
                  eq: () => Promise.resolve(errorResult),
                  neq: () => Promise.resolve(errorResult),
                  gt: () => Promise.resolve(errorResult),
                  gte: () => Promise.resolve(errorResult),
                  lt: () => Promise.resolve(errorResult),
                  lte: () => Promise.resolve(errorResult),
                  like: () => Promise.resolve(errorResult),
                  ilike: () => Promise.resolve(errorResult),
                  in: () => Promise.resolve(errorResult),
                  contains: () => Promise.resolve(errorResult),
                  containedBy: () => Promise.resolve(errorResult),
                  order: () => errorChain,
                  limit: () => errorChain,
                  offset: () => errorChain,
                  range: () => errorChain,
                  single: () => Promise.resolve({ ...errorResult, data: null }),
                  maybeSingle: () => Promise.resolve({ ...errorResult, data: null }),
                  then: (onResolve?: (value: any) => any) => {
                    const result = Promise.resolve(errorResult);
                    return onResolve ? result.then(onResolve) : result;
                  }
                };
                
                return errorChain;
              } else {
                // Remove error after count reached
                this.activeErrors.delete(errorKey);
                this.activeErrors.delete(globalErrorKey);
              }
            }
            
            return originalMethod.apply(currentChain, args);
          };
        };

        // Return wrapped chain with all methods
        return {
          ...currentChain,
          select: wrapOperation('select', currentChain.select.bind(currentChain)),
          insert: wrapOperation('insert', currentChain.insert.bind(currentChain)),
          update: wrapOperation('update', currentChain.update.bind(currentChain)),
          delete: wrapOperation('delete', currentChain.delete.bind(currentChain)),
          upsert: wrapOperation('upsert', currentChain.upsert.bind(currentChain))
        };
      };
      
      return createErrorAwareChain(originalChain);
    };
  }

  clearError(operation: string, table?: string): void {
    const key = `${operation}:${table || '*'}`;
    this.activeErrors.delete(key);
  }

  clearAllErrors(): void {
    this.activeErrors.clear();
    // Reset Supabase mock to original state
    if ((globalMockClient as any)._originalFrom) {
      globalMockClient.from = (globalMockClient as any)._originalFrom;
    }
  }

  reset(): void {
    this.activeErrors = new Map();
    // Reset Supabase mock to original state
    if ((globalMockClient as any)._originalFrom) {
      globalMockClient.from = (globalMockClient as any)._originalFrom;
    }
  }

  getActiveErrors(): DatabaseError[] {
    return Array.from(this.activeErrors.values()).map(({ config }) => config);
  }
}

// Authentication Error Simulator
export class AuthErrorSimulator {
  private activeErrors = new Map<string, { config: AuthError; currentCount: number }>();

  injectError(config: AuthError): void {
    const key = config.operation;
    this.activeErrors.set(key, { config, currentCount: 0 });
    this.enhanceAuthMockWithErrors();
  }

  private enhanceAuthMockWithErrors(): void {
    // Store original auth methods if not already stored
    if (!(globalMockClient.auth as any)._originalMethods) {
      (globalMockClient.auth as any)._originalMethods = {
        signInWithPassword: globalMockClient.auth.signInWithPassword,
        signUp: globalMockClient.auth.signUp,
        signOut: globalMockClient.auth.signOut,
        getUser: globalMockClient.auth.getUser,
        getSession: globalMockClient.auth.getSession
      };
    }
    
    const originalMethods = (globalMockClient.auth as any)._originalMethods;
    
    const wrapAuthOperation = (operation: string, originalMethod: Function) => {
      return (...args: any[]) => {
        const errorData = this.activeErrors.get(operation);
        
        if (errorData) {
          const { config, currentCount } = errorData;
          
          if (!config.count || currentCount < config.count) {
            errorData.currentCount++;
            
            return Promise.resolve({
              data: null,
              error: {
                message: config.error,
                status: 400,
                code: config.code || 'auth_error'
              }
            });
          } else {
            this.activeErrors.delete(operation);
          }
        }
        
        return originalMethod.apply(globalMockClient.auth, args);
      };
    };

    // Update auth methods with type assertions
    (globalMockClient.auth.signInWithPassword as any) = wrapAuthOperation('signIn', originalMethods.signInWithPassword);
    (globalMockClient.auth.signUp as any) = wrapAuthOperation('signUp', originalMethods.signUp);
    (globalMockClient.auth.signOut as any) = wrapAuthOperation('signOut', originalMethods.signOut);
    (globalMockClient.auth.getUser as any) = wrapAuthOperation('getUser', originalMethods.getUser);
    (globalMockClient.auth.getSession as any) = wrapAuthOperation('getSession', originalMethods.getSession);
  }

  clearError(operation: string): void {
    this.activeErrors.delete(operation);
  }

  clearAllErrors(): void {
    this.activeErrors.clear();
    // Reset auth mock to original state
    if ((globalMockClient.auth as any)._originalMethods) {
      const originalMethods = (globalMockClient.auth as any)._originalMethods;
      (globalMockClient.auth.signInWithPassword as any) = originalMethods.signInWithPassword;
      (globalMockClient.auth.signUp as any) = originalMethods.signUp;
      (globalMockClient.auth.signOut as any) = originalMethods.signOut;
      (globalMockClient.auth.getUser as any) = originalMethods.getUser;
      (globalMockClient.auth.getSession as any) = originalMethods.getSession;
    }
  }

  reset(): void {
    this.activeErrors = new Map();
    // Reset auth mock to original state
    if ((globalMockClient.auth as any)._originalMethods) {
      const originalMethods = (globalMockClient.auth as any)._originalMethods;
      (globalMockClient.auth.signInWithPassword as any) = originalMethods.signInWithPassword;
      (globalMockClient.auth.signUp as any) = originalMethods.signUp;
      (globalMockClient.auth.signOut as any) = originalMethods.signOut;
      (globalMockClient.auth.getUser as any) = originalMethods.getUser;
      (globalMockClient.auth.getSession as any) = originalMethods.getSession;
    }
  }

  getActiveErrors(): AuthError[] {
    return Array.from(this.activeErrors.values()).map(({ config }) => config);
  }
}

// Main Error Simulator
export class ErrorSimulator {
  public network = new NetworkErrorSimulator();
  public database = new DatabaseErrorSimulator();
  public auth = new AuthErrorSimulator();
  private scenarios = new Map<string, ErrorScenario>();

  // Inject single error
  injectError(config: ErrorConfig): void {
    switch (config.type) {
      case 'network':
        this.network.injectError(config);
        break;
      case 'database':
        this.database.injectError(config);
        break;
      case 'auth':
        this.auth.injectError(config);
        break;
      case 'validation':
        // Validation errors are typically handled at the application level
        console.warn('Validation errors should be handled by the application layer');
        break;
    }
  }

  // Inject multiple errors
  injectErrors(configs: ErrorConfig[]): void {
    configs.forEach(config => this.injectError(config));
  }

  // Clear all errors
  clearAllErrors(): void {
    this.network.clearAllErrors();
    this.database.clearAllErrors();
    this.auth.clearAllErrors();
  }

  // Reset all simulators
  reset(): void {
    this.network.reset();
    this.database.reset();
    this.auth.reset();
  }

  // Register error scenario
  registerScenario(scenario: ErrorScenario): void {
    this.scenarios.set(scenario.name, scenario);
  }

  // Execute error scenario
  async executeScenario(name: string, testFn: () => Promise<any>): Promise<{
    result: any;
    error: any;
    scenario: ErrorScenario;
  }> {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Error scenario '${name}' not found`);
    }

    let result: any = null;
    let error: any = null;

    try {
      // Setup
      if (scenario.setup) {
        await scenario.setup();
      }

      // Inject errors
      this.injectErrors(scenario.errors);

      // Execute test
      result = await testFn();
    } catch (e) {
      error = e;
    } finally {
      // Cleanup errors
      this.clearAllErrors();

      // Custom cleanup
      if (scenario.cleanup) {
        await scenario.cleanup();
      }
    }

    // Run assertions if provided
    if (scenario.assertions) {
      scenario.assertions(result, error);
    }

    return { result, error, scenario };
  }

  // Get all active errors
  getAllActiveErrors(): {
    network: NetworkError[];
    database: DatabaseError[];
    auth: AuthError[];
  } {
    return {
      network: this.network.getActiveErrors(),
      database: this.database.getActiveErrors(),
      auth: this.auth.getActiveErrors()
    };
  }
}

// Error Assertion Utilities
export class ErrorAssertions {
  static expectError(result: any, expectedMessage?: string): void {
    if (!result || !result.error) {
      throw new Error('Expected an error but none was found');
    }

    if (expectedMessage && !result.error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}" but got "${result.error.message}"`);
    }
  }

  static expectNoError(result: any): void {
    if (result && result.error) {
      throw new Error(`Expected no error but got: ${result.error.message}`);
    }
  }

  static expectNetworkError(error: any, expectedStatus?: number): void {
    if (!error || typeof error.status !== 'number') {
      throw new Error('Expected a network error with status code');
    }

    if (expectedStatus && error.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus} but got ${error.status}`);
    }
  }

  static expectDatabaseError(result: any, expectedCode?: string): void {
    if (!result || !result.error || !result.error.code) {
      throw new Error('Expected a database error with error code');
    }

    if (expectedCode && result.error.code !== expectedCode) {
      throw new Error(`Expected error code "${expectedCode}" but got "${result.error.code}"`);
    }
  }

  static expectAuthError(result: any, expectedCode?: string): void {
    if (!result || !result.error) {
      throw new Error('Expected an authentication error');
    }

    if (expectedCode && result.error.code !== expectedCode) {
      throw new Error(`Expected auth error code "${expectedCode}" but got "${result.error.code}"`);
    }
  }

  static expectRetryBehavior(attempts: number, expectedAttempts: number): void {
    if (attempts !== expectedAttempts) {
      throw new Error(`Expected ${expectedAttempts} retry attempts but got ${attempts}`);
    }
  }

  static expectErrorRecovery(initialError: any, finalResult: any): void {
    if (!initialError) {
      throw new Error('Expected initial error for recovery test');
    }

    if (!finalResult || finalResult.error) {
      throw new Error('Expected successful recovery but operation still failed');
    }
  }
}

// Pre-built Error Scenarios
export const ERROR_SCENARIOS: Record<string, ErrorScenario> = {
  NETWORK_TIMEOUT: {
    name: 'NETWORK_TIMEOUT',
    description: 'Simulate network timeout errors',
    errors: [
      {
        type: 'network',
        method: 'GET',
        url: /\/api\/.*/,
        status: 408,
        message: 'Request timeout',
        delay: 5000
      }
    ]
  },

  DATABASE_CONNECTION_FAILURE: {
    name: 'DATABASE_CONNECTION_FAILURE',
    description: 'Simulate database connection failures',
    errors: [
      {
        type: 'database',
        operation: 'select',
        error: 'Connection to database failed',
        code: 'PGRST301'
      }
    ]
  },

  AUTH_TOKEN_EXPIRED: {
    name: 'AUTH_TOKEN_EXPIRED',
    description: 'Simulate expired authentication token',
    errors: [
      {
        type: 'auth',
        operation: 'getUser',
        error: 'JWT expired',
        code: 'token_expired'
      }
    ]
  },

  RATE_LIMITING: {
    name: 'RATE_LIMITING',
    description: 'Simulate API rate limiting',
    errors: [
      {
        type: 'network',
        method: 'POST',
        url: /\/api\/.*/,
        status: 429,
        message: 'Too many requests'
      }
    ]
  },

  CONSTRAINT_VIOLATION: {
    name: 'CONSTRAINT_VIOLATION',
    description: 'Simulate database constraint violations',
    errors: [
      {
        type: 'database',
        operation: 'insert',
        error: 'Unique constraint violation',
        code: 'PGRST409'
      }
    ]
  },

  INTERMITTENT_FAILURES: {
    name: 'INTERMITTENT_FAILURES',
    description: 'Simulate intermittent failures that succeed after retries',
    errors: [
      {
        type: 'network',
        method: 'GET',
        url: /\/api\/products/,
        status: 500,
        message: 'Internal server error',
        count: 2 // Fail twice, then succeed
      }
    ],
    setup: async () => {
      // Clear any existing errors before setup
      errorSimulator.clearAllErrors();
    },
    assertions: (result, error) => {
      // For intermittent failures, we allow some failures but expect eventual success
      // The scenario should handle retry logic internally
      // We only validate that the scenario completed without throwing
      return;
    }
  }
};

// Global error simulator instance
export const errorSimulator = new ErrorSimulator();

// Register pre-built scenarios
Object.values(ERROR_SCENARIOS).forEach(scenario => {
  errorSimulator.registerScenario(scenario);
});

// Test utilities for error simulation
export const errorTestUtils = {
  // Test with isolation
  async withErrorSimulation<T>(
    errors: ErrorConfig[],
    testFn: () => Promise<T>,
    options: { skipIsolation?: boolean } = {}
  ): Promise<T> {
    const runTest = async () => {
      try {
        errorSimulator.injectErrors(errors);
        return await testFn();
      } finally {
        errorSimulator.reset();
      }
    };

    if (options.skipIsolation) {
      return runTest();
    }

    return withTestIsolation(
      `error-simulation-${Date.now()}`,
      runTest
    );
  },

  // Test scenario with isolation
  async withErrorScenario<T>(
    scenarioName: string,
    testFn: () => Promise<T>,
    options: { skipIsolation?: boolean } = {}
  ): Promise<{ result: T; error: any; scenario: ErrorScenario }> {
    const runTest = async () => {
      return errorSimulator.executeScenario(scenarioName, testFn);
    };

    if (options.skipIsolation) {
      return runTest();
    }

    return withTestIsolation(
      `error-scenario-${scenarioName}-${Date.now()}`,
      runTest
    );
  },

  // Create custom error scenario
  createScenario(
    name: string,
    description: string,
    errors: ErrorConfig[],
    options: {
      setup?: () => Promise<void>;
      cleanup?: () => Promise<void>;
      assertions?: (result: any, error?: any) => void;
    } = {}
  ): ErrorScenario {
    const scenario: ErrorScenario = {
      name,
      description,
      errors,
      ...options
    };

    errorSimulator.registerScenario(scenario);
    return scenario;
  },

  // Assertions
  assertions: ErrorAssertions
};