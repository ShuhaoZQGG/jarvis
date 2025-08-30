# UI/UX Design Specifications

## Design System

### Colors
- **Primary**: #6366F1 (Indigo-500)
- **Secondary**: #10B981 (Emerald-500)
- **Background**: #FFFFFF / #0F172A (dark mode)
- **Surface**: #F8FAFC / #1E293B
- **Text**: #1E293B / #F1F5F9
- **Border**: #E2E8F0 / #334155
- **Error**: #EF4444
- **Success**: #10B981
- **Warning**: #F59E0B

### Typography
- **Font**: Inter (primary), system-ui (fallback)
- **Headings**: 600-700 weight
- **Body**: 400-500 weight
- **Code**: 'Fira Code', monospace

### Spacing
- Base unit: 4px
- Padding: 16px (standard), 24px (large)
- Margins: 8px (tight), 16px (normal), 32px (loose)
- Border radius: 6px (small), 12px (medium), 16px (large)

## User Journeys

### 1. New User Onboarding
```
Landing → Sign Up → Email Verify → Dashboard → Add Website → Configure Bot → Get Code → Install
```

### 2. Returning User
```
Login → Dashboard → Select Bot → View Analytics → Manage Conversations → Update Settings
```

### 3. End User (Website Visitor)
```
Visit Site → See Widget → Click to Open → Type Question → Get Response → Follow Up → Rate
```

## Page Layouts

### Landing Page
```
┌──────────────────────────────────┐
│        Navigation Bar            │
├──────────────────────────────────┤
│                                  │
│     Hero Section                 │
│   "AI Chatbot in 60 Seconds"    │
│   [Try Demo] [Get Started]       │
│                                  │
├──────────────────────────────────┤
│   How It Works (3 steps)         │
│   1. Add URL  2. Train  3. Embed │
├──────────────────────────────────┤
│   Features Grid (2x3)            │
├──────────────────────────────────┤
│   Pricing Cards                  │
├──────────────────────────────────┤
│   Footer                         │
└──────────────────────────────────┘
```

### Dashboard
```
┌─────────┬────────────────────────┐
│ Sidebar │    Main Content Area    │
│         │                         │
│ Bots    │  Stats Cards (4)        │
│ Chats   │  ┌────┬────┬────┬────┐ │
│ Train   │  │    │    │    │    │ │
│ Embed   │  └────┴────┴────┴────┘ │
│ Billing │                         │
│ Settings│  Recent Conversations    │
│         │  ┌─────────────────────┐│
│ [User]  │  │ Table with actions  ││
│ [Logout]│  └─────────────────────┘│
└─────────┴────────────────────────┘
```

### Bot Configuration
```
┌──────────────────────────────────┐
│     Bot Name & Status Toggle     │
├──────────────────────────────────┤
│  Tabs: General | Training | Style│
├──────────────────────────────────┤
│                                  │
│  Tab Content                     │
│  - URL Input                     │
│  - Crawl Settings                │
│  - Training Status               │
│  - Preview Window                │
│                                  │
│  [Save Changes] [Train Now]      │
└──────────────────────────────────┘
```

## Component Specifications

### Chat Widget (Embedded)
```
Minimized State (60x60px):
┌────┐
│ 💬 │ <- Floating button
└────┘

Expanded State (380x600px):
┌──────────────────────┐
│ 🤖 Jarvis Bot    ✕  │ <- Header
├──────────────────────┤
│                      │
│  Chat Messages       │ <- Scrollable
│                      │
│  [Suggested Q1]      │ <- Quick actions
│  [Suggested Q2]      │
│                      │
├──────────────────────┤
│ Type message...  [↑] │ <- Input
└──────────────────────┘
```

### Mobile Responsive Breakpoints
- **Mobile**: < 640px (single column, bottom nav)
- **Tablet**: 640-1024px (collapsible sidebar)
- **Desktop**: > 1024px (full layout)

### Mobile Dashboard
```
┌──────────────────┐
│   ☰  Dashboard   │ <- Hamburger menu
├──────────────────┤
│  Stats Cards     │ <- Stackable
│  ┌──────────────┐│
│  └──────────────┘│
│  ┌──────────────┐│
│  └──────────────┘│
├──────────────────┤
│  Recent Chats    │ <- Simplified list
│  ┌──────────────┐│
│  └──────────────┘│
├──────────────────┤
│ [+] [📊] [💬] [⚙]│ <- Bottom nav
└──────────────────┘
```

## Interaction Patterns

### Form Validation
- Real-time validation on blur
- Clear error messages below fields
- Success checkmarks for valid inputs
- Loading states during submission

### Loading States
- Skeleton screens for content areas
- Spinner for button actions
- Progress bars for training/crawling
- Shimmer effects for cards

### Animations
- Page transitions: 200ms fade
- Modal open/close: 300ms slide
- Button hover: scale(1.05)
- Widget expand: 400ms spring

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Color contrast: 4.5:1 minimum
- Focus indicators: 2px outline
- Keyboard navigation: Tab order logical
- Screen reader: ARIA labels on all interactive elements
- Skip links: "Skip to main content"

### Keyboard Shortcuts
- `Esc`: Close modals/widget
- `Ctrl+K`: Quick search
- `Tab`: Navigate elements
- `Enter`: Submit forms
- `Space`: Toggle checkboxes

## Widget Customization Options

### Appearance Settings
```json
{
  "position": "bottom-right",
  "theme": {
    "primaryColor": "#6366F1",
    "fontFamily": "Inter",
    "borderRadius": "12px"
  },
  "greeting": "Hi! How can I help?",
  "placeholder": "Type your question...",
  "showSuggestions": true,
  "autoOpen": false,
  "openDelay": 3000
}
```

### Widget Positions
- bottom-right (default)
- bottom-left
- top-right
- top-left
- inline (embedded in page)

## Error States

### Empty States
- No bots: "Create your first bot" CTA
- No conversations: "Waiting for first chat"
- No training data: "Add URLs to train"

### Error Messages
- Network error: "Connection lost. Retrying..."
- Rate limit: "Too many requests. Please wait."
- Invalid input: "Please enter a valid URL"
- Training failed: "Training error. Try again."

## Success Metrics

### User Experience KPIs
- Time to first bot: < 60 seconds
- Widget load time: < 200ms
- Chat response time: < 500ms
- Mobile performance score: > 90
- Accessibility score: 100%

## Design Implementation Notes

### CSS Framework
- Tailwind CSS for utility classes
- CSS modules for component styles
- PostCSS for optimization

### Component Library
- Radix UI for accessible primitives
- Framer Motion for animations
- React Hook Form for forms
- Recharts for analytics

### Icon Set
- Lucide React for consistent icons
- Custom bot avatar system
- Emoji support in chat

## Responsive Grid System
```css
/* Mobile First */
.container {
  width: 100%;
  padding: 0 16px;
}

/* Tablet */
@media (min-width: 640px) {
  .container { max-width: 640px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

/* Wide */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

## Dark Mode Support
- System preference detection
- Manual toggle in settings
- Persistent user preference
- Smooth theme transitions
- Proper contrast ratios

## Performance Optimizations
- Lazy load chat history
- Virtual scrolling for long lists
- Image optimization with next/image
- Code splitting by route
- Prefetch on hover