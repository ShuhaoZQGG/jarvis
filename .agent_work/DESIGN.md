# Jarvis UI/UX Design Specifications

## User Experience Architecture

### User Journeys

#### 1. Website Owner Journey
```
Landing → Sign Up → Dashboard → Add Website → Configure Bot → Deploy → Monitor
```
- **Landing**: Value proposition, demo, pricing
- **Sign Up**: OAuth (Google/GitHub) or email
- **Dashboard**: Overview of all bots, usage metrics
- **Add Website**: URL input, auto-crawl status
- **Configure**: Customize appearance, behavior, knowledge base
- **Deploy**: Copy embed code, test widget
- **Monitor**: Analytics, conversations, performance

#### 2. End User Journey (Chat Widget)
```
Visit Site → See Widget → Initiate Chat → Get Help → Resolve Query
```
- **Discovery**: Unobtrusive bubble with smart triggers
- **Engagement**: Context-aware greeting
- **Interaction**: Natural conversation with rich responses
- **Resolution**: Clear answers with action buttons

#### 3. Admin Journey
```
Dashboard → Select Bot → View Conversations → Train/Improve → Export Data
```
- **Analytics**: Usage patterns, common questions
- **Training**: Add custom responses, improve accuracy
- **Export**: Download conversation logs, insights

## Component Design System

### Dashboard Components

#### Navigation Sidebar
```
- Logo/Brand
- Bots (list view)
- Analytics
- Settings
- Billing
- Documentation
- User Profile
```

#### Bot Card Component
```
┌─────────────────────────┐
│ [Icon] Bot Name         │
│ website.com             │
│ ───────────────────────│
│ 💬 245 conversations   │
│ 📊 98% satisfaction    │
│ ⚡ Active              │
│ [Configure] [Preview]   │
└─────────────────────────┘
```

#### Analytics Dashboard
```
┌──────────────────────────────────┐
│ Conversations  Sessions  Resolved│
│     1,234        567       89%   │
├──────────────────────────────────┤
│ [Chart: Usage over time]         │
├──────────────────────────────────┤
│ Top Questions:                   │
│ • Pricing (45%)                  │
│ • Features (32%)                 │
│ • Support (23%)                  │
└──────────────────────────────────┘
```

### Chat Widget Design

#### Minimized State
```
┌────┐
│ 💬 │ <- Floating bubble
└────┘
```

#### Expanded State
```
┌─────────────────────┐
│ Jarvis Assistant    │
│ ─────────────────── │
│                     │
│ Hi! How can I help? │
│                     │
│ [Suggested Q1]      │
│ [Suggested Q2]      │
│                     │
│ ─────────────────── │
│ Type message...     │
└─────────────────────┘
```

#### Message Types
- **Text**: Simple chat bubbles
- **Rich**: Cards with images, links
- **Actions**: Buttons for quick actions
- **Loading**: Typing indicator with dots

### Configuration Interface

#### Appearance Settings
```
┌─────────────────────────────┐
│ Widget Appearance           │
├─────────────────────────────┤
│ Theme:     [Light ▼]       │
│ Position:  [Bottom Right ▼] │
│ Color:     [#4F46E5]       │
│ Avatar:    [Upload]         │
│                             │
│ Welcome Message:            │
│ [Hi! How can I help today?] │
│                             │
│ [Preview]  [Save Changes]   │
└─────────────────────────────┘
```

#### Knowledge Base Editor
```
┌─────────────────────────────┐
│ Knowledge Base              │
├─────────────────────────────┤
│ Website Pages (245)         │
│ ✓ Crawled automatically     │
│                             │
│ Custom Content:             │
│ [+ Add FAQ]                 │
│ [+ Add Document]            │
│ [+ Add Response]            │
│                             │
│ Excluded Pages:             │
│ /admin/*                    │
│ /private/*                  │
└─────────────────────────────┘
```

## Responsive Design

### Mobile Dashboard (< 768px)
- Collapsible sidebar → hamburger menu
- Stack bot cards vertically
- Simplified analytics (key metrics only)
- Full-width forms

### Mobile Widget
- Full-screen chat when expanded
- Larger touch targets (min 44px)
- Simplified input with native keyboard
- Swipe down to minimize

### Tablet (768px - 1024px)
- Two-column layout for bot grid
- Sidebar visible but narrower
- Responsive charts

### Desktop (> 1024px)
- Three-column bot grid
- Full sidebar always visible
- Side-by-side preview in configuration

## Visual Design System

### Typography
- **Headings**: Inter/SF Pro (system font stack)
- **Body**: Inter/system-ui
- **Code**: Fira Code/monospace
- **Sizes**: 14px base, 1.5 line height

### Color Palette
```
Primary:    #4F46E5 (Indigo)
Secondary:  #10B981 (Emerald)
Error:      #EF4444 (Red)
Warning:    #F59E0B (Amber)
Success:    #10B981 (Green)
Neutral:    #6B7280 (Gray)
Background: #FFFFFF / #111827 (dark)
```

### Spacing System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64

### Component States
- Default, Hover, Active, Focus, Disabled
- Focus rings for accessibility
- Smooth transitions (200ms ease)

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: ARIA labels and live regions
- **Focus Management**: Visible focus indicators

### Widget Accessibility
- Announce widget presence to screen readers
- Keyboard shortcut to open (Ctrl+Shift+C)
- Tab navigation through messages
- Escape key to close

### Form Accessibility
- Clear labels for all inputs
- Error messages associated with fields
- Required field indicators
- Helpful placeholder text

## Performance Considerations

### Loading States
```
Initial Load → Skeleton → Content
```
- Skeleton screens for dashboard
- Progressive loading for analytics
- Optimistic UI for chat messages

### Widget Performance
- Lazy load chat widget (< 30KB initial)
- Code splitting for widget features
- CDN delivery for static assets
- WebSocket for real-time chat

## Interaction Patterns

### Micro-interactions
- Button hover effects
- Message send animation
- Typing indicators
- Success confirmations
- Error shake animations

### Feedback Mechanisms
- Toast notifications for actions
- Progress bars for crawling
- Loading spinners for async ops
- Success/error states clearly indicated

## Dark Mode Support

### Automatic Detection
- Respect system preferences
- Manual toggle in settings
- Persist user choice

### Dark Theme Adjustments
- Inverted color scheme
- Adjusted contrast ratios
- Muted highlights
- Dark code syntax themes

## Integration Points

### Embed Options
1. **Chat Bubble**: Floating widget
2. **Inline Frame**: Embedded in page
3. **Sidebar**: Slide-out panel
4. **Modal**: Popup dialog
5. **Full Page**: Dedicated support page

### Platform-Specific
- **WordPress**: Native plugin UI
- **Shopify**: App bridge integration
- **React/Vue/Angular**: NPM components
- **No-code**: Webflow/Bubble widgets

## Error Handling

### User-Friendly Messages
- "Oops! Something went wrong" → "Unable to send message. Please try again."
- Network errors → "Connection lost. Reconnecting..."
- Rate limits → "You're chatting fast! Please wait a moment."

### Graceful Degradation
- Offline mode with cached responses
- Fallback to email contact form
- Manual refresh options
- Retry mechanisms

## Success Metrics

### UX KPIs
- Time to first response < 2s
- Widget load time < 500ms
- Dashboard load time < 1s
- Mobile responsiveness 100%
- Accessibility score > 95

### Engagement Metrics
- Widget open rate > 5%
- Conversation completion > 70%
- User satisfaction > 90%
- Return visitor rate > 40%

## Frontend Framework Recommendations

### Dashboard Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Radix UI + Tailwind CSS
- **State**: Zustand for client, React Query for server
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts or Tremor
- **Animation**: Framer Motion

### Widget Stack
- **Build**: Preact (smaller bundle)
- **Styles**: CSS-in-JS (Emotion)
- **Communication**: PostMessage API
- **Storage**: IndexedDB for offline

### Component Library Structure
```
components/
├── ui/           # Base components
├── dashboard/    # Dashboard specific
├── widget/       # Widget components
├── shared/       # Cross-platform
└── icons/        # SVG icons
```

## Design Constraints for Development

### Bundle Size Limits
- Widget: < 50KB gzipped
- Dashboard: < 200KB initial
- Lazy load non-critical

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

### Performance Budget
- FCP < 1.5s
- TTI < 3.5s
- CLS < 0.1
- FID < 100ms