// Setup test environment for Next.js
import { TextEncoder, TextDecoder } from 'util'
import '@testing-library/jest-dom'

// Add TextEncoder/TextDecoder to global
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Mock URL if not available
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL as any
}

// Mock Request/Response for Next.js in test environment
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    private _url: string
    private _method: string
    private _headers: Headers
    private _body: any
    
    constructor(input: string | Request | URL, init?: RequestInit) {
      if (typeof input === 'string') {
        this._url = input
      } else if (input instanceof URL) {
        this._url = input.toString()
      } else if (input instanceof Request) {
        this._url = input.url
        this._method = input.method
        this._headers = new Headers(input.headers)
        this._body = null
        return
      } else {
        this._url = String(input)
      }
      
      this._method = init?.method || 'GET'
      this._headers = new Headers(init?.headers)
      this._body = init?.body
    }
    
    get url(): string {
      return this._url
    }
    
    get method(): string {
      return this._method
    }
    
    get headers(): Headers {
      return this._headers
    }
    
    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body)
      }
      return this._body
    }
    
    async text() {
      if (typeof this._body === 'string') {
        return this._body
      }
      return JSON.stringify(this._body)
    }
    
    clone() {
      return new Request(this._url, {
        method: this._method,
        headers: this._headers,
        body: this._body
      })
    }
  } as any
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    public readonly ok: boolean
    public readonly status: number
    public readonly statusText: string
    public readonly headers: Headers
    private readonly _body: any
    
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this._body = body
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new Headers(init?.headers)
    }
    
    async json() {
      if (typeof this._body === 'string') {
        try {
          return JSON.parse(this._body)
        } catch (e) {
          throw new Error('Failed to parse JSON body')
        }
      }
      return this._body
    }
    
    async text() {
      if (typeof this._body === 'string') {
        return this._body
      }
      return JSON.stringify(this._body)
    }
    
    clone() {
      return new Response(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      })
    }
    
    static json(data: any, init?: ResponseInit) {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {})
        }
      })
      // Make sure the json method works properly
      response.json = async () => data
      return response
    }
  } as any
}

// Mock Headers
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Map<string, string> = new Map()
    
    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else if (init instanceof Headers) {
          init.forEach((value, key) => this.set(key, value))
        } else if (init && typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.set(key, String(value)))
        }
      }
    }
    
    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null
    }
    
    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), String(value))
    }
    
    has(name: string): boolean {
      return this.headers.has(name.toLowerCase())
    }
    
    delete(name: string): void {
      this.headers.delete(name.toLowerCase())
    }
    
    forEach(callback: (value: string, key: string) => void): void {
      this.headers.forEach(callback)
    }
    
    entries() {
      return this.headers.entries()
    }
    
    keys() {
      return this.headers.keys()
    }
    
    values() {
      return this.headers.values()
    }
    
    [Symbol.iterator]() {
      return this.headers.entries()
    }
  } as any
}

// Export empty object to make this a module
export {}