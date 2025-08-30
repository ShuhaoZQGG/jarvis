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