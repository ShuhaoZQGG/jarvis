import '@testing-library/jest-dom'
import 'openai/shims/node'

// Add TextEncoder/TextDecoder polyfills for JSDOM
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Import test setup BEFORE mocking Next.js
import './src/test/setup'

// Mock NextResponse for tests - must come after test setup
const { NextResponse: ActualNextResponse } = require('next/server')

// Override NextResponse.json to work with our mock Response
ActualNextResponse.json = function(data, init) {
  const response = new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {})
    }
  })
  
  // Ensure json method returns the original data
  response.json = async () => data
  
  return response
}

// Mock Next.js navigation globally
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
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
  const React = require('react')
  return ({ children, href }) => {
    return React.createElement('a', { href }, children)
  }
})