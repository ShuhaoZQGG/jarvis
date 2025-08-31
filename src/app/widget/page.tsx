'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatWidget from './ChatWidget'

function WidgetContent() {
  const searchParams = useSearchParams()
  const botId = searchParams.get('botId') || ''
  // These params could be used for future customization
  // const primaryColor = searchParams.get('primaryColor') || '#0ea5e9'
  // const position = (searchParams.get('position') || 'bottom-right') as 'bottom-right' | 'bottom-left'
  // const greeting = searchParams.get('greeting') || 'Hi! How can I help you today?'

  return (
    <div style={{ background: 'transparent' }}>
      <ChatWidget botId={botId} />
    </div>
  )
}

export default function WidgetPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WidgetContent />
    </Suspense>
  )
}