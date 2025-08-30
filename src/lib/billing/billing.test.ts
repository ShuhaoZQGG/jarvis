import { BillingService } from './billing'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')

describe('BillingService', () => {
  let billingService: BillingService
  let mockStripe: jest.Mocked<Stripe>
  let mockDbService: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockStripe = {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn()
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
        list: jest.fn()
      },
      checkout: {
        sessions: {
          create: jest.fn(),
          retrieve: jest.fn()
        }
      },
      billingPortal: {
        sessions: {
          create: jest.fn()
        }
      },
      prices: {
        list: jest.fn()
      },
      products: {
        list: jest.fn()
      },
      invoices: {
        list: jest.fn()
      },
      paymentMethods: {
        list: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn()
      },
      webhookEndpoints: {
        create: jest.fn()
      },
      webhooks: {
        constructEvent: jest.fn()
      }
    } as any

    mockDbService = {
      getWorkspace: jest.fn(),
      updateWorkspace: jest.fn(),
      createSubscription: jest.fn(),
      updateSubscription: jest.fn(),
      getSubscription: jest.fn(),
      cancelSubscription: jest.fn()
    }

    ;(Stripe as unknown as jest.Mock).mockImplementation(() => mockStripe)
    
    billingService = new BillingService('test-stripe-key', mockDbService)
  })

  describe('createCustomer', () => {
    it('should create a Stripe customer', async () => {
      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        metadata: { workspace_id: 'ws-123' }
      }

      mockStripe.customers.create.mockResolvedValue(mockCustomer as any)

      const customer = await billingService.createCustomer({
        email: 'test@example.com',
        name: 'Test User',
        workspaceId: 'ws-123'
      })

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          workspace_id: 'ws-123'
        }
      })
      expect(customer).toEqual(mockCustomer)
    })
  })

  describe('createCheckoutSession', () => {
    it('should create a checkout session', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test'
      }

      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession as any)

      const session = await billingService.createCheckoutSession({
        workspaceId: 'ws-123',
        customerId: 'cus_123',
        priceId: 'price_123',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel'
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
        line_items: [{
          price: 'price_123',
          quantity: 1
        }],
        mode: 'subscription',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
        metadata: {
          workspace_id: 'ws-123'
        }
      })
      expect(session).toEqual(mockSession)
    })
  })

  describe('createSubscription', () => {
    it('should create a subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        customer: 'cus_123',
        items: {
          data: [{
            price: { id: 'price_123' }
          }]
        },
        status: 'active'
      }

      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription as any)
      mockDbService.createSubscription.mockResolvedValue({ id: 'db-sub-123' })

      const subscription = await billingService.createSubscription({
        customerId: 'cus_123',
        priceId: 'price_123',
        workspaceId: 'ws-123'
      })

      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        items: [{ price: 'price_123' }],
        metadata: {
          workspace_id: 'ws-123'
        }
      })
      expect(mockDbService.createSubscription).toHaveBeenCalledWith({
        workspace_id: 'ws-123',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        stripe_price_id: 'price_123',
        status: 'active'
      })
      expect(subscription).toEqual(mockSubscription)
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel a subscription', async () => {
      const mockCancelledSub = {
        id: 'sub_123',
        status: 'canceled'
      }

      mockStripe.subscriptions.cancel.mockResolvedValue(mockCancelledSub as any)
      mockDbService.cancelSubscription.mockResolvedValue({ id: 'db-sub-123' })

      const result = await billingService.cancelSubscription('sub_123')

      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
      expect(mockDbService.cancelSubscription).toHaveBeenCalledWith('sub_123')
      expect(result).toEqual(mockCancelledSub)
    })
  })

  describe('getSubscriptionStatus', () => {
    it('should get subscription status', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: 1234567890,
        items: {
          data: [{
            price: {
              id: 'price_123',
              product: 'prod_123'
            }
          }]
        }
      }

      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription as any)

      const status = await billingService.getSubscriptionStatus('sub_123')

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
      expect(status).toEqual({
        subscriptionId: 'sub_123',
        status: 'active',
        currentPeriodEnd: new Date(1234567890 * 1000),
        priceId: 'price_123',
        productId: 'prod_123'
      })
    })
  })

  describe('handleWebhook', () => {
    it('should handle subscription updated webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            status: 'active',
            metadata: {
              workspace_id: 'ws-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDbService.updateSubscription.mockResolvedValue({ id: 'db-sub-123' })

      await billingService.handleWebhook('raw-body', 'signature')

      expect(mockDbService.updateSubscription).toHaveBeenCalledWith('sub_123', {
        status: 'active'
      })
    })

    it('should handle subscription deleted webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            metadata: {
              workspace_id: 'ws-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDbService.cancelSubscription.mockResolvedValue({ id: 'db-sub-123' })

      await billingService.handleWebhook('raw-body', 'signature')

      expect(mockDbService.cancelSubscription).toHaveBeenCalledWith('sub_123')
    })

    it('should handle checkout session completed webhook', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            subscription: 'sub_123',
            customer: 'cus_123',
            metadata: {
              workspace_id: 'ws-123'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent as any)
      mockDbService.createSubscription.mockResolvedValue({ id: 'db-sub-123' })

      const mockSubscription = {
        id: 'sub_123',
        items: {
          data: [{
            price: { id: 'price_123' }
          }]
        },
        status: 'active'
      }
      mockStripe.subscriptions.retrieve.mockResolvedValue(mockSubscription as any)

      await billingService.handleWebhook('raw-body', 'signature')

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
      expect(mockDbService.createSubscription).toHaveBeenCalledWith({
        workspace_id: 'ws-123',
        stripe_subscription_id: 'sub_123',
        stripe_customer_id: 'cus_123',
        stripe_price_id: 'price_123',
        status: 'active'
      })
    })
  })

  describe('createBillingPortalSession', () => {
    it('should create a billing portal session', async () => {
      const mockSession = {
        id: 'bps_123',
        url: 'https://billing.stripe.com/test'
      }

      mockStripe.billingPortal.sessions.create.mockResolvedValue(mockSession as any)

      const session = await billingService.createBillingPortalSession({
        customerId: 'cus_123',
        returnUrl: 'http://localhost:3000/dashboard'
      })

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'http://localhost:3000/dashboard'
      })
      expect(session).toEqual(mockSession)
    })
  })

  describe('getProducts', () => {
    it('should list available products with prices', async () => {
      const mockProducts = {
        data: [{
          id: 'prod_123',
          name: 'Pro Plan',
          description: 'Professional features',
          metadata: { features: 'unlimited_bots,priority_support' }
        }]
      }

      const mockPrices = {
        data: [{
          id: 'price_123',
          product: 'prod_123',
          unit_amount: 2900,
          currency: 'usd',
          recurring: {
            interval: 'month'
          }
        }]
      }

      mockStripe.products.list.mockResolvedValue(mockProducts as any)
      mockStripe.prices.list.mockResolvedValue(mockPrices as any)

      const products = await billingService.getProducts()

      expect(mockStripe.products.list).toHaveBeenCalledWith({ active: true })
      expect(mockStripe.prices.list).toHaveBeenCalledWith({ active: true })
      expect(products).toEqual([{
        id: 'prod_123',
        name: 'Pro Plan',
        description: 'Professional features',
        metadata: { features: 'unlimited_bots,priority_support' },
        prices: [{
          id: 'price_123',
          amount: 2900,
          currency: 'usd',
          interval: 'month'
        }]
      }])
    })
  })
})