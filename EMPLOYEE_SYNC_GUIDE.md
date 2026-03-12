# Employee & Attendance Data Sync Guide

## Overview

This guide explains how to sync employee and attendance data from your development database to production. This includes Fanimo Oluwatosin and all other employees with their complete attendance records.

## Export Completed ✅

**Export File:** `employee_attendance_export_2026-03-12_164445.json`  
**Location:** `backend/storage/app/`  
**Size:** 1,330.95 KB

### Exported Data Summary

- **34 Employees** (including Fanimo Oluwatosin)
- **13 Salary Records**
- **1,320 Attendance Records**
- **5 Attendance Logs**

## How to Import to Production

### Method 1: Using PowerShell Script (Recommended)

1. **Copy the export file to production server:**
   ```powershell
   # Copy to production server
   scp backend/storage/app/employee_attendance_export_2026-03-12_164445.json user@production:/path/to/backend/storage/app/
   ```

2. **SSH into production server and run:**
   ```bash
   cd /path/to/backend
   php import-employees-from-dev.php employee_attendance_export_2026-03-12_164445.json
   ```

### Method 2: Manual PHP Script

```bash
# On production server
cd backend
php import-employees-from-dev.php employee_attendance_export_2026-03-12_164445.json
```

### Method 3: Using PowerShell Wrapper

```powershell
# After copying file to production
cd scripts
.\sync-employees-to-production.ps1 -Action import -ExportFile employee_attendance_export_2026-03-12_164445.json
```

## What Gets Imported

### 1. Employee Data
- Employee codes, biometric IDs
- Personal information (name, email, phone, DOB)
- Employment details (hire date, status, type)
- Branch, department, designation assignments
- Manager assignments
- Salary information
- Bank details
- Academic information

### 2. Salary Records
- Base salary amounts
- Salary structure assignments
- Effective dates
- Active status

### 3. Attendance Records
- Check-in and check-out times
- Work minutes, late minutes, overtime
- Attendance status
- Geofence data (if applicable)
- Approval status
- Payroll lock status

### 4. Attendance Logs
- Individual check-in/check-out logs
- Timestamps
- Location data
- Device information
- Verification status

## Safety Features

✅ **Transaction-based**: All imports happen in a single database transaction  
✅ **Rollback on error**: If anything fails, all changes are reverted  
✅ **Duplicate handling**: Existing records are updated, not duplicated  
✅ **Confirmation prompt**: Asks for confirmation before importing  
✅ **Environment check**: Shows current environment before proceeding  

## Import Behavior

- **Employees**: Updates existing employees by ID, creates new ones
- **Salaries**: Updates existing salary records by ID, creates new ones
- **Attendance Records**: Updates by employee_id + attendance_date, creates new ones
- **Attendance Logs**: Only inserts new logs (doesn't update existing)

## Verification After Import

After importing, verify the data:

```bash
# Check employee count
php artisan tinker
>>> \App\Models\Employee::count()

# Check if Fanimo Oluwatosin exists
>>> \App\Models\Employee::where('first_name', 'Fanimo')->where('last_name', 'Oluwatosin')->first()

# Check attendance records
>>> \App\Models\AttendanceRecord::count()
```

## Troubleshooting

### Issue: "Export file not found"
**Solution:** Ensure the export file is in `backend/storage/app/` directory

### Issue: "Column not found" error
**Solution:** The database schemas might be different. Check that migrations are up to date on both dev and production

### Issue: "Duplicate entry" error
**Solution:** This is handled automatically. The script updates existing records instead of creating duplicates

### Issue: Import fails midway
**Solution:** The transaction is rolled back automatically. No partial data is left. Fix the issue and re-run

## Files Created

1. `backend/sync-employees-to-production.php` - Export script
2. `backend/import-employees-from-dev.php` - Import script
3. `scripts/sync-employees-to-production.ps1` - PowerShell wrapper
4. `backend/get-employee-columns.php` - Column inspection utility

## Next Steps

1. ✅ Export completed from development
2. ⏳ Copy export file to production server
3. ⏳ Run import script on production
4. ⏳ Verify data in production
5. ⏳ Test employee and attendance modules

## Notes

- The export file contains all employee and attendance data from development
- Import is idempotent - safe to run multiple times
- Existing production data is preserved and updated, not deleted
- All timestamps are preserved from the original records
