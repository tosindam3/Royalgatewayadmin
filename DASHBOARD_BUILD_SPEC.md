# Dashboard Build Specification
> Reference document — do not deviate from this during implementation.

## 1. Architecture Rules

- `pages/Dashboard.tsx` is an **orchestrator only** — no fetch logic, no business logic
- All data fetching lives in `pages/dashboard/useDashboard.ts`
- Each widget is a **pure presentational component** — receives data as props only
- Backend enforces all scope/role filtering — frontend never filters data
- `mapBackendRoleToUserRole()` in `types.ts` is the **single source of truth** for role mapping
- No role checks scattered across widget files
- All colors use theme tokens only — no hardcoded hex values in components

---

## 2. Role → Dashboard View Mapping

| Backend Role | UserRole Enum | Dashboard Panel | Data Scope |
|---|---|---|---|
| `super_admin` | SUPER_ADMIN | ExecutiveDashboard | org-wide |
| `ceo` | SUPER_ADMIN* | ExecutiveDashboard | org-wide, read-heavy |
| `admin` / `hr_admin` | ADMIN | HRAdminDashboard | org-wide ops |
| `hr_manager` | ADMIN | HRAdminDashboard | org-wide ops |
| `branch_manager` | MANAGER | ManagerDashboard | branch scope |
| `department_head` | MANAGER | ManagerDashboard | dept scope |
| `team_lead` | MANAGER | ManagerDashboard | team scope |
| `employee` | EMPLOYEE | EmployeeDashboard | self only |

*CEO: add `ceo` to `mapBackendRoleToUserRole` → maps to SUPER_ADMIN.
`useDashboard` hook distinguishes executive vs full-admin by checking raw role name includes `ceo`.

---

## 3. File Structure

```
pages/
  Dashboard.tsx                        ← orchestrator only (~50 lines)
  dashboard/
    useDashboard.ts                    ← all data fetching, view derivation
    DashboardSkeleton.tsx              ← skeleton matching exact panel grid
    panels/
      ExecutiveDashboard.tsx           ← super_admin, ceo
      HRAdminDashboard.tsx             ← admin, hr_manager
      ManagerDashboard.tsx             ← branch_manager, dept_head, team_lead
      EmployeeDashboard.tsx            ← employee
    widgets/
      HeadcountChart.tsx               ← line chart, headcount over time
      AttendancePulse.tsx              ← today's present/absent/late breakdown
      TurnoverChart.tsx                ← bar chart, employee turnover
      LeaveStatisticsChart.tsx         ← stacked bar, leave by dept
      PayrollSummaryCard.tsx           ← current period payroll status
      PendingApprovalsWidget.tsx       ← approval queue list
      TeamAttendanceWidget.tsx         ← manager: direct reports status
      DemographicsChart.tsx            ← donut chart, gender/type breakdown
      PerformanceSnapshotWidget.tsx    ← shared, different data per role
      ScoreDistributionChart.tsx       ← executive/admin: histogram
      PersonalScoreCard.tsx            ← employee: my score + rating badge
      TopPerformersWidget.tsx          ← leaderboard list
      MyLeaveBalanceWidget.tsx         ← employee: leave balance per type
      MyAttendanceSummary.tsx          ← employee: this month summary
      QuickActionsWidget.tsx           ← role-aware action buttons
      HiringFunnelWidget.tsx           ← executive/admin: funnel chart

services/
  dashboardApi.ts                      ← all dashboard API calls

types/
  dashboard.ts                         ← typed response interfaces + EMPTY defaults

backend/app/Services/
  DashboardCacheService.php            ← Redis cache with file fallback

backend/app/Http/Controllers/Api/V1/Dashboard/
  MetricController.php                 ← extend existing with my-summary endpoint

database/migrations/
  xxxx_add_dashboard_indexes.php       ← covering indexes
```

---

## 5. API Contracts — TypeScript Interfaces

All interfaces live in `types/dashboard.ts`. Every numeric field defaults to `0`, every array defaults to `[]`. Backend never returns `null` for numeric/array fields.

```ts
// types/dashboard.ts

export interface QuickStatsResponse {
  total_employees: number;
  present_today: number;
  on_leave: number;
  pending_approvals: number;
  turnover_rate: number;
  avg_tenure_years: number;
  active_openings: number;
  delta: {
    employees: number;
    present: number;
    turnover: number;
  };
}

export interface AttendancePulseResponse {
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  total: number;
  percentage_present: number;
}

export interface TalentTrendsResponse {
  headcount: { month: string; count: number }[];
  turnover: { category: string; count: number }[];
  hiring_funnel: { stage: string; count: number }[];
}

export interface DemographicsResponse {
  gender: { label: string; value: number }[];
  employment_type: { label: string; value: number }[];
  absenteeism_rate: number;
  avg_days_absent: number;
  absenteeism_trend: { month: string; rate: number }[];
}

export interface PayrollSummaryResponse {
  monthly_payroll: number;
  total_employees: number;
  average_pay: number;
  active_runs: number;
  history: { period: string; amount: number }[];
}

export interface PersonalSummaryResponse {
  days_present: number;
  days_absent: number;
  late_days: number;
  leave_balance_total: number;
  clock_status: 'clocked_in' | 'clocked_out' | 'not_started';
  clock_in_time: string | null;
  attendance_by_week: { week: string; present: number; late: number; absent: number }[];
}

export interface PersonalPerformanceResponse {
  current_score: number;
  rating: { label: string; color: string; bgColor: string; borderColor: string } | null;
  department_average: number;
  organization_average: number;
  history: { period: string; score: number; dept_avg: number }[];
  latest_breakdown: { field_label: string; score: number; weight: number; weighted_score: number }[];
  has_submission: boolean;
}

// Safe empty defaults — used as initialData in React Query
export const EMPTY_QUICK_STATS: QuickStatsResponse = {
  total_employees: 0, present_today: 0, on_leave: 0, pending_approvals: 0,
  turnover_rate: 0, avg_tenure_years: 0, active_openings: 0,
  delta: { employees: 0, present: 0, turnover: 0 }
};

export const EMPTY_ATTENDANCE_PULSE: AttendancePulseResponse = {
  present: 0, absent: 0, late: 0, on_leave: 0, total: 0, percentage_present: 0
};

export const EMPTY_PERSONAL_PERFORMANCE: PersonalPerformanceResponse = {
  current_score: 0, rating: null, department_average: 0, organization_average: 0,
  history: [], latest_breakdown: [], has_submission: false
};
```

---

## 6. Redis Caching Strategy

### Cache Driver Config
- Dev: `CACHE_DRIVER=file` — no Redis required, same code path
- Production: `CACHE_DRIVER=redis`
- Fallback: `DashboardCacheService` wraps all cache calls in try/catch — on Redis failure, runs the DB query directly and logs a warning

### Cache Key Format
```
dashboard:{metric}:{user_id}:{scope_id}
```
- `scope_id` = branch_id for branch managers, dept_id for dept heads, `all` for admins
- Ensures different roles never share stale data

### TTL by Data Volatility
| Endpoint | TTL | Reason |
|---|---|---|
| quick-stats | 5 min | Headcount changes infrequently |
| attendance-pulse | 60 sec | Today's clocks update constantly |
| talent-trends / charts | 15 min | Historical data, slow-changing |
| demographics | 1 hour | Very slow-changing |
| my-summary (employee) | 2 min | Personal data, semi-real-time |
| performance/analytics | 10 min | Scores don't change mid-day |
| payroll/metrics | 5 min | Run status changes on approval |

### Cache Invalidation Hooks
Cache is busted on these events via model observers:
- Employee created/updated → invalidate `quick-stats`, `demographics`, `talent-trends`
- AttendanceRecord created → invalidate `attendance-pulse`, `my-summary`
- LeaveRequest approved/rejected → invalidate `quick-stats`, `attendance-pulse`
- PayrollRun status changed → invalidate `payroll/metrics`
- PerformanceSubmission created → invalidate `performance/analytics`, `my-summary`

### WarmCache Command Extension
Extend existing `php artisan cache:warm` to also warm:
- `dash_quick_stats_*` for all admin users
- `dash_attendance_pulse_*` for all admin/manager users
- `dash_demographics_all` once org-wide

---

## 7. Database Indexes

New migration: `xxxx_add_dashboard_performance_indexes.php`

```sql
-- Attendance pulse: today's records by branch
CREATE INDEX idx_att_date_branch_status
  ON attendance_records(attendance_date, branch_id, status);

-- Leave stats by dept
CREATE INDEX idx_leave_dept_status_date
  ON leave_requests(department_id, status, start_date, end_date);

-- Employee headcount over time
CREATE INDEX idx_emp_created_branch_status
  ON employees(created_at, branch_id, status);

-- Terminated employees for turnover calc
CREATE INDEX idx_emp_terminated_branch
  ON employees(branch_id, status)
  WHERE status = 'terminated';

-- Performance submissions by employee + status
CREATE INDEX idx_perf_emp_status_score
  ON performance_submissions(employee_id, status, score, submitted_at);

-- Performance by dept for dept summaries
CREATE INDEX idx_perf_dept_status_score
  ON performance_submissions(department_id, status, score);
```

---

## 8. Frontend Loading Strategy

### Skeleton Loading
- Dashboard mounts → immediately renders `DashboardSkeleton` matching the exact grid layout of the target panel
- Skeleton uses `animate-pulse` with `bg-slate-200 dark:bg-white/10` blocks
- Each widget independently transitions from skeleton → real data as its own query resolves
- No full-page spinner — progressive reveal

### React Query Config
```ts
// useDashboard.ts pattern for every query
useQuery({
  queryKey: ['dashboard', 'quick-stats', view, scopeId],
  queryFn: () => dashboardApi.quickStats(),
  staleTime: 5 * 60 * 1000,       // serve cached data for 5min
  gcTime: 10 * 60 * 1000,         // keep in memory 10min
  initialData: EMPTY_QUICK_STATS,  // never undefined — widgets always have data shape
  retry: 2,
  retryDelay: 1000,
})
```

### Parallel Fetching
All queries for a panel fire simultaneously via `Promise.all` pattern — not waterfall.
Executive panel fires 5 queries in parallel on mount. No query waits for another.

### staleWhileRevalidate
On revisiting the dashboard, cached data renders instantly. Background refresh happens silently.
User never sees a loading state on revisit unless cache has expired.

### Error Boundaries
Each widget is wrapped in an `ErrorBoundary`. If one widget's API call fails:
- Only that widget shows an error state with a retry button
- Rest of the dashboard stays fully functional
- Error state uses same card dimensions as the widget — no layout shift

```tsx
// Error state component — same size as widget
const WidgetError = ({ title, onRetry }) => (
  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
    <span className="text-slate-400 text-sm">Failed to load {title}</span>
    <button onClick={onRetry} className="text-brand-primary text-xs underline">Retry</button>
  </div>
);
```

---

## 9. Theme Compliance Rules

All dashboard components MUST use only these tokens — no hardcoded colors:

| Purpose | Light | Dark |
|---|---|---|
| Card background | `bg-white` | `dark:bg-white/5` |
| Card border | `border-slate-200` | `dark:border-white/10` |
| Primary text | `text-slate-900` | `dark:text-white` |
| Secondary text | `text-slate-500` | `dark:text-slate-400` |
| Muted text | `text-slate-400` | `dark:text-slate-500` |
| Accent / brand | `text-brand-primary` | same |
| Success | `text-emerald-500` | same |
| Warning | `text-amber-500` | same |
| Danger | `text-red-500` | same |
| Skeleton pulse | `bg-slate-200` | `dark:bg-white/10` |

Charts use `chartTheme.ts` utilities (`getTooltipStyles`, `getAxisStyles`, `getGridStyles`) — already theme-aware.
Chart colors use `var(--brand-primary)` for primary series, `#10b981` (emerald) for positive, `#f59e0b` (amber) for warning, `#ef4444` (red) for negative.

---

## 10. Dev vs Production Parity Guarantees

| Risk | Prevention |
|---|---|
| API returns `null` for empty fields | Backend always returns `0` / `[]` / `""` — never `null` for numeric/array fields |
| Redis not running in dev | `CACHE_DRIVER=file` fallback, identical code path |
| Role scope wrong in prod | Backend enforces scope server-side via `ScopeEngine` — frontend never filters |
| Chart crashes on empty array | All chart components handle `data={[]}` with empty state UI |
| TypeScript shape mismatch | Strict typed interfaces + `EMPTY_*` defaults as `initialData` |
| One widget breaks the page | `ErrorBoundary` wraps every widget independently |
| Stale cache after data change | Model observer cache invalidation on key events |
| CEO sees wrong dashboard | `ceo` added to `mapBackendRoleToUserRole` → SUPER_ADMIN, `useDashboard` routes to ExecutiveDashboard |
| Empty DB in dev shows broken UI | `EMPTY_*` defaults + empty state components in every widget |

---

## 11. New Backend Endpoint Required

### GET /api/v1/dashboard/metrics/my-summary
Employee self-service summary. Added to `MetricController`.

Response shape:
```json
{
  "days_present": 18,
  "days_absent": 2,
  "late_days": 3,
  "leave_balance_total": 12,
  "clock_status": "clocked_in",
  "clock_in_time": "08:47:00",
  "attendance_by_week": [
    { "week": "Week 1", "present": 5, "late": 1, "absent": 0 },
    { "week": "Week 2", "present": 4, "late": 0, "absent": 1 }
  ]
}
```

Permission: `auth:sanctum` only — always scoped to the authenticated user's own employee record.
Cache TTL: 2 minutes, key: `dash_my_summary_{user_id}`.

---

## 12. App.tsx Change Required

Pass `userRole` and `userPermissions` into `<Dashboard />`:

```tsx
// In MainApp Routes section — replace current:
<Route path="/" element={<Dashboard />} />

// With:
<Route path="/" element={
  <Dashboard userRole={currentUserRole} userPermissions={userPermissions} userProfile={userProfile} />
} />
```

Also update `mapBackendRoleToUserRole` in `types.ts` to add `ceo`:
```ts
if (roleNames.includes('super_admin') || roleNames.includes('ceo')) return UserRole.SUPER_ADMIN;
```

---

## 13. Implementation Order

1. `types/dashboard.ts` — interfaces and EMPTY defaults
2. `services/dashboardApi.ts` — all API call functions
3. `backend/app/Services/DashboardCacheService.php` — Redis + file fallback
4. `backend/app/Http/Controllers/Api/V1/Dashboard/MetricController.php` — add `mySummary` endpoint
5. `database/migrations/xxxx_add_dashboard_indexes.php` — covering indexes
6. `backend/routes/api.php` — register new my-summary route
7. `pages/dashboard/useDashboard.ts` — hook with all queries
8. `pages/dashboard/DashboardSkeleton.tsx` — skeleton per view
9. Widget components (16 total — see Section 3)
10. Panel components (4 total — Executive, HRAdmin, Manager, Employee)
11. `pages/Dashboard.tsx` — orchestrator, wire everything together
12. `App.tsx` — pass props to Dashboard, fix CEO role mapping
13. `types.ts` — add `ceo` to `mapBackendRoleToUserRole`

---

## 14. Aesthetic Reference

Based on the provided design screenshot:
- Dashboard title: large italic mixed-weight typography ("ANALYTICS DASHBOARD")
- KPI cards: dark card background, large bold number, small uppercase label, colored delta badge
- Charts: dark card background, subtle grid lines, brand-colored primary series
- Right sidebar: stacked list widgets (Quick Reports, Top Performers, Analytics Activity)
- Spacing: generous padding, rounded-2xl cards, consistent gap-6 grid
- All panels match this aesthetic — adapted for light mode using theme tokens above

---

## 16. Styling Applied to Our Widgets (Corrected Reference)

The image is a STYLING REFERENCE ONLY. The metrics, labels and content in the image are irrelevant.
What we extract from it and apply to OUR planned widgets:

### Styling Language Extracted from Image
- White card, very subtle border (`border-slate-100`), no heavy shadow (`shadow-sm`)
- Rounded corners: `rounded-2xl` on all cards
- KPI value: very large (`text-3xl md:text-4xl`), bold, brand-colored
- KPI label: tiny (`text-[10px]`), uppercase, wide letter-spacing, muted slate
- Delta badge: tiny inline text top-right, green positive / red negative, no pill background
- Chart card header: small semibold title left, small brand-colored action link right
- List/sidebar cards: left border accent (`border-l-2 border-brand-primary`) per item
- Page title: large italic black font, brand-colored, subtitle in tiny uppercase tracking-widest
- Tab toggle: filled brand pill for active, ghost text for inactive
- Area charts: brand-colored fill at low opacity, solid stroke
- No left accent stripe on KPI cards (unlike the existing MetricCard.tsx)
- Hover: subtle shadow lift only (`hover:shadow-md`)

---

### How This Applies to Each of OUR Widgets

**HeadcountChart** (our widget, image styling)
- Card shell: `bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-6 shadow-sm`
- Header: "Headcount Over Time" left, "View Details →" right in brand color
- Chart: area chart, brand-color fill at 15% opacity, solid brand stroke
- X-axis labels: tiny muted slate, no grid lines on Y

**AttendancePulse** (our widget, image styling)
- Card shell: same base
- Header: "Attendance Health" left
- Donut chart center: brand-color for present, emerald for on-time, amber for late, red for absent
- Legend: dot + label + count, stacked right side

**TurnoverChart** (our widget, image styling)
- Card shell: same base
- Header: "Employee Turnover" left, delta badge inline
- Horizontal bar chart, brand-color bars

**LeaveStatisticsChart** (our widget, image styling)
- Card shell: same base
- Header: "Leave Statistics" left
- Stacked bar chart per department

**PayrollSummaryCard** (our widget, image styling)
- Card shell: same base
- Header: "Payroll Summary" left
- Large net pay value in brand color (same scale as KPI card value)
- Sub-row: employee count, active runs, avg pay in muted text

**PendingApprovalsWidget** (our widget, image styling — list card)
- Card shell: same base
- Header: "Pending Approvals" left, count badge right
- Each item: left border accent, requester name, type, date, action buttons

**TeamAttendanceWidget** (our widget, image styling — list card)
- Card shell: same base
- Header: "Team Attendance" left, today's date right
- Each row: avatar + name + status badge (present/late/absent)

**DemographicsChart** (our widget, image styling)
- Card shell: same base
- Header: "Employee Demographics" left
- Donut chart left, legend right

**PerformanceSnapshotWidget** (our widget, image styling)
- Card shell: same base
- Header: "Performance Overview" left
- Org avg score large brand-colored value
- Score distribution as horizontal bars below

**PersonalScoreCard** (our widget, image styling)
- Card shell: same base
- Header: "My Performance Score" left, period selector right
- Large score value in dynamic rating color (from scoring engine)
- Rating badge below value
- Score vs dept avg vs org avg: 3 small comparison bars
- Trend line chart below

**MyLeaveBalanceWidget** (our widget, image styling)
- Card shell: same base
- Header: "Leave Balance" left
- Each leave type: label + progress bar + used/available numbers
- Progress bar: brand-color fill on slate track

**MyAttendanceSummary** (our widget, image styling)
- Card shell: same base
- Header: "My Attendance" left, month label right
- Bar chart: present (brand), late (amber), absent (red) per week

**TopPerformersWidget** (our widget, image styling — list card)
- Card shell: same base
- Header: "Top Performers" left
- Each row: rank medal emoji + name + dept + score badge

**QuickActionsWidget** (our widget, image CTA card styling)
- Card shell: `bg-brand-primary rounded-2xl p-6 text-white`
- Title italic bold white
- Action buttons: white background, brand-colored text, full width, rounded-xl

**KPI Cards for all 4 panels** (our metrics, image styling)
- Total Employees → large brand-colored number, "TOTAL EMPLOYEES" label, month delta
- Present Today → large emerald number, "PRESENT TODAY" label, % delta
- On Leave → large amber number, "ON LEAVE" label
- Pending Approvals → large brand number, "PENDING APPROVALS" label
- Team Size → large brand number, "TEAM SIZE" label
- My Performance Score → large dynamic-colored number, "MY SCORE" label, rating text below
- Days Present → large emerald number, "DAYS PRESENT" label
- Leave Balance → large brand number, "LEAVE BALANCE" label

---

### What Does NOT Change from the Image
- We do NOT use "NEXUS", "AI Strategic Summary", "Enterprise Plan", "Upcoming Milestones" — those are image artifacts
- We do NOT use the image's metrics (headcount 94.2%, burnout 2.1, open req 14)
- We use OUR data from OUR API endpoints as defined in Sections 4 and 11
- The image only tells us: card shape, font scale, color treatment, spacing, shadow level
