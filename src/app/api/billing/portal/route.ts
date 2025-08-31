import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthContext } from '@/lib/auth/middleware'
import { BillingService } from '@/lib/billing/billing'

export const POST = withAuth(async (request: NextRequest, context: AuthContext) => {
  try {
    const { workspace, dbService } = context
    
    if (!workspace.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      )
    }

    // Initialize billing service
    const billingService = new BillingService(
      process.env.STRIPE_SECRET_KEY!,
      dbService,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    // Create billing portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await billingService.createBillingPortalSession({
      customerId: workspace.stripe_customer_id,
      returnUrl: `${baseUrl}/dashboard/billing`
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
})