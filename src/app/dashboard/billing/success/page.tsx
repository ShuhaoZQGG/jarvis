'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function BillingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    // Verify the session if needed
    const sessionId = searchParams.get('session_id')
    if (sessionId) {
      verifySession(sessionId)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const verifySession = async (sessionId: string) => {
    try {
      // You could verify the session with your backend here
      // For now, we'll just show success
      setLoading(false)
    } catch (err) {
      setError('Failed to verify payment')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <CardTitle>Processing your subscription...</CardTitle>
              <CardDescription>Please wait while we activate your plan</CardDescription>
            </>
          ) : error ? (
            <>
              <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
              <CardDescription>{error}</CardDescription>
            </>
          ) : (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Welcome to Pro! 🎉</CardTitle>
              <CardDescription>
                Your subscription has been activated successfully
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!loading && !error && (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">What's next?</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Create your first AI chatbot</li>
                  <li>• Customize the widget appearance</li>
                  <li>• Add the widget to your website</li>
                  <li>• Monitor conversations in real-time</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => router.push('/dashboard/bots/new')}
                  className="w-full gap-2"
                >
                  Create Your First Bot
                  <ArrowRight className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                A confirmation email has been sent to your registered email address
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}