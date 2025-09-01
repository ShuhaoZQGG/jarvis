# Jarvis AI Chatbot Platform - UI/UX Design Specifications

## Executive Summary
Production-ready UI/UX design for AI chatbot platform with complete MVP features. Design emphasizes performance optimization (<2s response), security (MFA/auth), and scalability (10K+ concurrent users). Focus on database optimization and production deployment readiness.

## User Journeys

### 1. First-Time User Onboarding
```
Landing → Sign Up (Supabase Auth) → Email Verification → MFA Setup → 
Workspace Creation → Bot Creation Wizard → URL Scraping → 
Embedding Generation → Widget Code → Installation Guide
```
**Goal**: Secure onboarding with working chatbot in <5 minutes

### 2. Returning Power User
```
Login (MFA) → Dashboard Analytics → Usage Monitoring → 
Bot Performance Review → Training Optimization → 
Billing Check → Team Management
```
**Goal**: Data-driven optimization and team collaboration

### 3. End User - Website Visitor
```
Widget Load (<500ms) → Greeting Message → Type Query → 
Vector Search → GPT-4 Response (SSE) → Feedback → 
Conversation History → Lead Capture
```
**Goal**: Instant AI assistance with <2s response time

## Production UI Components

### Authentication Flow (Supabase)
```
┌─────────────────────────────────────┐
│  Jarvis AI Platform    [Pricing]   │
├─────────────────────────────────────┤
│        Sign Up                     │
│  [Email_______________]             │
│  [Password___________] 🔒 Strong    │
│  [Confirm Password___]              │
│                                     │
│  Or continue with:                 │
│  [Google] [GitHub] [Microsoft]     │
│                                     │
│  ☑ I agree to Terms & Privacy      │
│  [Create Account →]                 │
│                                     │
│  Have account? [Sign In]           │
└─────────────────────────────────────┘
```

### MFA Setup Screen
```
┌─────────────────────────────────────┐
│     Secure Your Account            │
├─────────────────────────────────────┤
│  Enable Two-Factor Authentication  │
│                                     │
│  📱 Authenticator App (Recommended)│
│  [QR Code Display]                 │
│  Secret: XXXX-XXXX-XXXX-XXXX      │
│                                     │
│  📧 SMS Backup                     │
│  [+1 (555) 000-0000____]          │
│                                     │
│  Verification Code:                │
│  [______]                          │
│                                     │
│  [Skip for Now] [Enable MFA →]     │
└─────────────────────────────────────┘
```

## Core Application Interfaces

### Enhanced Dashboard with Metrics
```
┌─────────────────────────────────────────────┐
│ 🤖 Jarvis  [Workspace ▼]  [🔔3] [User ▼]   │
├───────┬─────────────────────────────────────┤
│ Menu  │  Dashboard Overview                 │
│       │  ┌──────┬──────┬──────┬──────┐     │
│ 📊    │  │45.2K │ 2.1s │ 98%  │ 3/10 │     │
│ Bots  │  │Msgs  │ Avg  │ Sat  │ Bots │     │
│       │  └──────┴──────┴──────┴──────┘     │
│ 📈    │                                     │
│ Usage │  Active Bots        [+ Create New]  │
│       │  ┌─────────────────────────────┐   │
│ 👥    │  │ Customer Support Bot       │   │
│ Team  │  │ Status: ● Active           │   │
│       │  │ Messages: 15,234 today     │   │
│ 🔑    │  │ Response: 1.8s avg         │   │
│ API   │  │ Satisfaction: 97%          │   │
│       │  │ [Widget] [Analytics] [⚙️]  │   │
│ 💳    │  └─────────────────────────────┘   │
│ Billing│  [View All Bots →]                 │
│       │                                     │
│ ⚙️    │  Recent Conversations               │
│Settings│  [List of recent chats...]          │
└───────┴─────────────────────────────────────┘
```

### Bot Creation Wizard (Multi-Step)
```
Step 1: Basic Information
┌─────────────────────────────────────┐
│  Create Your AI Assistant  (1/4)   │
├─────────────────────────────────────┤
│  Bot Name *                        │
│  [Customer Support Bot_______]     │
│                                     │
│  Description                       │
│  [24/7 AI support assistant ]     │
│  [for customer inquiries... ]     │
│                                     │
│  Avatar (optional)                 │
│  [📤 Upload Image]                 │
│                                     │
│  [← Back]    [Next: Training →]    │
└─────────────────────────────────────┘

Step 2: Training Source
┌─────────────────────────────────────┐
│  Train Your Bot  (2/4)             │
├─────────────────────────────────────┤
│  Choose Training Method:           │
│                                     │
│  ○ Website Scraping               │
│    [https://_______________] [+]   │
│    ☑ Include subpages (max 500)   │
│                                     │
│  ○ File Upload                    │
│    [📎 PDF, TXT, DOCX]            │
│                                     │
│  ● Manual Content                 │
│    [Rich text editor with         │
│     Q&A pairs, docs, FAQs...]     │
│                                     │
│  Estimated tokens: ~50,000        │
│                                     │
│  [← Back]  [Start Training →]      │
└─────────────────────────────────────┘
```

### Production Chat Widget (With SSE/WebSocket)
```
Minimized:         Expanded (384x500px):
  ┌────┐         ┌──────────────────────┐
  │ 💬 │         │ Support Bot      [−] │
  │  3  │         ├──────────────────────┤
  └────┘         │ 🟢 Online · 1.2s avg │
                 ├──────────────────────┤
                 │ Bot: Hi! I'm here to │
                 │ help. What can I     │
                 │ assist you with?     │
                 │                      │
                 │ Quick Actions:       │
                 │ [📚 Docs] [💳 Plans] │
                 │ [📧 Contact]         │
                 │                      │
                 │ User: How do I...    │
                 │                      │
                 │ Bot: ··· (typing)    │
                 ├──────────────────────┤
                 │ [Type message...] 📎 │
                 │        [Send →]      │
                 └──────────────────────┘

Real-time Features:
- SSE for streaming responses
- WebSocket fallback
- Typing indicators
- Read receipts
- Connection status
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

## Production-Ready Component System

### Design Tokens (CSS Variables)
```css
/* Core Brand Colors */
--primary: #0066FF;
--primary-hover: #0052CC;
--primary-light: #E6F0FF;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Text Hierarchy */
--text-primary: #111827;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;
--text-inverse: #FFFFFF;

/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;
--bg-tertiary: #F3F4F6;
--bg-dark: #1F2937;

/* Borders & Shadows */
--border: #E5E7EB;
--border-focus: var(--primary);
--radius-sm: 0.375rem;
--radius: 0.5rem;
--radius-lg: 0.75rem;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
--shadow: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 40px rgba(0,0,0,0.15);

/* Animation Timing */
--transition-fast: 150ms;
--transition: 200ms;
--transition-slow: 300ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
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

## Performance Optimization Targets

### Critical Metrics
- **Database Query Time**: <100ms (from 500ms)
- **API Response Time**: <2s with streaming
- **Widget Bundle**: <30KB gzipped
- **Dashboard LCP**: <1s
- **Time to Interactive**: <2s
- **First Contentful Paint**: <500ms

### Optimization Strategies
- **Database**: Fix RLS policies, remove 47 unused indexes
- **Caching**: Redis with LRU fallback
- **CDN**: Cloudflare edge caching
- **Code Splitting**: Route-based + component lazy loading
- **Image Optimization**: Next.js Image with WebP
- **Bundle Analysis**: Tree shaking, minification

## Production Technology Stack

### Frontend (Verified Working)
- **Next.js 14**: App Router with TypeScript
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Performance animations
- **React Hook Form**: Form validation
- **TanStack Query**: Data fetching with cache
- **Zustand**: Global state management

### Backend Services (Production Ready)
- **Supabase**: PostgreSQL + Auth + Realtime
- **Pinecone**: Vector embeddings storage
- **OpenAI GPT-4**: Chat completions
- **Stripe**: Subscription billing
- **Redis**: Rate limiting (with fallback)
- **Playwright**: Web scraping engine

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

## Implementation Priority (Based on PLAN.md)

### Phase 1: Database Optimization (Critical)
- Fix 60+ RLS policies performance issues
- Remove 47 unused indexes
- Optimize query patterns
- UI: Loading states, error handling

### Phase 2: Security UI (Critical)
- MFA setup flow
- Password strength indicators
- Session management UI
- Security badges/indicators

### Phase 3: Production Features
- Rate limit indicators
- Usage quota displays
- Real-time connection status
- Error recovery UI

### Phase 4: Polish & Testing
- Accessibility audit
- Performance monitoring
- E2E test coverage
- Documentation

## Additional Production UI Components

### Analytics Dashboard
```
┌─────────────────────────────────────────────┐
│ Analytics Overview     [7 days ▼] [Export]  │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────┐│
│ │ Conversations Over Time         📈       ││
│ │ [Line chart with real-time updates]      ││
│ └──────────────────────────────────────────┘│
│ ┌───────────┬────────────────────────────┐  │
│ │ Top Queries│ User Satisfaction         │  │
│ │ • Pricing  │ ⭐⭐⭐⭐⭐ 4.8/5.0         │  │
│ │ • Features │ 👍 92% 👎 8%              │  │
│ │ • Support  │ Avg Response: 1.8s        │  │
│ └───────────┴────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Billing & Usage Monitor
```
┌─────────────────────────────────────────────┐
│ Current Plan: Pro         [Upgrade to Ent.] │
├─────────────────────────────────────────────┤
│ Usage This Month (Dec 1-31)                │
│                                             │
│ Messages    ████████░░ 82,456/100,000      │
│ Bots        ███░░░░░░░ 3/10                │
│ Storage     ██████░░░░ 6.2GB/10GB          │
│ Team        █████░░░░░ 5/20                │
│                                             │
│ Next billing: Dec 31 ($299)                │
│ [Payment Method: •••• 4242]  [Update]      │
└─────────────────────────────────────────────┘
```

### API Management Interface
```
┌─────────────────────────────────────────────┐
│ API Keys                    [+ Create New]  │
├─────────────────────────────────────────────┤
│ Name         Key            Last Used  [⋮] │
│ Production   sk-...Xk2Y     2 min ago  [✎]│
│ Development  sk-...9mNp     1 day ago  [✎]│
│ Testing      sk-...4jKl     Never      [🗑]│
├─────────────────────────────────────────────┤
│ Rate Limits: 1000 req/min                  │
│ [View Documentation] [Webhook Settings]     │
└─────────────────────────────────────────────┘
```

### Team Management
```
┌─────────────────────────────────────────────┐
│ Team Members                  [+ Invite]     │
├─────────────────────────────────────────────┤
│ 👤 John Doe          john@example.com       │
│    Role: Owner       Last active: Now       │
│                                             │
│ 👤 Jane Smith        jane@example.com       │
│    Role: Admin       Last active: 2h ago    │
│    [Change Role ▼]   [Remove]              │
│                                             │
│ 📧 Pending Invites (1)                     │
│    mike@example.com  Sent 2 days ago       │
│    [Resend]         [Cancel]               │
└─────────────────────────────────────────────┘
```

### Training Status Monitor
```
┌─────────────────────────────────────────────┐
│ Training Queue                              │
├─────────────────────────────────────────────┤
│ Bot: Customer Support                       │
│ Status: ⚡ Processing (Page 47/150)         │
│ ████████████░░░░░░░░ 31%                   │
│                                             │
│ Stages:                                     │
│ ✅ URL Scraping      (150 pages)            │
│ ⚡ Embeddings        (47/150)               │
│ ⏳ Vector Storage    (Pending)              │
│ ⏳ Testing          (Pending)              │
│                                             │
│ Est. Time: ~5 minutes                       │
│ [Pause] [Cancel]                           │
└─────────────────────────────────────────────┘
```

## Error States & Recovery

### Connection Lost
```
┌─────────────────────────────────────────────┐
│ ⚠️ Connection Lost                          │
│                                             │
│ We're having trouble connecting to our      │
│ servers. Your work is saved locally.       │
│                                             │
│ [🔄 Retry Now]  [Work Offline]             │
└─────────────────────────────────────────────┘
```

### Rate Limit Warning
```
┌─────────────────────────────────────────────┐
│ ⚠️ Approaching Rate Limit                   │
│                                             │
│ 950/1000 requests used this minute         │
│ Consider upgrading for higher limits       │
│                                             │
│ [View Plans]  [Dismiss]                    │
└─────────────────────────────────────────────┘
```

## Mobile Responsive Adaptations

### Mobile Dashboard (< 768px)
```
┌──────────────────┐
│ ☰ Jarvis    👤   │
├──────────────────┤
│ Overview         │
│ ┌──────┬──────┐  │
│ │45.2K │ 98%  │  │
│ │ Msgs │ Sat  │  │
│ └──────┴──────┘  │
│                  │
│ Your Bots        │
│ ┌──────────────┐ │
│ │ Support Bot  │ │
│ │ ● Active     │ │
│ │ [Manage]     │ │
│ └──────────────┘ │
│                  │
│ [+ Create Bot]   │
└──────────────────┘
```

### Mobile Widget (Full Width)
```
┌──────────────────┐
│ Chat Support  ✕  │
├──────────────────┤
│ Messages...      │
│                  │
│                  │
├──────────────────┤
│ [Type...] [Send] │
└──────────────────┘
```

## Accessibility Features

### Screen Reader Announcements
- "New message received from bot"
- "Training progress: 31 percent complete"
- "Error: Connection lost. Retrying..."
- "Success: Bot created successfully"

### Keyboard Shortcuts
- `Esc` - Close modals/widget
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New bot
- `Tab` - Navigate elements
- `Enter` - Activate buttons
- `Space` - Toggle checkboxes

### Focus Management
- Trap focus in modals
- Return focus on close
- Skip to main content
- Visible focus indicators

## Security Indicators

### Visual Security Cues
- 🔒 Locked icon for secure fields
- 🛡️ Shield for MFA-enabled accounts
- ✓ Checkmark for verified domains
- ⚠️ Warning for weak passwords
- 🔴 Red dot for security issues

## Frontend Performance Checklist

- [ ] Lazy load heavy components
- [ ] Implement virtual scrolling for lists
- [ ] Use React.memo for expensive renders
- [ ] Optimize bundle with dynamic imports
- [ ] Implement service worker caching
- [ ] Use CDN for static assets
- [ ] Compress images with WebP
- [ ] Minify CSS/JS bundles
- [ ] Enable gzip compression
- [ ] Implement request debouncing
