# Manual Employee Import Steps

Since automated SSH from Windows requires interactive confirmation, here are the manual steps to import employee data to production.

## Step 1: Upload Export File

### Option A: Using FileZilla or WinSCP (Recommended)
1. Open FileZilla or WinSCP
2. Connect to production:
   - Host: `156.67.218.107` or `sftp://156.67.218.107`
   - Username: `u237094395`
   - Password: `Solotech@123`
   - Port: `22`

3. Navigate to: `/home/u237094395/domains/royalgatewayadmin.com/public_html/backend/storage/app/`

4. Upload the file:
   - Local file: `C:\RoyalgatewayAdmin\backend\storage\app\employee_attendance_export_2026-03-12_164445.json`
   - Remote location: `/home/u237094395/domains/royalgatewayadmin.com/public_html/backend/storage/app/`

### Option B: Using Command Line (After accepting host key)
```powershell
# First time only - accept the host key
ssh u237094395@156.67.218.107

# Then upload the file
scp backend/storage/app/employee_attendance_export_2026-03-12_164445.json u237094395@156.67.218.107:/home/u237094395/domains/royalgatewayadmin.com/public_html/backend/storage/app/
```

## Step 2: SSH into Production

```powershell
ssh u237094395@156.67.218.107
```

Password: `Solotech@123`

## Step 3: Navigate to Backend Directory

```bash
cd /home/u237094395/domains/royalgatewayadmin.com/public_html/backend
```

## Step 4: Check if Oluwatosin Fanimo Exists (Optional)

```bash
php check-employee-production.php
```

This will show if the employee already exists in production.

## Step 5: Run the Import

```bash
php import-employees-from-dev.php employee_attendance_export_2026-03-12_164445.json
```

You will be prompted to confirm. Type `yes` and press Enter.

## Step 6: Verify Import

After import completes, verify the data:

```bash
# Check if employee exists
php check-employee-production.php

# Or use Laravel Tinker
php artisan tinker
>>> \App\Models\Employee::where('first_name', 'Oluwatosin')->where('last_name', 'Fanimo')->first()
>>> \App\Models\Employee::count()
>>> exit
```

## Expected Output

After successful import, you should see:

```
=================================================
✓ Import completed successfully!
=================================================

Summary:
  - Employees: 34 imported/updated
  - Salaries: 13 imported/updated
  - Attendance Records: 1320 imported/updated
  - Attendance Logs: 5 imported
```

## What Gets Imported

### Oluwatosin Fanimo's Data:
- ✅ Employee profile (ID: 32, Code: 1023)
- ✅ Email: tosinfanimo3@gmail.com
- ✅ 111 attendance records
- ✅ Salary information
- ✅ All employment details

### All Other Employees:
- ✅ 33 other employees
- ✅ 1,209 other attendance records
- ✅ Complete salary structures
- ✅ All related data

## Troubleshooting

### Issue: "File not found"
**Solution:** Ensure the export file was uploaded to the correct directory:
```bash
ls -la /home/u237094395/domains/royalgatewayadmin.com/public_html/backend/storage/app/employee_attendance_export_2026-03-12_164445.json
```

### Issue: "Permission denied"
**Solution:** Check file permissions:
```bash
chmod 644 /home/u237094395/domains/royalgatewayadmin.com/public_html/backend/storage/app/employee_attendance_export_2026-03-12_164445.json
```

### Issue: "Database connection error"
**Solution:** Check the `.env` file has correct production database credentials:
```bash
cat .env | grep DB_
```

### Issue: "Column not found"
**Solution:** Run migrations to ensure database schema is up to date:
```bash
php artisan migrate --force
```

## Alternative: Use GitHub Actions

If you prefer automated deployment, I can create a GitHub Actions workflow that will:
1. Upload the export file
2. Run the import automatically
3. Verify the results

Let me know if you'd like me to create this workflow!

## Quick Reference

**Production Server:** 156.67.218.107  
**Username:** u237094395  
**Password:** Solotech@123  
**Backend Path:** /home/u237094395/domains/royalgatewayadmin.com/public_html/backend  
**Export File:** employee_attendance_export_2026-03-12_164445.json  
**File Size:** 1,330.95 KB  
**Total Records:** 34 employees, 1,320 attendance records
