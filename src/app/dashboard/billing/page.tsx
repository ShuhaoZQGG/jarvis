'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CreditCard, Loader2, Check, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
  priceId: string
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses and personal websites',
    price: 29,
    currency: 'USD',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    features: [
      '1 Chatbot',
      '1,000 messages/month',
      '10 pages scraped',
      'Basic customization',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For growing businesses with multiple websites',
    price: 99,
    currency: 'USD',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
    popular: true,
    features: [
      '5 Chatbots',
      '10,000 messages/month',
      '100 pages scraped',
      'Advanced customization',
      'Priority support',
      'Analytics dashboard',
      'Remove branding'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited power for large organizations',
    price: 299,
    currency: 'USD',
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    features: [
      'Unlimited Chatbots',
      'Unlimited messages',
      'Unlimited pages',
      'Full customization',
      'Dedicated support',
      'Advanced analytics',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
]

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  useEffect(() => {
    // Get workspace ID from local storage or context
    const storedWorkspaceId = localStorage.getItem('currentWorkspaceId')
    if (storedWorkspaceId) {
      setWorkspaceId(storedWorkspaceId)
      fetchCurrentPlan(storedWorkspaceId)
    }
  }, [])

  const fetchCurrentPlan = async (wsId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${wsId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.subscription?.status === 'active') {
          setCurrentPlan(data.subscription.price_id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch current plan:', err)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!workspaceId) {
      setError('Please select a workspace first')
      return
    }

    setLoading(priceId)
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Workspace-Id': workspaceId
        },
        body: JSON.stringify({ priceId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    if (!workspaceId) {
      setError('Please select a workspace first')
      return
    }

    setLoading('portal')
    setError(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'X-Workspace-Id': workspaceId
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to open billing portal')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Choose the perfect plan for your business</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {currentPlan && (
        <div className="mb-6">
          <Button
            onClick={handleManageBilling}
            disabled={loading === 'portal'}
            variant="outline"
            className="gap-2"
          >
            {loading === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage Billing
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.priceId
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="secondary">Current Plan</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  disabled={loading !== null || isCurrentPlan}
                  onClick={() => handleSubscribe(plan.priceId)}
                >
                  {loading === plan.priceId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm text-gray-600">
        <p>All plans include SSL encryption, 99.9% uptime guarantee, and GDPR compliance.</p>
        <p className="mt-2">Need a custom plan? <a href="mailto:sales@jarvis.ai" className="text-primary hover:underline">Contact our sales team</a></p>
      </div>
    </div>
  )
}