'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatWidget from '@/app/widget/ChatWidget'

function WidgetContent() {
  const searchParams = useSearchParams()
  const botId = searchParams.get('botId') || ''
  const primaryColor = searchParams.get('primaryColor') || '#0ea5e9'
  const position = (searchParams.get('position') || 'bottom-right') as 'bottom-right' | 'bottom-left'
  const greeting = searchParams.get('greeting') || 'Hi! How can I help you today?'

  return (
    <div style={{ background: 'transparent' }}>
      <ChatWidget
        botId={botId}
        primaryColor={primaryColor}
        position={position}
        greeting={greeting}
      />
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