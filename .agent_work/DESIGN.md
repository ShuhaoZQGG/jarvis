# Jarvis AI Chatbot - UI/UX Design Specifications

## User Journeys

### 1. Website Owner Journey
**Goal**: Set up AI chatbot in under 5 minutes

1. **Landing** → Sign up with email/Google
2. **Onboarding** → Enter website URL or upload content
3. **Training** → Watch real-time progress (30-60 seconds)
4. **Customization** → Configure appearance and behavior
5. **Integration** → Copy embed code
6. **Dashboard** → Monitor conversations and analytics

### 2. End User Journey
**Goal**: Get instant, accurate answers

1. **Discovery** → Notice chat widget on website
2. **Engagement** → Click to open conversation
3. **Interaction** → Type question or select suggestion
4. **Response** → Receive formatted answer with sources
5. **Follow-up** → Continue conversation or quick actions

## Mockups & Wireframes

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│ Logo  Projects ▼  Analytics  Settings  User │
├─────────────────────────────────────────────┤
│ ┌───────┐ ┌─────────────────────────────┐   │
│ │Sidebar│ │     Main Content Area       │   │
│ │       │ │                             │   │
│ │-Bots  │ │  [Bot Status Card]          │   │
│ │-Train │ │  [Conversation Analytics]   │   │
│ │-Style │ │  [Recent Conversations]     │   │
│ │-Embed │ │                             │   │
│ │-Billing│ │                             │   │
│ └───────┘ └─────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Chat Widget States

**Minimized (Bubble)**
```
    ┌────┐
    │ 💬 │ <- 48x48px, floating bottom-right
    └────┘
```

**Expanded (Chat Window)**
```
┌──────────────────┐
│ 🤖 Jarvis    ✕ │ <- Header with branding
├──────────────────┤
│ How can I help?  │
│                  │ <- Message area
│ [Suggestion 1]   │
│ [Suggestion 2]   │
├──────────────────┤
│ Type message...  │ <- Input field
└──────────────────┘
Size: 380x600px (desktop), full-screen (mobile)
```

### Onboarding Flow
```
Step 1: Data Source        Step 2: Training         Step 3: Customize
┌──────────────┐          ┌──────────────┐         ┌──────────────┐
│ Enter URL:   │          │ Analyzing... │         │ Theme: [▼]   │
│ [_________]  │    →     │ ████░░░░ 60% │    →    │ Position:[▼] │
│              │          │              │         │ Preview:     │
│ [Continue]   │          │ 45 pages     │         │ [Widget]     │
└──────────────┘          └──────────────┘         └──────────────┘
```

## Responsive Design

### Breakpoints
- **Mobile**: 320-768px
- **Tablet**: 768-1024px
- **Desktop**: 1024px+

### Mobile Adaptations
- **Chat Widget**: Full-screen overlay with native-like header
- **Dashboard**: Single-column layout, collapsible navigation
- **Tables**: Horizontal scroll with sticky first column
- **Forms**: Full-width inputs, larger touch targets (44x44px min)

### Touch Interactions
- Swipe down to minimize chat
- Swipe left/right for suggested questions
- Long press to copy responses
- Pull-to-refresh conversation history

## Design System

### Colors
```
Primary:     #6366F1 (Indigo-500)
Secondary:   #8B5CF6 (Purple-500)
Success:     #10B981 (Emerald-500)
Error:       #EF4444 (Red-500)
Background:  #FFFFFF / #0F172A (dark mode)
Text:        #1F2937 / #F9FAFB (dark mode)
```

### Typography
```
Heading:     Inter, -apple-system, system-ui
Body:        Inter, -apple-system, system-ui
Monospace:   'Fira Code', monospace

Sizes:
H1: 2.5rem (40px)
H2: 2rem (32px)
Body: 1rem (16px)
Small: 0.875rem (14px)
```

### Components

**Buttons**
- Primary: Filled background, white text
- Secondary: Border only, transparent background
- Sizes: Small (32px), Medium (40px), Large (48px)
- States: Default, Hover, Active, Disabled, Loading

**Cards**
- Border-radius: 8px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 16px (mobile), 24px (desktop)

**Forms**
- Input height: 40px (mobile: 44px)
- Border: 1px solid #E5E7EB
- Focus: 2px ring with primary color
- Error state: Red border with helper text

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible keyboard focus with 2px outline
- **Touch Targets**: Minimum 44x44px on mobile
- **Text Scaling**: Support up to 200% zoom

### Keyboard Navigation
- Tab order follows visual hierarchy
- Escape key closes modals/chat
- Enter submits forms
- Arrow keys navigate suggestions

### Screen Reader Support
- ARIA labels for all interactive elements
- Live regions for chat updates
- Semantic HTML structure
- Skip links for navigation

### Additional Features
- High contrast mode support
- Reduced motion preference
- Dark mode toggle
- Language selection (i18n ready)

## Interaction Patterns

### Loading States
- Skeleton screens for content
- Spinning indicators for actions
- Progress bars for training
- Typing indicators in chat

### Error Handling
- Inline validation messages
- Toast notifications for system errors
- Retry mechanisms with clear CTAs
- Graceful degradation

### Animations
- Duration: 200-300ms for micro-interactions
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Respect prefers-reduced-motion
- Smooth transitions between states

## Widget Customization Options

### Appearance
- Theme: Light/Dark/Auto
- Primary color picker
- Widget position: Bottom-right/left, Top-right/left
- Initial state: Minimized/Expanded
- Custom logo/avatar

### Behavior
- Greeting message customization
- Auto-open delay (0-60 seconds)
- Suggested questions (up to 5)
- Response sources: Show/Hide
- Conversation persistence

### Advanced
- Custom CSS injection
- Whitelabel option (remove branding)
- Multiple language support
- Business hours schedule
- Fallback to human support