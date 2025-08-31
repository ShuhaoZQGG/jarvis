# UI/UX Design Specifications

## User Journeys

### 1. New User Onboarding
```
Landing → Sign Up → Email Verification → Dashboard → Create First Bot → Install Widget → Test Chat
```

### 2. Bot Creation Flow
```
Dashboard → New Bot → Configure Settings → Train with URL → Test Preview → Get Embed Code → Deploy
```

### 3. Analytics Review
```
Dashboard → Select Bot → View Metrics → Export Data → Adjust Settings → Save Changes
```

### 4. Subscription Management
```
Account → Billing → View Plans → Select Tier → Enter Payment → Confirm → Updated Limits
```

## Interface Mockups

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│ Logo  Dashboard  Bots  Analytics  Billing  [User Menu] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome back, {username}                              │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Active Bots  │ │ Conversations│ │ API Calls    │   │
│  │     12       │ │    1,234     │ │   45,678     │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                          │
│  Your Bots                                    [+ New]   │
│  ┌────────────────────────────────────────────────┐    │
│  │ Bot Name    Status    Conversations   Actions  │    │
│  │ Support Bot  Active      523         [•••]    │    │
│  │ Sales Bot    Active      312         [•••]    │    │
│  │ FAQ Bot      Paused       89         [•••]    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Bot Configuration
```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Bot Configuration                                      │
│                                                          │
│  General Settings                                       │
│  ┌────────────────────────────────────────────────┐    │
│  │ Bot Name: [___________________]                │    │
│  │ Description: [_________________]               │    │
│  │ Welcome Message: [______________]              │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Training Data                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ Website URL: [___________________] [Crawl]     │    │
│  │ Pages Found: 24  |  Indexed: 24                │    │
│  │ Last Updated: 2 hours ago                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Appearance                                             │
│  ┌────────────────────────────────────────────────┐    │
│  │ Theme: [Light ▼]  Primary Color: [#____]       │    │
│  │ Position: [Bottom Right ▼]                     │    │
│  │ [x] Show avatar  [x] Show typing indicator     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  [Save Changes]  [Preview]  [Get Code]                  │
└─────────────────────────────────────────────────────────┘
```

### Chat Widget
```
┌─────────────────┐
│ 💬 Chat with us │  (Collapsed State)
└─────────────────┘

┌─────────────────┐
│ Support Bot  ✕ │  (Expanded State)
├─────────────────┤
│ Hello! How can  │
│ I help today?   │
│                 │
│ User: Question? │
│                 │
│ Bot: Answer...  │
│ ───────────     │
├─────────────────┤
│ Type message... │
│           [Send]│
└─────────────────┘
```

## Responsive Design

### Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

### Mobile Adaptations
- Hamburger menu for navigation
- Stack cards vertically on dashboard
- Full-width forms and buttons
- Swipeable bot list
- Bottom sheet for chat widget

### Tablet Adaptations
- Collapsible sidebar navigation
- 2-column grid for bot cards
- Modal overlays for forms
- Floating action buttons

## Accessibility Specifications

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible outline on all interactive elements
- **Keyboard Navigation**: Tab order follows visual hierarchy
- **Screen Reader Support**: ARIA labels on all controls

### Interaction Requirements
- **Target Size**: Minimum 44x44px touch targets
- **Error Messages**: Clear, actionable error text
- **Form Labels**: Associated with inputs, visible at all times
- **Loading States**: Announced to screen readers
- **Skip Links**: "Skip to main content" on all pages

### Component Specifications

#### Buttons
- Primary: Filled background, high contrast
- Secondary: Outlined, medium emphasis
- Disabled: 40% opacity, cursor not-allowed
- Loading: Spinner icon with "Loading..." text

#### Forms
- Input height: 48px minimum
- Label position: Above input
- Error state: Red border, icon, descriptive text
- Success state: Green checkmark
- Helper text: Below input, smaller font

#### Navigation
- Sticky header on desktop
- Bottom navigation on mobile
- Breadcrumbs for deep navigation
- Clear active state indicators

#### Modals
- Overlay background: rgba(0,0,0,0.5)
- Close button: Top right, 44x44px
- Focus trap: Tab cycles within modal
- Escape key: Closes modal

## Design System

### Typography
- Headings: Inter, 600 weight
- Body: Inter, 400 weight
- Code: JetBrains Mono
- Scale: 14px, 16px, 20px, 24px, 32px

### Colors
```
Primary:    #3B82F6 (Blue)
Secondary:  #10B981 (Green)
Error:      #EF4444 (Red)
Warning:    #F59E0B (Amber)
Neutral:    #6B7280 (Gray)
Background: #FFFFFF / #1F2937 (Dark)
```

### Spacing
- Base unit: 8px
- Padding: 8px, 16px, 24px, 32px
- Margin: 0, 8px, 16px, 24px, 48px

### Shadows
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.1)
- lg: 0 10px 15px rgba(0,0,0,0.1)

## Animation Guidelines

### Transitions
- Duration: 200ms for micro, 300ms for standard
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Properties: transform, opacity, color

### Loading States
- Skeleton screens for content
- Progress bars for operations
- Spinners for indeterminate loads

### Feedback
- Toast notifications: Slide in from top
- Success: Green with checkmark
- Error: Red with X icon
- Info: Blue with i icon

## Frontend Framework Recommendations

### Primary Stack
- **Next.js 14**: App Router for SEO and performance
- **TypeScript**: Type safety across components
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations

### Component Architecture
- Atomic design methodology
- Storybook for component documentation
- CSS Modules for component styles
- Custom hooks for business logic
- Context API for global state

### Performance Targets
- Lighthouse score: 90+
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1