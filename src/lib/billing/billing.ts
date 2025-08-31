import Stripe from 'stripe'
import { DatabaseService } from '../database/database'

export interface CreateCustomerParams {
  email: string
  name?: string
  workspaceId: string
}

export interface CreateCheckoutSessionParams {
  workspaceId: string
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  workspaceId: string
  trialDays?: number
}

export interface SubscriptionStatus {
  subscriptionId: string
  status: string
  currentPeriodEnd: Date
  priceId: string
  productId: string
}

export interface BillingPortalParams {
  customerId: string
  returnUrl: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  metadata: Record<string, string>
  prices: Array<{
    id: string
    amount: number
    currency: string
    interval: string | null
  }>
}

export class BillingService {
  private stripe: Stripe
  private dbService: DatabaseService
  private webhookSecret: string

  constructor(
    stripeSecretKey: string,
    dbService: DatabaseService,
    webhookSecret?: string
  ) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil'
    })
    this.dbService = dbService
    this.webhookSecret = webhookSecret || process.env.STRIPE_WEBHOOK_SECRET || ''
  }

  /**
   * Create a Stripe customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        workspace_id: params.workspaceId
      }
    })

    // Store customer ID in database
    // TODO: Implement updateWorkspace in DatabaseService
    // await this.dbService.updateWorkspace(params.workspaceId, {
    //   stripe_customer_id: customer.id
    // })

    return customer
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: params.priceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        workspace_id: params.workspaceId
      }
    })

    return session
  }

  /**
   * Create a subscription directly (when payment method exists)
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      ...(params.trialDays && { trial_period_days: params.trialDays }),
      metadata: {
        workspace_id: params.workspaceId
      }
    })

    // Store subscription in database
    await this.dbService.createSubscription({
      workspace_id: params.workspaceId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: params.customerId,
      stripe_price_id: params.priceId,
      status: subscription.status
    })

    return subscription
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
    
    const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId
      }]
    })

    // Update database
    // TODO: Implement updateSubscription in DatabaseService
    // await this.dbService.updateSubscription(subscriptionId, {
    //   stripe_price_id: newPriceId,
    //   status: updatedSubscription.status
    // })

    return updatedSubscription
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId)
    
    // Update database
    await this.dbService.cancelSubscription(subscriptionId)

    return subscription
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
    
    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      priceId: subscription.items.data[0].price.id,
      productId: subscription.items.data[0].price.product as string
    }
  }

  /**
   * Create billing portal session
   */
  async createBillingPortalSession(params: BillingPortalParams): Promise<Stripe.BillingPortal.Session> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl
    })

    return session
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret
      )
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`)
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription && session.metadata?.workspace_id) {
          // Retrieve subscription details
          const subscription = await this.stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          // Store subscription in database
          await this.dbService.createSubscription({
            workspace_id: session.metadata.workspace_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await this.dbService.updateSubscription(subscription.id, {
          status: subscription.status
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await this.dbService.cancelSubscription(subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Log successful payment
        console.log(`Payment succeeded for invoice ${invoice.id}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Handle failed payment
        console.error(`Payment failed for invoice ${invoice.id}`)
        // Could send notification to customer
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  /**
   * Get available products and prices
   */
  async getProducts(): Promise<Product[]> {
    const [products, prices] = await Promise.all([
      this.stripe.products.list({ active: true }),
      this.stripe.prices.list({ active: true })
    ])

    const productsWithPrices = products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      metadata: product.metadata,
      prices: prices.data
        .filter(price => price.product === product.id)
        .map(price => ({
          id: price.id,
          amount: price.unit_amount || 0,
          currency: price.currency,
          interval: price.recurring?.interval || null
        }))
    }))

    return productsWithPrices
  }

  /**
   * Get customer's invoices
   */
  async getInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const invoices = await this.stripe.invoices.list({
      customer: customerId,
      limit
    })

    return invoices.data
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    return paymentMethods.data
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.attach(
      paymentMethodId,
      { customer: customerId }
    )

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return paymentMethod
  }

  /**
   * Get usage for metered billing
   */
  async reportUsage(
    subscriptionItemId: string,
    quantity: number,
    timestamp?: number
  ): Promise<any> {
    // TODO: Update to use new Stripe API method for usage records
    // The createUsageRecord method has been changed in newer Stripe versions
    console.warn('reportUsage not implemented - Stripe API method needs update')
    return { id: 'placeholder', quantity, timestamp }
  }
}