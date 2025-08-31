import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockBack = jest.fn()
const mockForward = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
  MockedLink.displayName = 'MockedLink'
  return MockedLink
})

// Mock auth context
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockRefreshUser = jest.fn()
const mockResetPassword = jest.fn()
const mockUpdatePassword = jest.fn()

jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    refreshUser: mockRefreshUser,
    authService: {},
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Create a custom render function that includes providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Export auth mocks for test assertions
export const authMocks = {
  signIn: mockSignIn,
  signUp: mockSignUp,
  signOut: mockSignOut,
  refreshUser: mockRefreshUser,
  resetPassword: mockResetPassword,
  updatePassword: mockUpdatePassword,
}

// Re-export everything
export * from '@testing-library/react'
export { renderWithProviders as render }

// Export router mocks for test assertions
export const routerMocks = {
  push: mockPush,
  replace: mockReplace,
  prefetch: mockPrefetch,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
}