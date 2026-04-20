# AI Sales Enablement Coach - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Material Design + Linear inspiration)
**Rationale:** Professional B2B productivity tool requiring credibility, efficiency, and data-heavy interfaces. Sales reps need quick access to coaching insights, SQL queries, and actionable frameworks.

**Core Principles:**
1. Professional credibility for healthcare/pharma context
2. Information density without overwhelm
3. Rapid task completion for busy sales professionals
4. Clear visual hierarchy for complex coaching frameworks

---

## Typography System

**Font Family:** Inter (primary), JetBrains Mono (code/SQL)

**Hierarchy:**
- Page Titles: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Labels/Metadata: text-sm font-medium (14px)
- SQL/Code: text-sm font-mono (14px)
- Helper Text: text-xs (12px)

---

## Layout System

**Spacing Units:** Consistently use Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing: p-2, gap-2
- Standard spacing: p-4, gap-4, mb-6
- Section spacing: py-8, py-12, py-16
- Component padding: p-6, p-8

**Grid Structure:**
- Max container width: max-w-7xl mx-auto
- Dashboard layout: Sidebar (256px fixed) + Main content (flex-1)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed height: h-16
- Logo (left), Search bar (center-left), User profile + notifications (right)
- Box shadow for elevation: shadow-sm

**Side Navigation:**
- Fixed width: w-64
- Collapsible on mobile
- Sections: Dashboard, Coaching Modules, Role-Play, SQL Analyzer, Knowledge Base, My Progress
- Active state: font-semibold with subtle visual indicator

### Dashboard Components

**Coaching Module Cards:**
- Rounded corners: rounded-lg
- Padding: p-6
- Shadow: shadow-md hover:shadow-lg transition
- Structure: Icon (top-left 48px) + Title + Description + Progress indicator + CTA button

**Emotional Intelligence Framework Panels:**
- Border: border-l-4 (accent indicator)
- Padding: p-6
- Contains: Framework name, Key principles (bulleted), Quick actions

**SQL Query Interface:**
- Two-column split: Natural language input (left) + Generated SQL (right)
- Code block styling: rounded-md, p-4, font-mono
- Execute button: Prominent, right-aligned

### Interactive Elements

**Chat Interface:**
- Full-height conversation area
- Message bubbles: User (right-aligned, rounded-2xl) vs AI Coach (left-aligned, rounded-2xl)
- Input bar: Fixed bottom, shadow-lg, rounded-full input with send button
- Typing indicator: Animated dots

**Role-Play Simulator:**
- Theater-style layout: Scenario description (top banner) + Conversation (center) + Feedback sidebar (right)
- Scenario selector: Dropdown with pharma-specific scenarios
- Real-time EQ feedback: Sliding panel showing empathy scores, rapport indicators

**Data Tables:**
- Striped rows for readability
- Sortable headers: text-sm font-semibold uppercase tracking-wide
- Compact row height: py-3
- Hover state for row interactivity

### Forms & Inputs

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border: border rounded-md
- Focus state: ring-2 ring-offset-2
- Labels: text-sm font-medium mb-2

**Buttons:**
- Primary: h-10 px-6 rounded-md font-medium
- Secondary: h-10 px-6 rounded-md font-medium border
- Icon buttons: h-10 w-10 rounded-md
- Blur background when on images: backdrop-blur-md bg-white/90

### Feedback Elements

**Progress Indicators:**
- Skill progress: Horizontal bar (h-2 rounded-full)
- Module completion: Circular progress (stroke-dasharray pattern)
- Badges: Rounded-full px-3 py-1 text-xs font-semibold

**Alert/Notification Banners:**
- Border-l-4 indicator
- Icon (left) + Message + Action (right)
- Padding: p-4
- Dismissible close button

---

## Page Layouts

### Dashboard (Main)
- 3-column grid: Recent Activity + Active Modules + Performance Metrics
- Hero stats bar: 4 key metrics (calls analyzed, EQ score, SQL queries, coaching hours)
- Quick access coaching carousel

### Coaching Module Detail
- Breadcrumb navigation
- Hero section: Module title + description + progress (80px height)
- Content area: Framework explanation (left 2/3) + Action sidebar (right 1/3)
- Interactive exercises: Expandable accordions

### SQL Query Analyzer
- Split-pane layout: 50/50 on desktop, stacked on mobile
- Query history sidebar (collapsible)
- Results table with export options
- Suggested queries: Chip-style quick actions

### Knowledge Base
- Search-first design: Large search bar (h-14) at top
- Category navigation: Horizontal tabs
- Article grid: 2-column with preview cards
- Article view: Single column max-w-3xl with sticky TOC sidebar

---

## Spacing Consistency

**Section Padding:** py-12 for main content sections
**Card Spacing:** gap-6 between cards, p-6 internal padding
**Form Spacing:** mb-6 between form groups
**Inline Spacing:** gap-4 for button groups, gap-2 for icon+text

---

## Accessibility

- Focus indicators on all interactive elements (ring-2)
- ARIA labels for icon-only buttons
- Keyboard navigation for all core workflows
- Sufficient contrast ratios (WCAG AA minimum)
- Form validation with clear error states

---

## Images

**Hero Section:** Professional coaching scene - sales rep reviewing data on tablet with coach, modern office setting (1920x600px)
**Placement:** Top of dashboard, subtle overlay for welcome message

**Module Cards:** Icon-based illustrations for each framework (DISC, Empathy Mapping, etc.) - 128x128px
**Knowledge Base:** Pharma/biotech stock imagery for article headers - 800x400px