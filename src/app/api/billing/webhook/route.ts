import { NextRequest, NextResponse } from 'next/server'
import { BillingService } from '@/lib/billing/billing'
import { DatabaseService } from '@/lib/database/database'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Initialize services
    const dbService = new DatabaseService(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const billingService = new BillingService(
      process.env.STRIPE_SECRET_KEY!,
      dbService,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    // Handle webhook
    await billingService.handleWebhook(rawBody, signature)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Stripe from retrying
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200 }
    )
  }
}