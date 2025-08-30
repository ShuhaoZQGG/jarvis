import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, AuthContext } from '@/lib/auth/middleware'
import { BillingService } from '@/lib/billing/billing'

const CheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export const POST = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { workspace, dbService } = context
    
    // Parse and validate request body
    const body = await request.json()
    const validationResult = CheckoutSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    const { priceId, successUrl, cancelUrl } = validationResult.data

    // Initialize billing service
    const billingService = new BillingService(
      process.env.STRIPE_SECRET_KEY!,
      dbService,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    // Get or create Stripe customer
    let customerId = workspace.stripe_customer_id
    
    if (!customerId) {
      // Create new customer
      const customer = await billingService.createCustomer({
        email: context.user!.email!,
        workspaceId: workspace.id
      })
      customerId = customer.id
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await billingService.createCheckoutSession({
      workspaceId: workspace.id,
      customerId,
      priceId,
      successUrl: successUrl || `${baseUrl}/dashboard/billing/success`,
      cancelUrl: cancelUrl || `${baseUrl}/dashboard/billing`
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
})