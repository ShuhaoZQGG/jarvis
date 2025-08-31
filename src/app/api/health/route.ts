import 'openai/shims/node'
import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  const checks = {
    status: 'ok' as 'ok' | 'error',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok' as 'ok' | 'error',
      openai: 'checking' as 'ok' | 'error' | 'checking',
      pinecone: 'checking' as 'ok' | 'error' | 'checking',
    },
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV,
  }

  // Check OpenAI connection
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    await openai.models.list()
    checks.services.openai = 'ok'
  } catch (error) {
    checks.services.openai = 'error'
    checks.status = 'error'
    console.error('OpenAI health check failed:', error)
  }

  // Check Pinecone connection
  try {
    const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY })
    await pinecone.describeIndex(env.PINECONE_INDEX_NAME)
    checks.services.pinecone = 'ok'
  } catch (error) {
    checks.services.pinecone = 'error'
    checks.status = 'error'
    console.error('Pinecone health check failed:', error)
  }

  const statusCode = checks.status === 'ok' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}