# Talent Management - Testing Guide

## Pre-Testing Setup

### 1. Database Setup
```bash
cd backend

# Run migrations
php artisan migrate

# Seed sample data
php artisan db:seed --class=TalentSeeder

# Verify tables created
php artisan tinker
>>> \App\Models\JobOpening::count()
>>> \App\Models\Candidate::count()
>>> \App\Models\Application::count()
```

Expected output:
- 6 job openings
- 5 candidates
- ~5-10 applications

### 2. Start Servers
```bash
# Terminal 1 - Backend
cd backend
php artisan serve
# Should run on http://localhost:8000

# Terminal 2 - Frontend
npm run dev
# Should run on http://localhost:5173 (or your configured port)
```

### 3. Login
- Use any existing user account
- Ensure user has `onboarding.view` permission

---

## Test Suite 1: Backend API Testing

### Test 1.1: Get Job Openings
```bash
# Get auth token first
TOKEN="your_auth_token_here"

# Test: List all jobs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/talent/jobs

# Expected: JSON array with 6 jobs
# Verify: Each job has title, department, location, status
```

**✅ Pass Criteria:**
- Returns 200 status
- Contains 6 job objects
- Each job has required fields
- Active jobs are included

### Test 1.2: Get Job Statistics
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/talent/jobs/statistics

# Expected: 
# {
#   "total_active": 6,
#   "total_draft": 0,
#   "total_closed": 0,
#   "total_applications": X
# }
```

**✅ Pass Criteria:**
- Returns statistics object
- Numbers match seeded data

### Test 1.3: Get Single Job
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/talent/jobs/1

# Expected: Single job object with full details
```

**✅ Pass Criteria:**
- Returns 200 status
- Contains full job details
- Includes department and branch relationships

### Test 1.4: Apply for Job (with file)
```bash
# Create a test PDF file first
echo "Test Resume" > test_resume.pdf

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "cover_letter=I am very interested in this position" \
  -F "resume=@test_resume.pdf" \
  http://localhost:8000/api/talent/jobs/1/apply

# Expected: Application created successfully
```

**✅ Pass Criteria:**
- Returns 201 status
- Application object returned
- File uploaded successfully
- Candidate created/linked

### Test 1.5: Get My Applications
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/talent/applications/me

# Expected: Array of user's applications
```

**✅ Pass Criteria:**
- Returns user's applications only
- Includes job details
- Shows correct stages

### Test 1.6: Permission Testing
```bash
# Test without auth token (should fail)
curl http://localhost:8000/api/talent/jobs

# Expected: 401 Unauthorized

# Test with invalid token (should fail)
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:8000/api/talent/jobs

# Expected: 401 Unauthorized
```

**✅ Pass Criteria:**
- Unauthorized requests are rejected
- Proper error messages returned

---

## Test Suite 2: Frontend UI Testing

### Test 2.1: Navigation
1. Login to application
2. Navigate to "Talent Management" from sidebar
3. Verify page loads without errors

**✅ Pass Criteria:**
- Page loads successfully
- No console errors
- Tabs are visible
- Default tab is "Job Openings"

### Test 2.2: Job Listings View
1. On Talent Management page
2. Verify job cards are displayed
3. Check for 6 job openings

**✅ Pass Criteria:**
- 6 job cards visible
- Each card shows:
  - Job title
  - Department
  - Location
  - Applicant count
  - Status badge
  - "Apply Now" button
- Loading skeleton shown initially
- No errors in console

### Test 2.3: Search Functionality
1. Type "Engineer" in search box
2. Verify filtered results

**✅ Pass Criteria:**
- Results filter in real-time
- Shows jobs matching "Engineer"
- Result count updates
- "Clear Filters" button appears

### Test 2.4: Filter by Department
1. Select "Engineering" from department dropdown
2. Verify filtered results

**✅ Pass Criteria:**
- Only Engineering jobs shown
- Other departments hidden
- Result count updates

### Test 2.5: Filter by Employment Type
1. Select "Full Time" from type dropdown
2. Verify filtered results

**✅ Pass Criteria:**
- Only full-time jobs shown
- Part-time/contract/intern hidden
- Result count updates

### Test 2.6: Job Details Modal
1. Click on any job card
2. Verify modal opens

**✅ Pass Criteria:**
- Modal opens smoothly
- Shows full job details:
  - Title and status
  - Department, location, type
  - Experience level
  - Number of openings
  - Posted/closing dates
  - Full description
  - Responsibilities
  - Requirements
- "Apply for this Position" button visible
- Close button works

### Test 2.7: Application Form Modal
1. Click "Apply Now" on any job
2. Verify application form opens

**✅ Pass Criteria:**
- Modal opens with form
- Shows job title
- Cover letter textarea visible
- Resume upload area visible
- Referral ID field visible
- Character counter works (0/5000)
- Submit button disabled when empty

### Test 2.8: Submit Application (No Resume)
1. Open application form
2. Enter cover letter: "I am interested in this position"
3. Click "Submit Application"

**✅ Pass Criteria:**
- Form submits successfully
- Toast notification shows "Application submitted successfully"
- Modal closes
- Redirects to "My Applications" tab
- New application appears in list

### Test 2.9: Submit Application (With Resume)
1. Open application form for different job
2. Enter cover letter
3. Click "Click to upload resume"
4. Select a PDF file
5. Verify file name appears
6. Click "Submit Application"

**✅ Pass Criteria:**
- File upload works
- File name and size displayed
- Form submits with file
- Success notification shown
- Application appears in "My Applications"

### Test 2.10: File Validation
1. Open application form
2. Try uploading a .txt file

**✅ Pass Criteria:**
- Alert shows: "Please upload a PDF or Word document"
- File not accepted

2. Try uploading a file > 5MB

**✅ Pass Criteria:**
- Alert shows: "File size must be less than 5MB"
- File not accepted

### Test 2.11: My Applications Tab
1. Click "My Applications" tab
2. Verify applications list

**✅ Pass Criteria:**
- Shows all submitted applications
- Each application shows:
  - Job title
  - Department
  - Applied date
  - Current stage badge
  - Progress bar
  - Timeline with stages
- Current stage highlighted in orange
- Completed stages shown in orange
- Future stages shown in gray

### Test 2.12: Application Progress Timeline
1. View an application in "screening" stage
2. Verify timeline visualization

**✅ Pass Criteria:**
- Timeline shows all stages: applied → screening → technical → interview → offer → hired
- Current stage (screening) highlighted
- Previous stage (applied) shown as complete
- Future stages shown as inactive
- Progress bar shows ~20%

### Test 2.13: Empty States
1. Create new user with no applications
2. Navigate to "My Applications"

**✅ Pass Criteria:**
- Shows empty state with icon
- Message: "No Applications Yet"
- Helpful text displayed

### Test 2.14: Permission-Based Tab Visibility

**As Employee:**
- ✅ Can see: Job Openings, My Applications, Orientation
- ❌ Cannot see: Dashboard, Candidates, Settings

**As Manager/HR:**
- ✅ Can see: All tabs including Dashboard, Candidates, Settings

### Test 2.15: Dark Mode
1. Toggle dark mode in app
2. Navigate to Talent Management

**✅ Pass Criteria:**
- All components render correctly in dark mode
- Text is readable
- Contrast is sufficient
- Orange accent color visible
- GlassCard effects work

### Test 2.16: Responsive Design
1. Resize browser to mobile width (375px)
2. Test all features

**✅ Pass Criteria:**
- Layout adapts to mobile
- Tabs stack vertically or scroll
- Job cards stack vertically
- Modals are scrollable
- Buttons are touch-friendly
- No horizontal scroll

---

## Test Suite 3: Performance Testing

### Test 3.1: Page Load Time
1. Open browser DevTools (Network tab)
2. Navigate to Talent Management
3. Measure load time

**✅ Pass Criteria:**
- Initial page load < 2 seconds
- API response time < 500ms
- No unnecessary re-renders

### Test 3.2: Caching
1. Navigate to Talent Management
2. Note API calls in Network tab
3. Navigate away and back
4. Check if API is called again

**✅ Pass Criteria:**
- Data served from cache (no API call)
- Cache expires after 5 minutes
- Mutations invalidate cache

### Test 3.3: Optimistic Updates
1. Submit an application
2. Watch UI update

**✅ Pass Criteria:**
- Application appears immediately in list
- No loading spinner for list update
- If submission fails, application removed from list

---

## Test Suite 4: Security Testing

### Test 4.1: SQL Injection
```bash
# Try SQL injection in search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/talent/jobs?search='; DROP TABLE job_openings; --"
```

**✅ Pass Criteria:**
- No SQL error
- Query safely escaped
- Returns empty results or safe results

### Test 4.2: XSS Prevention
1. Create job with title: `<script>alert('XSS')</script>`
2. View job in frontend

**✅ Pass Criteria:**
- Script not executed
- HTML escaped and displayed as text

### Test 4.3: File Upload Security
1. Try uploading .exe file
2. Try uploading .php file

**✅ Pass Criteria:**
- Files rejected
- Only PDF/DOC/DOCX accepted

### Test 4.4: Permission Bypass Attempt
```bash
# Try accessing admin endpoint as employee
curl -X POST \
  -H "Authorization: Bearer $EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hacker Job","status":"active"}' \
  http://localhost:8000/api/talent/jobs
```

**✅ Pass Criteria:**
- Returns 403 Forbidden
- Job not created
- Error message clear

---

## Test Suite 5: Integration Testing

### Test 5.1: End-to-End Application Flow
1. Login as employee
2. Browse jobs
3. Search for "Engineer"
4. Click on "Senior Software Engineer"
5. Click "Apply Now"
6. Fill cover letter
7. Upload resume
8. Submit application
9. Go to "My Applications"
10. Verify application appears

**✅ Pass Criteria:**
- All steps complete without errors
- Data persists correctly
- UI updates appropriately
- Notifications shown

### Test 5.2: Multiple Applications
1. Apply for 3 different jobs
2. Check "My Applications"

**✅ Pass Criteria:**
- All 3 applications visible
- Each shows correct job
- Stages are independent
- No data mixing

### Test 5.3: Concurrent Users
1. Login as User A
2. Login as User B (different browser)
3. Both apply for same job
4. Check applications

**✅ Pass Criteria:**
- Both applications created
- No conflicts
- Each user sees only their applications
- Applicant count increments correctly

---

## Test Suite 6: Error Handling

### Test 6.1: Network Error
1. Stop backend server
2. Try to load jobs

**✅ Pass Criteria:**
- Error toast shown
- Graceful error message
- No app crash
- Retry option available

### Test 6.2: Duplicate Application
1. Apply for a job
2. Try applying for same job again

**✅ Pass Criteria:**
- Error message: "You have already applied for this position"
- Application not duplicated
- User informed clearly

### Test 6.3: Invalid Job ID
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/talent/jobs/99999
```

**✅ Pass Criteria:**
- Returns 404 Not Found
- Clear error message

---

## Test Checklist Summary

### Backend Tests
- [ ] API endpoints return correct data
- [ ] Authentication required
- [ ] Permissions enforced
- [ ] File uploads work
- [ ] Validation works
- [ ] Error handling proper

### Frontend Tests
- [ ] Page loads without errors
- [ ] Job listings display correctly
- [ ] Search and filters work
- [ ] Modals open and close
- [ ] Forms submit successfully
- [ ] File upload works
- [ ] Application tracking works
- [ ] Empty states display
- [ ] Loading states display
- [ ] Dark mode works
- [ ] Responsive design works

### Performance Tests
- [ ] Page loads quickly
- [ ] Caching works
- [ ] Optimistic updates work
- [ ] No memory leaks

### Security Tests
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] File upload secured
- [ ] Permissions enforced
- [ ] CSRF protection works

### Integration Tests
- [ ] End-to-end flow works
- [ ] Multiple applications work
- [ ] Concurrent users work
- [ ] Data persists correctly

---

## Common Issues & Solutions

### Issue: "No jobs found"
**Solution**: Run seeder: `php artisan db:seed --class=TalentSeeder`

### Issue: "Unauthorized" error
**Solution**: Check auth token is valid and user has `onboarding.view` permission

### Issue: File upload fails
**Solution**: 
- Check file size < 5MB
- Check file type is PDF/DOC/DOCX
- Check storage permissions

### Issue: Applications not showing
**Solution**: 
- Check user has submitted applications
- Check API endpoint returns data
- Check React Query cache

### Issue: Dark mode not working
**Solution**: Check Tailwind dark mode classes are applied

---

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors
5. Network tab errors
6. Screenshots if applicable

---

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ No network errors
- ✅ Proper error handling
- ✅ Good user experience
- ✅ Fast performance
- ✅ Secure implementation

---

## Next Steps After Testing

1. Fix any bugs found
2. Optimize performance bottlenecks
3. Add missing features
4. Write automated tests
5. Deploy to staging
6. User acceptance testing
7. Deploy to production
