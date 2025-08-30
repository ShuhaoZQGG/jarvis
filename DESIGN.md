# Project Jarvis - UI/UX Design Specifications

## Design System

### Color Palette
- **Primary**: #6366F1 (Indigo-500)
- **Secondary**: #8B5CF6 (Violet-500)
- **Success**: #10B981 (Emerald-500)
- **Warning**: #F59E0B (Amber-500)
- **Error**: #EF4444 (Red-500)
- **Neutral**: #6B7280 (Gray-500)
- **Background**: #FFFFFF / #111827 (Dark mode)
- **Surface**: #F9FAFB / #1F2937 (Dark mode)

### Typography
- **Font**: Inter (Primary), system-ui (Fallback)
- **Headings**: 48/36/24/20/16px (Bold)
- **Body**: 16/14px (Regular)
- **Caption**: 12px (Medium)

### Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px

## User Journeys

### 1. First-Time User Flow
```
Landing → Sign Up → Email Verify → Dashboard → Create Bot → Enter URL → Processing → Widget Code → Install
```

### 2. Returning User Flow
```
Login → Dashboard → Select Bot → Analytics/Settings → Customize → Save
```

### 3. End-User Chat Flow
```
Page Load → Widget Appears → User Clicks → Chat Opens → Type Question → Get Response → Quick Actions
```

## Page Mockups

### Landing Page
```
┌─────────────────────────────────────┐
│ Logo  Features  Pricing  Docs  Login│
├─────────────────────────────────────┤
│                                     │
│  AI Chatbot in 60 Seconds          │
│  Train on your website instantly   │
│  [Get Started] [View Demo]         │
│                                     │
├─────────────────────────────────────┤
│  ┌───┐  ┌───┐  ┌───┐              │
│  │URL│→ │AI │→ │Bot│              │
│  └───┘  └───┘  └───┘              │
├─────────────────────────────────────┤
│  Features Grid (3x2)                │
│  • Smart Triggers                   │
│  • Multiple Widgets                 │
│  • Quick Actions                    │
│  • Mobile Optimized                 │
│  • Analytics                        │
│  • Integrations                     │
└─────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────┐
│ [J] Jarvis   Workspace ▼   Profile  │
├───────┬─────────────────────────────┤
│ Bots  │  Active Bots (3)            │
│ Usage │  ┌─────────────────┐        │
│ Billing│ │ Bot Name        │        │
│ Settings│ │ 1.2k chats/mo  │        │
│ API   │  │ [Configure][▶]  │        │
│       │  └─────────────────┘        │
│       │  [+ Create New Bot]         │
└───────┴─────────────────────────────┘
```

### Bot Configuration
```
┌─────────────────────────────────────┐
│ ← Back   Bot Settings               │
├─────────────────────────────────────┤
│ Tabs: General | Training | Widget | │
├─────────────────────────────────────┤
│ Website URL                         │
│ [_____________________] [Retrain]   │
│                                     │
│ Pages Indexed: 42                   │
│ Last Updated: 2 hours ago           │
│                                     │
│ Greeting Message                    │
│ [Hello! How can I help?_____]      │
│                                     │
│ Quick Actions                       │
│ □ Book Demo                        │
│ □ View Pricing                     │
│ □ Contact Sales                    │
│                                     │
│ [Save Changes]                      │
└─────────────────────────────────────┘
```

### Chat Widget (Bubble → Expanded)
```
Collapsed:                Expanded:
┌──┐                     ┌─────────────┐
│💬│                     │ Jarvis  ✕   │
└──┘                     ├─────────────┤
                         │ Hi! How can │
                         │ I help?     │
                         ├─────────────┤
                         │ [Book Demo] │
                         │ [Pricing]   │
                         ├─────────────┤
                         │ Type here...│
                         └─────────────┘
```

## Responsive Design

### Mobile Breakpoints
- **Mobile**: 320-767px
- **Tablet**: 768-1023px
- **Desktop**: 1024px+

### Mobile Adaptations
- Dashboard: Single column, collapsible sidebar
- Chat Widget: Full-width bottom sheet
- Forms: Stacked labels, larger touch targets (44x44px min)
- Tables: Horizontal scroll with sticky first column

## Widget Variants

### 1. Chat Bubble (Default)
- Position: Bottom-right
- Size: 56x56px collapsed
- Animation: Scale + fade in

### 2. Sidebar
- Position: Right edge
- Width: 320px
- Trigger: Tab on screen edge

### 3. Modal
- Trigger: Exit intent / time-based
- Size: 500x600px centered
- Backdrop: Semi-transparent

### 4. Inline
- Embeds in page content
- Height: 400px min
- Responsive width

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 text, 3:1 UI elements
- **Keyboard Navigation**: Full tab support
- **Screen Readers**: ARIA labels, live regions
- **Focus Indicators**: 2px outline offset
- **Error Messages**: Clear, actionable text
- **Loading States**: Skeleton screens with announcements

### Interaction States
- **Default**: Base colors
- **Hover**: -10% brightness
- **Active**: -20% brightness
- **Disabled**: 50% opacity
- **Focus**: 2px ring

## Component Library

### Buttons
- Primary: Filled background
- Secondary: Outlined
- Ghost: Text only
- Sizes: sm (32px), md (40px), lg (48px)

### Forms
- Input height: 40px
- Label position: Top
- Error position: Below input
- Required indicator: Red asterisk

### Cards
- Border radius: 8px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 16px

### Modals
- Max width: 500px
- Border radius: 12px
- Overlay: rgba(0,0,0,0.5)

## Animation Guidelines

### Micro-interactions
- Duration: 150-300ms
- Easing: ease-out
- Properties: transform, opacity only

### Page Transitions
- Slide: 300ms
- Fade: 200ms
- Skeleton loading: Pulse animation

## Performance Targets

### Widget
- Bundle size: <50KB
- Load time: <200ms
- First paint: <100ms
- Interactive: <300ms

### Dashboard
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1
- Lighthouse: >90

## Dark Mode

### Implementation
- CSS variables for colors
- System preference detection
- Manual toggle in settings
- Persistent user preference

### Color Adjustments
- Backgrounds: Inverted
- Text: High contrast
- Shadows: Reduced/removed
- Borders: Subtle gray

## Frontend Recommendations

### Framework: Next.js 14
- App Router for better performance
- Server Components by default
- Tailwind CSS for styling
- Radix UI for accessible components
- Framer Motion for animations
- React Hook Form for forms
- Tanstack Query for data fetching

### Widget Tech
- Preact for smaller bundle
- Shadow DOM for isolation
- PostMessage for communication
- Webpack Module Federation for updates