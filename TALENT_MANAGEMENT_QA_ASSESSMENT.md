# Talent Management Module - QA Assessment & Role-Based Restructure

## Executive Summary

Quality assurance assessment of the Talent Management module (recruitment, onboarding, talent acquisition) with recommendations for implementing comprehensive role-based access control and employee self-service capabilities.

**Module Scope**: Recruitment, Candidate Pipeline, Onboarding, Talent Acquisition
**Note**: This is separate from Performance Management (employee evaluations)

---

## Current State Analysis

### What Exists Today

#### Frontend Components
**Main Page**: `pages/TalentManagement.tsx`

**Tabs**:
1. **Dashboard** - Hiring metrics, funnel visualization (management only)
2. **Job Openings** - Active requisitions, applicant tracking
3. **Candidates** - Applicant pipeline, interview stages (management only)
4. **Orientation** - Onboarding tasks, document uploads
5. **Settings** - Workflow templates, notifications (management only)

**Current Role Logic**:
```typescript
const isManagement = user.primary_role_id <= 3; // HR Admin, Manager, CEO
```

#### Backend Implementation
**Database Tables**:
- `onboarding_templates` - Reusable onboarding workflows
- `onboarding_template_tasks` - Task definitions
- `onboarding_cases` - Employee onboarding instances
- `onboarding_tasks` - Assigned tasks
- `onboarding_task_comments` - Collaboration
- `onboarding_task_attachments` - Documents

**Controllers**: `OnboardingController.php`
**Services**: `OnboardingService.php`
**Permissions**: `onboarding.view`, `onboarding.create`, `onboarding.update`, `onboarding.assign-tasks`

---

## Critical Quality Issues

### 1. ⚠️ Mock Data in Production Code (SEVERITY: HIGH)

**Problem**: All recruitment/candidate data is hardcoded
```typescript
export const JOB_OPENINGS_DATA: JobOpening[] = [
  { id: 'JOB-001', title: 'Senior Software Engineer', ... }
];
```

**Impact**:
- No real job posting functionality
- Cannot track actual candidates
- Dashboard metrics are fake
- No applicant tracking system

**Fix Required**: Build complete recruitment backend with database tables

### 2. ⚠️ Broken Role-Based Access (SEVERITY: MEDIUM)

**Problem**: Uses hardcoded role IDs instead of permission system
```typescript
const isManagement = user.primary_role_id <= 3;
```

**Issues**:
- Bypasses existing ScopeEngine infrastructure
- Fragile (breaks if role IDs change)
- No granular permissions
- Doesn't respect scope levels (branch/department)

**Fix Required**: Use permission system with ScopeEngine

### 3. ⚠️ No Employee Self-Service (SEVERITY: MEDIUM)

**Problem**: Employees can only:
- View job openings (read-only, cannot apply)
- See their orientation tasks (limited interaction)

**Missing**:
- Internal job application
- Career development tracking
- Referral submissions
- Interactive onboarding portal

### 4. ⚠️ Missing Recruitment Backend (SEVERITY: HIGH)

**Problem**: No backend for:
- Job posting management
- Candidate applications
- Interview scheduling
- Offer management
- Hiring workflows

**Current State**: Frontend UI exists but connects to nothing

### 5. ⚠️ Weak Onboarding Experience (SEVERITY: MEDIUM)

**Problem**: OrientationView shows:
- Hardcoded 65% progress
- Mock task list
- No real task completion
- Document upload UI without backend

---

## Recommended Architecture

### Three-Portal Structure


#### A. Employee Self-Service Portal
**Route**: `/talent/employee/*`
**Permission**: `onboarding.view` (scope: self)

**Features**:

**My Onboarding**
- View assigned tasks with real-time progress
- Complete orientation modules
- Upload required documents (ID, contracts, certifications)
- Track onboarding completion percentage
- Access company handbook and policies
- View welcome videos and training materials

**Internal Job Board**
- Browse open positions across company
- Filter by department, location, level
- Apply for internal transfers/promotions
- Track application status in real-time
- View job recommendations based on skills
- Save favorite positions

**Career Development**
- View career paths and progression options
- Access training catalog and courses
- Track skill development and certifications
- Set personal career goals
- Request mentorship
- View promotion requirements

**Referral Program**
- Submit employee referrals with details
- Track referral status through pipeline
- View referral bonuses and rewards
- Access referral guidelines

---

#### B. Recruiter/HR Portal
**Route**: `/talent/recruiter/*`
**Permission**: `onboarding.view` (scope: department/branch/all)

**Features**:

**Job Management**
- Create/edit job postings with rich descriptions
- Set hiring workflow stages (screening → interview → offer)
- Define interview panels and evaluators
- Manage job requisition approvals
- Publish to internal/external job boards
- Set application deadlines

**Candidate Pipeline**
- View all applicants by stage
- Drag-and-drop candidates through pipeline
- Schedule interviews with calendar integration
- Add candidate notes and ratings
- Collaborate with hiring managers
- Send automated status updates
- Filter by source, rating, stage

**Onboarding Management**
- Create onboarding cases for new hires
- Assign task owners (HR, IT, Manager)
- Monitor completion progress dashboard
- Review submitted documents
- Approve/reject task completion
- Send reminders for overdue tasks
- Generate onboarding reports

**Interview Management**
- Schedule interview slots
- Send calendar invites to panels
- Collect interviewer feedback
- Aggregate interview scores
- Track interview completion

**Analytics & Reporting**
- Time-to-hire metrics by department
- Source effectiveness (LinkedIn, Indeed, Referrals)
- Funnel conversion rates
- Onboarding completion rates
- Hiring velocity trends
- Cost-per-hire analysis
- Diversity metrics

---

#### C. Admin/Settings Portal
**Route**: `/talent/admin/*`
**Permission**: `onboarding.update` (scope: all)

**Features**:

**Template Management**
- Create onboarding templates by role/department
- Define task workflows with dependencies
- Set default owners and due dates
- Map templates to departments/designations
- Clone and version templates
- Preview template before activation

**Workflow Configuration**
- Define hiring stages (Applied → Screening → Interview → Offer)
- Set approval workflows for job postings
- Configure auto-rejection rules
- Customize application forms
- Set SLA timers for each stage

**Integration Settings**
- Job board integrations (LinkedIn, Indeed, Glassdoor)
- ATS connections
- Background check providers
- E-signature platforms (DocuSign)
- Calendar integrations (Google, Outlook)

**Notification Rules**
- Application received confirmations
- Interview reminders
- Offer letter notifications
- Onboarding task reminders
- Overdue task escalations

---

## Implementation Roadmap

### Phase 1: Backend Foundation (Priority: HIGH)
**Timeline**: 2-3 weeks

**Tasks**:
1. Create database migrations:
   ```sql
   - job_openings (title, department, location, status, posted_date)
   - candidates (name, email, phone, source, rating)
   - applications (candidate_id, job_id, stage, applied_date)
   - interviews (application_id, scheduled_date, interviewer_id, feedback)
   - candidate_notes (application_id, user_id, note, created_at)
   ```

2. Build controllers:
   - `JobOpeningController` - CRUD for job postings
   - `CandidateController` - Candidate management
   - `ApplicationController` - Application tracking

3. Implement services:
   - `RecruitmentService` - Job posting logic
   - `ApplicationTrackingService` - Pipeline management
   - `InterviewSchedulingService` - Interview coordination

4. Add API routes with permission middleware:
   ```php
   Route::middleware(['permission:onboarding.view,scope'])->group(function () {
       Route::get('/jobs', [JobOpeningController::class, 'index']);
       Route::post('/jobs/{id}/apply', [ApplicationController::class, 'apply']);
   });
   ```

### Phase 2: Employee Self-Service (Priority: MEDIUM)
**Timeline**: 2 weeks

**Tasks**:
1. Build real OrientationView:
   - Fetch actual onboarding case from API
   - Display real tasks with status badges
   - Implement task completion actions
   - Add document upload with validation
   - Show real-time progress calculation

2. Create internal job board:
   - Display open positions from database
   - Build application submission form
   - Track application status
   - Add job search and filters

3. Add career development section:
   - Skill tracking interface
   - Training catalog integration
   - Career path visualization

### Phase 3: Role-Based Access Control (Priority: HIGH)
**Timeline**: 1 week

**Tasks**:
1. Replace hardcoded role checks:
   ```typescript
   // Before
   const isManagement = user.primary_role_id <= 3;
   
   // After
   const canViewCandidates = hasPermission('onboarding.view', 'department');
   const canManageTemplates = hasPermission('onboarding.update', 'all');
   ```

2. Apply ScopeEngine to all queries:
   ```php
   $query = Application::query();
   $query = $this->scopeEngine->applyScope($query, $user, 'onboarding.view');
   ```

3. Implement scope-based filtering:
   - Branch recruiters see branch candidates only
   - Department HR sees department onboarding
   - Employees see only their own data

4. Add permission checks to all API endpoints

### Phase 4: Advanced Features (Priority: LOW)
**Timeline**: 3-4 weeks

**Tasks**:
1. Interview scheduling system with calendar sync
2. Offer letter generation with templates
3. Background check integration
4. Candidate communication portal
5. Hiring workflow automation
6. AI-powered candidate matching
7. Video interview integration

---

## Database Schema Additions

### Recruitment Tables

```sql
CREATE TABLE job_openings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department_id BIGINT,
    branch_id BIGINT,
    location VARCHAR(255),
    employment_type ENUM('full_time', 'part_time', 'contract', 'intern'),
    experience_level ENUM('entry', 'mid', 'senior', 'lead', 'executive'),
    openings INT DEFAULT 1,
    status ENUM('draft', 'active', 'on_hold', 'closed') DEFAULT 'draft',
    posted_date DATE,
    closing_date DATE,
    created_by BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(status),
    INDEX(department_id),
    INDEX(posted_date)
);

CREATE TABLE candidates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    resume_path VARCHAR(500),
    linkedin_url VARCHAR(500),
    source ENUM('linkedin', 'indeed', 'referral', 'direct', 'agency'),
    overall_rating DECIMAL(3,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(email),
    INDEX(source)
);

CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    candidate_id BIGINT NOT NULL,
    job_opening_id BIGINT NOT NULL,
    stage ENUM('applied', 'screening', 'technical', 'interview', 'offer', 'hired', 'rejected'),
    status ENUM('active', 'withdrawn', 'rejected', 'hired'),
    applied_date TIMESTAMP,
    cover_letter TEXT,
    referrer_employee_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(candidate_id),
    INDEX(job_opening_id),
    INDEX(stage),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE CASCADE
);

CREATE TABLE interviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    application_id BIGINT NOT NULL,
    interview_type ENUM('phone', 'video', 'in_person', 'technical', 'panel'),
    scheduled_date DATETIME,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(255),
    meeting_link VARCHAR(500),
    interviewer_id BIGINT,
    feedback TEXT,
    rating DECIMAL(3,2),
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(application_id),
    INDEX(scheduled_date),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);

CREATE TABLE candidate_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    application_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    note TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    INDEX(application_id),
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
);
```

---

## Security Considerations

### Permission Matrix

| Role | Job Openings | Candidates | Applications | Onboarding | Templates |
|------|-------------|-----------|-------------|-----------|-----------|
| **Employee** | View (all) | - | View (own) | View (own) | - |
| **Manager** | View (dept) | View (dept) | View (dept) | View (team) | - |
| **Recruiter** | Full (dept) | Full (dept) | Full (dept) | Create (dept) | View |
| **HR Admin** | Full (all) | Full (all) | Full (all) | Full (all) | Full |
| **Super Admin** | Full (all) | Full (all) | Full (all) | Full (all) | Full |

### Data Privacy
- Candidate PII must be encrypted at rest
- Resume files stored in secure S3 bucket
- Access logs for all candidate data views
- GDPR compliance for candidate data deletion
- Interview feedback visible only to hiring team

---

## Testing Requirements

### Unit Tests
- OnboardingService case creation
- Template resolution logic
- Task completion percentage calculation
- Permission scope filtering

### Integration Tests
- Job application workflow end-to-end
- Onboarding case creation on hire
- Document upload and retrieval
- Interview scheduling

### E2E Tests
- Employee applies for internal job
- Recruiter moves candidate through pipeline
- New hire completes onboarding tasks
- Admin creates and publishes template

---

## Success Metrics

### Employee Engagement
- % of employees completing onboarding within 30 days
- Internal job application rate
- Employee referral submission rate
- Career development portal usage

### Recruitment Efficiency
- Time-to-hire reduction (target: <30 days)
- Cost-per-hire reduction
- Source effectiveness improvement
- Candidate experience score (NPS)

### System Adoption
- % of recruiters using system daily
- % of onboarding tasks completed on time
- Template reuse rate
- User satisfaction score

---

## Conclusion

The Talent Management module requires significant development to move from mock data to a production-ready system. Priority should be:

1. **Build recruitment backend** - Critical for functionality
2. **Implement proper RBAC** - Security and scalability
3. **Enhance employee self-service** - User experience
4. **Add advanced features** - Competitive advantage

Estimated total effort: 8-10 weeks for full implementation.
