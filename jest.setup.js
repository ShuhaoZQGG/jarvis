import '@testing-library/jest-dom'
import 'openai/shims/node'

// Add TextEncoder/TextDecoder polyfills for JSDOM
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder