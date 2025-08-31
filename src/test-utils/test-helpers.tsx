import React, { createContext } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthService } from '@/lib/auth/auth'

// Mock the auth context directly
const AuthContext = createContext<any>(undefined)

interface MockAuthContextValue {
  user: any
  loading: boolean
  authService: any
  signIn: jest.Mock
  signUp: jest.Mock
  signOut: jest.Mock
  refreshUser: jest.Mock
}

export const createMockAuthContext = (overrides?: Partial<MockAuthContextValue>): MockAuthContextValue => ({
  user: null,
  loading: false,
  authService: new AuthService('http://mock.url', 'mock-key'),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  refreshUser: jest.fn(),
  ...overrides,
})

export const MockAuthProvider: React.FC<{ children: React.ReactNode; value?: Partial<MockAuthContextValue> }> = ({ 
  children, 
  value = {} 
}) => {
  const mockValue = createMockAuthContext(value)
  
  return (
    <AuthContext.Provider value={mockValue}>
      {children}
    </AuthContext.Provider>
  )
}

interface AllTheProvidersProps {
  children: React.ReactNode
  authValue?: Partial<MockAuthContextValue>
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children, authValue }) => {
  return (
    <MockAuthProvider value={authValue}>
      {children}
    </MockAuthProvider>
  )
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<MockAuthContextValue>
}

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  const { authValue, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders authValue={authValue}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'