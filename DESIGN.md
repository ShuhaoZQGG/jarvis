# Jarvis AI Chatbot - UI/UX Design Specifications

## Executive Summary
Complete UI/UX design for MVP chatbot platform focusing on rapid bot creation, seamless integration, and optimal user experience. Design emphasizes simplicity, performance, and accessibility.

## User Journeys

### 1. First-Time User Onboarding
```
Landing → Value Discovery → Sign Up → Bot Creation (URL + Name) → Training Progress → Embed Code → Test Success
```
**Goal**: From landing to working chatbot in <60 seconds

### 2. Returning User - Bot Management  
```
Login → Dashboard Overview → Select Bot → Configure/Analytics → Optimize → Save Changes
```
**Goal**: Efficient bot management and optimization

### 3. End User - Website Visitor
```
Notice Widget → Click to Open → Type Question → Receive Answer → Quick Actions/Convert
```
**Goal**: Instant, contextual assistance

## Wireframes & Mockups

### Landing Page
```
┌─────────────────────────────────────┐
│  [Logo] Jarvis    [Dashboard][Login]│
├─────────────────────────────────────┤
│     Your AI Chatbot in Seconds     │
│   Transform your website into an   │
│      intelligent assistant         │
│                                     │
│  [Get Started Free] [Live Demo]    │
├─────────────────────────────────────┤
│        How It Works                │
│  [🌐URL] → [⚡Train] → [💬Embed]    │
├─────────────────────────────────────┤
│         Feature Grid                │
│  [🔒Security] [⚡Speed] [🎨Custom]  │
│  [📱Mobile] [📊Analytics] [🔗API]  │
├─────────────────────────────────────┤
│    Ready to Transform?             │
│    [Start Free Trial →]            │
└─────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────┐
│ Jarvis Dashboard    [Settings][Out] │
├─────────────────────────────────────┤
│ Stats: [2 Bots][1 Active][245 Msgs] │
├─────────────────────────────────────┤
│  Your Bots           [+ Create Bot] │
│ ┌─────────────────────────────────┐ │
│ │ Support Bot                     │ │
│ │ example.com                     │ │
│ │ ● Active | 245 messages         │ │
│ │ [Copy][Settings][Delete]        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Sales Bot                       │ │
│ │ shop.example.com                │ │
│ │ ⚡ Training | 0 messages         │ │
│ │ [Copy][Settings][Delete]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Bot Creation Modal
```
┌─────────────────────────────────────┐
│    Create New Bot          [X]     │
├─────────────────────────────────────┤
│  Bot Name                          │
│  [Support Bot_______________]      │
│                                     │
│  Website URL                       │
│  [🌐 https://example.com____]      │
│                                     │
│  [Cancel]    [Create Bot →]        │
└─────────────────────────────────────┘
```

### Chat Widget States
```
Collapsed:        Expanded:
  ┌──┐           ┌────────────────┐
  │💬│           │ Chat with us ✕ │
  └──┘           ├────────────────┤
                 │ Hi! How can I  │
                 │ help today?    │
                 │                │
                 │ • Book Demo    │
                 │ • Get Pricing  │
                 │ • Contact Us   │
                 │                │
                 │ [Type msg...▸] │
                 └────────────────┘
```

## Responsive Design

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+

### Mobile Adaptations
- **Navigation**: Hamburger menu
- **Dashboard**: Single column layout
- **Chat Widget**: Full-width (90vw) bottom sheet
- **Forms**: Stacked inputs, 44px touch targets
- **Tables**: Card view for bot list

### Desktop Features
- **Sidebar**: Persistent navigation
- **Chat Widget**: 384px width
- **Multi-column**: Grid layouts
- **Hover States**: Enhanced interactions

## Accessibility (WCAG 2.1 AA)

### Color Contrast
- **Text**: 4.5:1 minimum ratio
- **UI Components**: 3:1 minimum
- **Focus Indicators**: 2px solid outline

### Keyboard Navigation
- **Tab Order**: Logical flow
- **Skip Links**: "Skip to content"
- **Escape Key**: Closes modals/widget
- **Arrow Keys**: Navigate lists

### Screen Reader Support
- **ARIA Labels**: All interactive elements
- **Live Regions**: Chat messages
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: Informational images

## Component Library

### Design Tokens
```css
--primary: #0ea5e9;
--primary-hover: #0284c7;
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
--text-primary: #111827;
--text-secondary: #6b7280;
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
--border: #e5e7eb;
--radius: 0.5rem;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
```

### Typography
- **Font**: Inter (system-ui fallback)
- **Headings**: 600-700 weight
- **Body**: 400 weight, 1.5 line-height
- **Code**: Mono for embed snippets

### Animations
- **Transitions**: 200ms ease-out
- **Widget Open**: Slide-up + fade
- **Loading**: Pulse dots
- **Hover**: Scale 1.05

## Widget Variants

### 1. Chat Bubble (Default)
- **Position**: Bottom-right/left
- **Size**: 56px collapsed
- **Expand**: 384px × 500px

### 2. Sidebar
- **Position**: Right edge
- **Width**: 320px
- **Trigger**: Tab or button

### 3. Modal
- **Trigger**: Exit intent/time
- **Size**: 500px × 600px
- **Backdrop**: Semi-transparent

### 4. Inline
- **Embed**: In page content
- **Height**: 400px minimum
- **Width**: Responsive

## Performance Specifications

### Widget Loading
- **Bundle Size**: <50KB gzipped
- **Async Load**: Non-blocking
- **CDN**: Edge caching
- **First Paint**: <100ms

### Dashboard Performance
- **LCP**: <2.5s
- **FID**: <100ms  
- **CLS**: <0.1
- **Code Splitting**: Route-based

## Framework Stack

### Core Application
- **Next.js 14**: App Router (existing)
- **Tailwind CSS**: Utility styling (existing)
- **Radix UI**: Accessible components
- **Framer Motion**: Animations (existing)
- **React Hook Form**: Form handling
- **SWR/TanStack Query**: Data fetching

### Widget Technology
- **Preact**: Smaller bundle size
- **Shadow DOM**: Style isolation
- **PostMessage**: Cross-origin communication
- **LocalStorage**: User preferences

## Design Constraints for Development

1. **Widget Independence**: Must work on any website without conflicts
2. **Theme Customization**: CSS variables for brand colors
3. **Mobile-First**: Progressive enhancement approach
4. **Performance Budget**: <3s initial load time
5. **Browser Support**: Chrome/Safari/Firefox/Edge (latest 2 versions)
6. **Accessibility**: WCAG 2.1 AA compliance required

## Priority Implementation Order

1. **Phase 1**: Core chat functionality + basic dashboard
2. **Phase 2**: Widget customization + embed code
3. **Phase 3**: Analytics + conversation history
4. **Phase 4**: Quick actions + suggested questions
5. **Phase 5**: Advanced triggers + integrations