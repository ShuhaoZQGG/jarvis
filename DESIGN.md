# Jarvis MVP - UI/UX Design Specifications

## Executive Summary
AI-powered chatbot builder with comprehensive UI/UX design enabling instant website integration through URL scraping, custom prompts, or manual content. Design prioritizes < 60-second chatbot creation, seamless deployment, and enterprise-grade customization.

## User Journeys

### 1. First-Time User Onboarding
```
Landing → Sign Up (Supabase Auth) → Workspace Creation → Bot Setup Wizard → Data Ingestion → Widget Deployment → Live Testing
```
**Goal**: Complete chatbot deployment in < 60 seconds

### 2. Bot Creation Flow  
```
Dashboard → New Bot → Data Source Selection → Content Processing → Embedding Generation → Widget Customization → Install Code
```
**Goal**: Streamlined multi-source content ingestion

### 3. Enterprise User - Team Management
```
Login → Workspace Selection → Team Invites → Role Assignment → Usage Monitoring → Billing Management
```
**Goal**: Collaborative bot management with usage controls

### 4. End User - Chat Experience
```
Widget Appears → User Initiates → Context-Aware Response → Quick Actions → Feedback → Lead Capture
```
**Goal**: < 2 second response with 95% resolution rate

## Page Layouts & Mockups

### Authentication (Supabase Auth UI)
```
┌─────────────────────────────────────┐
│         Jarvis AI                  │
│    ─────────────────────           │
│                                     │
│    Welcome Back                    │
│                                     │
│    [Continue with Google]          │
│    [Continue with GitHub]          │
│         ── or ──                   │
│    Email                           │
│    [email@example.com_______]      │
│    Password                        │
│    [••••••••••••_____________]     │
│                                     │
│    [Sign In]                       │
│                                     │
│    New user? [Create Account]      │
└─────────────────────────────────────┘
```

### Main Dashboard
```
┌─────────────────────────────────────────────┐
│ [≡] Jarvis     Workspace: Acme Corp    [👤] │
├───────┬─────────────────────────────────────┤
│ 📊    │  Welcome back!                     │
│ Dash  │  ┌──────┬──────┬──────┬──────┐    │
│       │  │ Bots │ Conv │ Msgs │Usage │    │
│ 🤖    │  │  3   │ 124  │ 2.4K │ 45%  │    │
│ Bots  │  └──────┴──────┴──────┴──────┘    │
│       │                                     │
│ 📈    │  Active Bots      [+ Create New]   │
│ Stats │  ┌─────────────────────────────┐   │
│       │  │ Customer Support Bot       │   │
│ ⚙️    │  │ Status: ● Ready            │   │
│ Setup │  │ URL: example.com           │   │
│       │  │ Messages: 1,245            │   │
│ 💳    │  │ [Widget][Train][Analytics] │   │
│ Bill  │  └─────────────────────────────┘   │
│       │  ┌─────────────────────────────┐   │
│ 🔑    │  │ Sales Assistant            │   │
│ API   │  │ Status: ⚡ Training (45%)   │   │
│       │  │ URL: shop.example.com      │   │
│       │  │ Messages: 0                │   │
│       │  │ [Widget][Cancel][Settings] │   │
│       │  └─────────────────────────────┘   │
└───────┴─────────────────────────────────────┘
```

### Bot Creation Wizard (Multi-Step)
```
┌──────────────────────────────────────────────┐
│  Create Your Bot         Step 1/5      [X]  │
├──────────────────────────────────────────────┤
│  ● Basic   ○ Data   ○ Train   ○ Style   ○  │
├──────────────────────────────────────────────┤
│                                              │
│  Bot Name *                                  │
│  [Customer Support Bot_______________]       │
│                                              │
│  Description                                 │
│  [Helps customers with common questions     │
│   about our products and services_____]     │
│                                              │
│  Primary Language                            │
│  [English (US)      ▼]                      │
│                                              │
│  [Back]              [Next: Data Source →]  │
└──────────────────────────────────────────────┘
```

### Data Source Selection
```
┌──────────────────────────────────────────────┐
│  Create Your Bot         Step 2/5      [X]  │
├──────────────────────────────────────────────┤
│  ✓ Basic   ● Data   ○ Train   ○ Style   ○  │
├──────────────────────────────────────────────┤
│                                              │
│  Choose Data Source                          │
│                                              │
│  [🌐 Website]  [📄 Upload]  [✏️ Manual]      │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ Website URLs                         │   │
│  │ [https://example.com____________] [+]│   │
│  │ [https://example.com/docs______] [-]│   │
│  │                                      │   │
│  │ Advanced Options ▼                   │   │
│  │ Crawl Depth: [3 pages ▼]            │   │
│  │ Include: [*.html, *.pdf_______]     │   │
│  │ Exclude: [/admin/*, /private/*]     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [← Back]            [Next: Training →]     │
└──────────────────────────────────────────────┘
```

### Widget Customization Builder
```
┌───────────────────────────────────────────────────┐
│  Customize Widget          Preview        [Save] │
├─────────────────────┬─────────────────────────────┤
│ Appearance          │     [Desktop] [Mobile]      │
│ ┌─────────────────┐ │  ┌─────────────────────┐   │
│ │Theme:           │ │  │   Acme Support      │   │
│ │[● Modern]      │ │  │   ─────────────     │   │
│ │[○ Classic]     │ │  │   Hi! I'm here to   │   │
│ │[○ Minimal]     │ │  │   help. What can I  │   │
│ │                │ │  │   assist you with?  │   │
│ │Primary Color:  │ │  │                     │   │
│ │[#0066FF ■]     │ │  │   • Product info    │   │
│ │                │ │  │   • Pricing         │   │
│ │Position:       │ │  │   • Support         │   │
│ │[Bottom Right ▼]│ │  │                     │   │
│ └─────────────────┘ │  │   [Type message...] │   │
│                     │  └─────────────────────┘   │
│ Behavior            │                             │
│ ┌─────────────────┐ │  Embed Code:                │
│ │Trigger:        │ │  ┌─────────────────────┐   │
│ │[On Page Load ▼]│ │  │<script src="...">  │   │
│ │Delay: [3s]     │ │  │</script>            │   │
│ │Mobile: [✓]     │ │  └─────────────────────┘   │
│ └─────────────────┘ │  [Copy Code]                │
└─────────────────────┴─────────────────────────────┘
```

### Chat Widget Interface
```
Collapsed:           Expanded:
  ┌───┐             ┌──────────────────────┐
  │ 💬│             │ Acme Support    ─ ✕ │
  │ 1 │             ├──────────────────────┤
  └───┘             │ 🤖 Hi! How can I     │
                    │    help you today?   │
                    │                      │
                    │ [Product Info]       │
                    │ [Get Pricing]        │
                    │ [Contact Support]    │
                    │                      │
                    │ 👤 I need help with  │
                    │    my order          │
                    │                      │
                    │ 🤖 I'll help you     │
                    │    with that...      │
                    │    ◦◦◦               │
                    ├──────────────────────┤
                    │ 💬 Type message...   │
                    │              [Send]  │
                    └──────────────────────┘
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

## Analytics Dashboard
```
┌──────────────────────────────────────────────┐
│  Analytics Overview      [Export] [Date ▼]  │
├──────────────────────────────────────────────┤
│  ┌─────────┬─────────┬─────────┬─────────┐  │
│  │Convos   │Users    │Avg Time │Rating   │  │
│  │2,456    │892      │3m 24s   │4.8/5    │  │
│  │↑ 12%    │↑ 8%     │↑ 15s    │↑ 0.2    │  │
│  └─────────┴─────────┴─────────┴─────────┘  │
│                                              │
│  Conversations Over Time                     │
│  ┌──────────────────────────────────────┐   │
│  │     📈 Line Chart                     │   │
│  │     Shows 30-day trend                │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Top Questions                Messages      │
│  ┌──────────────────────────────────────┐   │
│  │ How do I reset password?         245 │   │
│  │ What are your business hours?    189 │   │
│  │ How to track my order?           156 │   │
│  │ Return policy details?           134 │   │
│  │ Contact customer support?        112 │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

## Component Library

### Design Tokens
```css
/* Colors - Aligned with existing project */
--primary: #0066FF;
--primary-hover: #0052CC;
--secondary: #6B7280;
--success: #10B981;
--warning: #F59E0B;
--danger: #EF4444;
--background: #FFFFFF;
--surface: #F9FAFB;
--text-primary: #111827;
--text-secondary: #6B7280;
--border: #E5E7EB;

/* Typography */
--font-sans: Inter, system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', 'SF Mono', monospace;

/* Spacing Scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
```

### Core Components

#### Buttons
- **Primary**: Solid blue (#0066FF), white text, hover darken
- **Secondary**: White bg, gray border, primary text
- **Ghost**: Transparent, no border, subtle hover bg
- **Danger**: Red variant for destructive actions
- **Sizes**: sm (32px), md (40px), lg (48px)
- **States**: Default, hover, active, disabled, loading

#### Forms
- **Input Fields**: 40px height, 8px radius, 1px border
- **Labels**: 14px, 500 weight, 4px bottom margin
- **Error States**: Red border, error icon, helper text
- **Success States**: Green check, positive feedback
- **Textarea**: Auto-resize, min 3 rows

#### Cards
- White background, subtle shadow, 8px radius
- Header section with optional actions
- Body with flexible padding (16-24px)
- Footer for CTAs or metadata

#### Tables
- Sticky header on scroll
- Alternating row backgrounds
- Sortable columns with indicators
- Inline actions on hover
- Responsive card view on mobile

#### Modals
- Backdrop blur effect
- Centered positioning
- Max-width constraints (sm: 400px, md: 600px, lg: 800px)
- Close button and ESC key support
- Focus trap for accessibility

## Widget Variants

### 1. Chat Bubble (Default)
- **Position**: Bottom-right (configurable)
- **Size**: 60px circle when collapsed
- **Expanded**: 380px × 600px (desktop), full-screen (mobile)
- **Animation**: Scale + fade in, bounce on new message

### 2. Sidebar Panel
- **Position**: Right edge docked
- **Width**: 320px fixed
- **Height**: 100vh
- **Trigger**: Tab on edge or API call

### 3. Modal Popup
- **Trigger**: Exit intent, scroll %, time delay
- **Size**: 500px × 600px centered
- **Backdrop**: rgba(0,0,0,0.5) with blur
- **Close**: X button, ESC key, backdrop click

### 4. Inline Embed
- **Container**: 100% width of parent
- **Min Height**: 400px
- **Max Height**: 800px
- **Responsive**: Adapts to container

## Settings Pages

### Workspace Settings
```
┌──────────────────────────────────────────────┐
│  Workspace Settings                   [Save] │
├──────────────────────────────────────────────┤
│  Workspace Name                              │
│  [Acme Corporation___________________]       │
│                                              │
│  Workspace URL                              │
│  jarvis.ai/[acme-corp_______________]       │
│                                              │
│  Team Members                    [+ Invite]  │
│  ┌──────────────────────────────────────┐   │
│  │ john@acme.com          Owner    [▼] │   │
│  │ sarah@acme.com         Admin    [▼] │   │
│  │ mike@acme.com          Member   [▼] │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Billing & Subscription
```
┌──────────────────────────────────────────────┐
│  Billing & Subscription              [Help]  │
├──────────────────────────────────────────────┤
│  Current Plan: Pro                           │
│  ┌──────────────────────────────────────┐   │
│  │ Pro Plan - $99/month                  │   │
│  │ • 10 Bots                             │   │
│  │ • 50,000 messages/month               │   │
│  │ • Advanced analytics                  │   │
│  │ • API access                          │   │
│  │                                        │   │
│  │ Usage This Month:                     │   │
│  │ [████████░░░░░░░] 8,245/50,000       │   │
│  │                                        │   │
│  │ [Upgrade to Enterprise]               │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Payment Method                   [Update]   │
│  •••• •••• •••• 4242 | Expires 12/25       │
│                                              │
│  [Download Invoices]                         │
└──────────────────────────────────────────────┘
```

## Performance Specifications

### Widget Performance
- **Initial Load**: < 100ms (60KB gzipped)
- **Time to Interactive**: < 200ms
- **Message Response**: < 2s (including API)
- **CDN**: Cloudflare edge caching
- **Lazy Loading**: Components load on demand

### Dashboard Performance
- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Code Splitting**: Per-route lazy loading

## Tech Stack Integration

### Frontend Architecture
```
Next.js 14 (App Router)
├── Tailwind CSS (styling)
├── Radix UI (components)
├── Framer Motion (animations)
├── React Hook Form (forms)
├── TanStack Query (data fetching)
└── Zustand (state management)
```

### Widget Architecture
```
Widget Bundle
├── Preact (lightweight React)
├── Shadow DOM (isolation)
├── PostMessage API (communication)
├── IndexedDB (offline support)
└── Service Worker (caching)
```

### Supabase Integration Points
- **Auth**: Magic links, OAuth providers
- **Database**: Real-time subscriptions for chat
- **Storage**: Bot avatars, file uploads
- **Edge Functions**: Chat completion, webhooks
- **Vector Search**: pgvector for embeddings

## Mobile-Specific Design

### Touch Targets
- Minimum 44px × 44px for all interactive elements
- 8px spacing between targets
- Thumb-zone optimization for CTAs

### Gestures
- Swipe down to minimize widget
- Swipe left/right for quick actions
- Pull to refresh conversations
- Long press for context menu

### Responsive Tables
```
Desktop:                Mobile:
│Name │Status│Messages│  ┌─────────────┐
│Bot1 │Ready │1,234   │  │Bot1        │
│Bot2 │Train │567     │  │Ready|1,234 │
                         └─────────────┘
                         ┌─────────────┐
                         │Bot2        │
                         │Train|567   │
                         └─────────────┘
```

## Dark Mode Specifications
```css
/* Dark Theme Tokens */
--dark-background: #0F172A;
--dark-surface: #1E293B;
--dark-text-primary: #F1F5F9;
--dark-text-secondary: #94A3B8;
--dark-border: #334155;
--dark-primary: #3B82F6;
```

## Security & Privacy

### Widget Security
- Content Security Policy headers
- XSS protection via sanitization
- CORS configuration for API calls
- Rate limiting per domain/IP
- JWT token validation

### Data Privacy
- GDPR compliance tools
- Data retention policies
- User consent management
- Export/delete user data
- Audit logging

## Implementation Priorities

### Phase 1: Foundation (Week 1-2)
1. Supabase Auth UI integration
2. Dashboard layout with sidebar
3. Bot CRUD operations
4. Basic widget prototype

### Phase 2: Core Features (Week 3-4)
5. Web scraping pipeline
6. Embedding generation
7. Chat interface
8. Widget customization

### Phase 3: Polish (Week 5-6)
9. Analytics dashboard
10. Team management
11. Billing integration
12. Production deployment

## Design System Documentation

### Component Usage
- Use Radix UI primitives for accessibility
- Tailwind classes for styling
- Framer Motion for animations
- React Hook Form for validation

### Testing Requirements
- Jest unit tests for components
- Playwright E2E for user flows
- Lighthouse CI for performance
- axe-core for accessibility

## Handoff Notes for Development

1. **Supabase Auth**: Use built-in UI components for faster implementation
2. **Widget Isolation**: Shadow DOM is critical for style encapsulation
3. **Performance**: Implement virtual scrolling for large conversation lists
4. **Accessibility**: Test with screen readers (NVDA, JAWS, VoiceOver)
5. **Mobile**: Test on real devices, not just browser emulation
6. **Analytics**: Implement event tracking from day one
