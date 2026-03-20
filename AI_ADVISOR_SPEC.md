# AI Advisor — Feature Specification

## Overview

The AI Advisor is a role-aware intelligence layer embedded in the application header. It replaces the scope field with a glowing "AI Advisor" button that opens a centered modal. The modal delivers four types of analytics — descriptive, diagnostic, predictive, and prescriptive — derived from the organisation's own live data, with optional Gemini API enhancement for natural language and conversational chat.

The system works fully without any external API key. Gemini is an optional enhancement layer.

---

## Objective

- Give every user a personalised, contextual intelligence briefing based on their role and live org data
- Surface actionable insights that drive better decisions at every level of the organisation
- Provide employees with career development guidance and performance coaching
- Keep executives informed of strategic risks and opportunities
- Operate independently of any paid API, with Gemini as an optional upgrade

---

## Entry Point — Header Button

The scope field in `components/layout/Header.tsx` is replaced with:

```
[ ✦ AI Advisor ]
```

- A small animated orb icon (brand-colored, soft pulse animation) + label "AI Advisor"
- On mobile: icon only, no label
- A badge dot appears when a fresh daily briefing is available (checked once on mount)
- Clicking opens the AI Advisor Modal

---

## Modal Styling

Matches the app's existing modal language exactly:

```
Backdrop:   fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300
Container:  fixed inset-0 flex items-center justify-center p-6
Panel:      w-full max-w-3xl max-h-[85vh] bg-white/80 dark:bg-[#0d0a1a]/90
            backdrop-blur-xl rounded-[40px] border border-slate-200 dark:border-white/10
            shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col overflow-hidden
```

- Semi-transparent frosted glass background
- Heavy rounded corners (`rounded-[40px]`) matching app signature
- Scrollable content area inside
- Smooth scale+fade entrance animation
- Clicking backdrop closes the modal

---

## Modal Structure

```
┌─────────────────────────────────────────────────────┐
│  ✦ AI Advisor          [role badge]            [✕]  │
│  "Good morning, [Name]. Here's your briefing."      │
├─────────────────────────────────────────────────────┤
│  [ Briefing ]  [ Insights ]  [ Trends ]  [ Ask ]   │  ← tab bar
├─────────────────────────────────────────────────────┤
│                                                     │
│   [scrollable tab content]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tab: Briefing
Auto-generated daily summary for the user's role. Rendered as a set of insight cards. Each card shows:
- Icon + color-coded type badge (Descriptive / Diagnostic / Predictive / Prescriptive)
- Headline (one line)
- Summary (2–3 lines)
- Expandable detail section (click to expand inline — no new modal)
- Severity indicator: Info (slate) / Warning (amber) / Critical (red) / Positive (emerald)

### Tab: Insights
The four analytics modes displayed as interactive card groups:

**Descriptive** (slate badge) — "What is happening"
- Current headcount, attendance rate, on-leave count
- Payroll total this period
- Performance average across org
- Open job requisitions

**Diagnostic** (amber badge) — "Why it is happening"
- Absenteeism clustering by department
- Correlation signals: low performance + high absence = burnout risk flag
- Turnover concentration analysis
- Hiring funnel bottleneck detection

**Predictive** (blue badge) — "What will happen"
- Headcount projection (next 3 months, linear trend)
- Turnover risk score per department
- Payroll cost trajectory
- Hiring pipeline gap forecast

**Prescriptive** (emerald badge) — "What to do about it"
- Ranked action recommendations with impact labels (High / Medium / Low)
- Each recommendation links to the relevant section of the app
- Examples: "Schedule stay interviews with 3 at-risk employees in Engineering", "Post 2 roles to close pipeline gap before Q3"

### Tab: Trends
External data context (no API key required for structure, NewsAPI optional for live content):

- Industry news feed (NewsAPI free tier, cached 6h server-side, gracefully empty if no key)
- Labor market context (static curated insights if no external API)
- HR best practice tips relevant to current org signals (rule-based, always available)
- "What leading organisations in your sector are doing" — static knowledge base entries

### Tab: Ask (Gemini-dependent)
- Free-form conversational chat with full org context injected
- Streaming response with typing cursor
- Disabled with a clear message if `GEMINI_API_KEY` is not configured
- Suggested starter questions shown when empty:
  - "What is our biggest retention risk right now?"
  - "How does our attendance compare to last month?"
  - "What should I focus on this week?"
  - "Give me a career development plan for my current role"

---

## Role-Aware Content

### CEO / Executive
- Org health score (composite metric: attendance + performance + turnover + payroll efficiency)
- Strategic risk flags
- Industry trend briefings
- Headcount and cost projections
- Top 3 prescriptive strategic actions

### HR Admin
- Workforce diagnostic summary
- Retention risk employees (anonymised count by dept)
- Hiring funnel health
- Leave balance anomalies
- Compliance flags (attendance policy breaches)
- Prescriptive HR actions ranked by urgency

### Manager
- Team pulse (attendance, performance trajectory)
- Individual coaching signals (e.g. repeated Monday absences)
- Team performance trend vs org average
- Pending approvals summary
- Recommended team actions

### Employee
- Personal attendance summary and trend
- Performance score context (vs dept average, vs org average)
- Career development suggestions based on current role and score
- Leave wellness nudge if no leave taken in >60 days
- Skill gap recommendations
- Next career step guidance

---

## Analytics Engine — Rule-Based (No API Required)

All four analytics modes are computed server-side in `AiAdvisorService.php` using thresholds and formulas applied to live org data.

### Thresholds

| Signal | Threshold | Severity |
|---|---|---|
| Absenteeism rate | > 10% warning, > 20% critical | Diagnostic |
| Attendance rate | < 80% warning, < 65% critical | Descriptive |
| Turnover rate | > 8% warning, > 15% critical | Diagnostic |
| Performance avg | < 60% warning, < 45% critical | Diagnostic |
| Pending approvals | > 10 warning, > 25 critical | Descriptive |
| Hiring pipeline | < 2 candidates at final stage | Predictive |
| Leave balance unused | > 15 days for employee | Prescriptive |

### Composite Org Health Score
```
health_score = (
  (attendance_rate * 0.30) +
  (100 - turnover_rate * 2) * 0.25 +
  (performance_avg) * 0.30 +
  (payroll_efficiency) * 0.15
)
clamped to 0–100
```

### Predictive Projection (Linear Trend)
```
next_month_headcount = last_headcount + avg_monthly_delta (last 3 months)
turnover_risk_score  = (dept_turnover_rate / org_turnover_rate) * 100
```

---

## Backend Architecture

### New Files

```
backend/app/Services/AiAdvisorService.php       — rule engine + Gemini integration
backend/app/Http/Controllers/AiAdvisorController.php
backend/routes/api.php                          — 3 new routes added
```

### API Endpoints

```
GET  /api/ai/briefing          — returns structured insight array for current user's role
POST /api/ai/chat              — conversational endpoint (requires GEMINI_API_KEY)
GET  /api/ai/trends            — external news + static HR insights (cached 6h)
```

### Caching Strategy
- Briefing: cached per user per day (`ai_briefing_{user_id}_{date}`)
- Trends: cached globally for 6 hours (`ai_trends`)
- Chat: never cached (live)

### Gemini Integration (Optional)
- Checked via `config('services.gemini.key')` — null-safe throughout
- If key present: insight objects are passed to Gemini Flash for natural language rewrite + chat enabled
- If key absent: structured insight objects rendered directly as cards, Ask tab shows "Configure Gemini to enable chat"
- Model: `gemini-1.5-flash` (free tier: 15 req/min, 1M tokens/day)

---

## Frontend Architecture

### New Files

```
components/ai/AIAdvisorButton.tsx       — header button with orb + pulse
components/ai/AIAdvisorModal.tsx        — main modal shell + tab bar
components/ai/tabs/BriefingTab.tsx      — daily briefing cards
components/ai/tabs/InsightsTab.tsx      — four analytics mode cards
components/ai/tabs/TrendsTab.tsx        — external data + static insights
components/ai/tabs/AskTab.tsx           — chat interface (Gemini-gated)
components/ai/InsightCard.tsx           — reusable expandable insight card
hooks/useAIAdvisor.ts                   — state management + API calls
services/aiAdvisorApi.ts                — API service layer
types/ai.ts                             — TypeScript interfaces
```

### InsightCard Component
Each insight card renders:
- Left accent bar colored by severity
- Type badge (Descriptive / Diagnostic / Predictive / Prescriptive)
- Severity icon + color
- Headline
- Summary text
- Expand chevron → reveals detail text + action link on click
- Smooth height transition on expand/collapse

### useAIAdvisor Hook
```typescript
{
  briefing: InsightItem[]       // loaded on modal open
  trends: TrendItem[]           // loaded on Trends tab first visit
  isLoadingBriefing: boolean
  isLoadingTrends: boolean
  geminiEnabled: boolean        // from /api/ai/briefing response
  sendMessage: (msg) => void    // streams to chatMessages
  chatMessages: ChatMessage[]
  isStreaming: boolean
}
```

---

## Insight Card Data Shape

```typescript
interface InsightItem {
  id: string
  type: 'descriptive' | 'diagnostic' | 'predictive' | 'prescriptive'
  severity: 'info' | 'warning' | 'critical' | 'positive'
  headline: string
  summary: string
  detail?: string
  action?: { label: string; href: string }
  metric?: { label: string; value: string | number; delta?: number }
}
```

---

## Styling Reference

### Type Badge Colors
| Type | Badge | Left bar |
|---|---|---|
| Descriptive | `bg-slate-100 text-slate-600` | `bg-slate-400` |
| Diagnostic | `bg-amber-100 text-amber-700` | `bg-amber-500` |
| Predictive | `bg-blue-100 text-blue-700` | `bg-blue-500` |
| Prescriptive | `bg-emerald-100 text-emerald-700` | `bg-emerald-500` |

### Severity Colors
| Severity | Icon | Color |
|---|---|---|
| Info | ℹ | slate |
| Warning | ⚠ | amber |
| Critical | ✕ | red |
| Positive | ✓ | emerald |

### AI Orb Button
- Brand-colored circle with `animate-pulse` (slow, 3s)
- Spark/brain icon inside
- Badge dot: `bg-emerald-500 w-2 h-2 rounded-full absolute -top-0.5 -right-0.5`
- Hover: slight scale up + glow shadow

---

## Implementation Order

1. `types/ai.ts` — all TypeScript interfaces
2. `backend/app/Services/AiAdvisorService.php` — rule engine
3. `backend/app/Http/Controllers/AiAdvisorController.php` + routes
4. `services/aiAdvisorApi.ts` + `hooks/useAIAdvisor.ts`
5. `components/ai/InsightCard.tsx`
6. `components/ai/tabs/` — all four tabs
7. `components/ai/AIAdvisorModal.tsx` — modal shell
8. `components/ai/AIAdvisorButton.tsx` — header button
9. Update `components/layout/Header.tsx` — replace scope field
10. Gemini integration in `AiAdvisorService.php` (optional layer)

---

## External APIs (All Free)

| API | Purpose | Key Required | Free Limit |
|---|---|---|---|
| Gemini 1.5 Flash | NL rewrite + chat | Yes (optional) | 15 req/min, 1M tokens/day |
| NewsAPI | Industry news for CEO trends tab | Yes (optional) | 100 req/day |
| No-key fallback | Static HR insight knowledge base | No | Unlimited |

---

## Privacy & Security

- No employee PII is sent to Gemini — only aggregated metrics and counts
- Gemini API key stored in backend `.env` only, never exposed to frontend
- Role-based data scoping: employees only see their own data, managers see team aggregates, admins see org-wide
- All AI endpoints protected by existing auth middleware
