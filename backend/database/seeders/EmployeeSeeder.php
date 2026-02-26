<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing branches or create if they don't exist
        $branches = $this->ensureBranches();
        
        // Create Departments linked to branches
        $departments = $this->createDepartments($branches);
        
        // Create Designations
        $designations = $this->createDesignations();
        
        // Create Sample Employees
        $this->createEmployees($branches, $departments, $designations);
        
        // Update branch employee counts
        $this->updateBranchCounts($branches);
    }

    private function ensureBranches(): array
    {
        // Use existing branches from BranchSeeder or create basic ones
        $branchData = [
            'HQ-SFO' => ['name' => 'Global HQ', 'location' => 'San Francisco, CA', 'type' => 'HQ', 'is_hq' => true],
            'REG-SEA' => ['name' => 'Tech North', 'location' => 'Seattle, WA', 'type' => 'Regional', 'is_hq' => false],
            'SAT-LAG' => ['name' => 'Lagos Branch', 'location' => 'Lagos, Nigeria', 'type' => 'Satellite', 'is_hq' => false],
            'BR-VRT' => ['name' => 'Remote Office', 'location' => 'Global Virtual', 'type' => 'Virtual', 'is_hq' => false],
        ];

        $branches = [];
        foreach ($branchData as $code => $data) {
            $branch = Branch::where('code', $code)->first();
            if (!$branch) {
                $branch = Branch::create(array_merge($data, [
                    'code' => $code,
                    'timezone' => $code === 'SAT-LAG' ? 'Africa/Lagos' : ($code === 'BR-VRT' ? 'UTC' : 'America/Los_Angeles'),
                    'status' => 'active',
                ]));
            }
            $branches[$code] = $branch;
        }

        return $branches;
    }

    private function createDepartments(array $branches): array
    {
        $departmentData = [
            ['name' => 'Engineering', 'code' => 'DEPT-ENG', 'branch_code' => 'HQ-SFO'],
            ['name' => 'Marketing', 'code' => 'DEPT-MKT', 'branch_code' => 'HQ-SFO'],
            ['name' => 'Human Resources', 'code' => 'DEPT-HR', 'branch_code' => 'HQ-SFO'],
            ['name' => 'Sales', 'code' => 'DEPT-SAL', 'branch_code' => 'HQ-SFO'],
            ['name' => 'Product', 'code' => 'DEPT-PRD', 'branch_code' => 'REG-SEA'],
            ['name' => 'IT', 'code' => 'DEPT-IT', 'branch_code' => 'REG-SEA'],
            ['name' => 'Operations', 'code' => 'DEPT-OPS', 'branch_code' => 'SAT-LAG'],
        ];

        $departments = [];
        foreach ($departmentData as $data) {
            $branchCode = $data['branch_code'];
            unset($data['branch_code']);
            
            $dept = Department::where('code', $data['code'])->first();
            if (!$dept) {
                $dept = Department::create(array_merge($data, [
                    'branch_id' => $branches[$branchCode]->id
                ]));
            }
            $departments[$data['code']] = $dept;
        }

        return $departments;
    }

    private function createDesignations(): array
    {
        $designationData = [
            ['name' => 'Software Engineer', 'code' => 'DES-SE'],
            ['name' => 'Senior Software Engineer', 'code' => 'DES-SSE'],
            ['name' => 'Marketing Lead', 'code' => 'DES-ML'],
            ['name' => 'HR Specialist', 'code' => 'DES-HRS'],
            ['name' => 'Sales Associate', 'code' => 'DES-SA'],
            ['name' => 'UX Designer', 'code' => 'DES-UXD'],
            ['name' => 'Account Manager', 'code' => 'DES-AM'],
            ['name' => 'Data Analyst', 'code' => 'DES-DA'],
        ];

        $designations = [];
        foreach ($designationData as $data) {
            $designation = Designation::where('code', $data['code'])->first();
            if (!$designation) {
                $designation = Designation::create($data);
            }
            $designations[$data['code']] = $designation;
        }

        return $designations;
    }

    private function createEmployees(array $branches, array $departments, array $designations): void
    {
        $employees = [
            [
                'employee_code' => 'EMP-00001',
                'first_name' => 'Kelly',
                'last_name' => 'Robinson',
                'email' => 'kelly.robinson@company.com',
                'phone' => '+1-555-0101',
                'branch_code' => 'HQ-SFO',
                'department_code' => 'DEPT-MKT',
                'designation_code' => 'DES-ML',
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => '2023-01-15',
                'dob' => '1990-05-20',
                'blood_group' => 'B+',
                'genotype' => 'AA',
                'academics' => 'MBA Marketing, Yale University',
            ],
            [
                'employee_code' => 'EMP-00002',
                'first_name' => 'Robert',
                'last_name' => 'Davis',
                'email' => 'robert.davis@company.com',
                'phone' => '+1-555-0102',
                'branch_code' => 'REG-SEA',
                'department_code' => 'DEPT-IT',
                'designation_code' => 'DES-SE',
                'employment_type' => 'contract',
                'work_mode' => 'hybrid',
                'status' => 'probation',
                'hire_date' => '2024-01-10',
                'dob' => '1992-08-15',
                'blood_group' => 'O+',
                'genotype' => 'AS',
                'academics' => 'MSc Computer Science, MIT',
            ],
            [
                'employee_code' => 'EMP-00003',
                'first_name' => 'Amanda',
                'last_name' => 'Ward',
                'email' => 'amanda.ward@company.com',
                'phone' => '+1-555-0103',
                'branch_code' => 'HQ-SFO',
                'department_code' => 'DEPT-HR',
                'designation_code' => 'DES-HRS',
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => '2022-06-01',
                'dob' => '1988-03-12',
                'blood_group' => 'A+',
                'genotype' => 'AA',
                'academics' => 'BSc Human Resources, Stanford',
            ],
            [
                'employee_code' => 'EMP-00004',
                'first_name' => 'John',
                'last_name' => 'Smith',
                'email' => 'john.smith@company.com',
                'phone' => '+234-555-0104',
                'branch_code' => 'SAT-LAG',
                'department_code' => 'DEPT-OPS',
                'designation_code' => 'DES-SA',
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => '2023-03-20',
                'dob' => '1991-11-08',
                'blood_group' => 'AB-',
                'genotype' => 'AC',
                'academics' => 'BBA, University of Chicago',
            ],
            [
                'employee_code' => 'EMP-00005',
                'first_name' => 'Douglas',
                'last_name' => 'Baker',
                'email' => 'douglas.baker@company.com',
                'phone' => '+1-555-0105',
                'branch_code' => 'REG-SEA',
                'department_code' => 'DEPT-PRD',
                'designation_code' => 'DES-UXD',
                'employment_type' => 'full-time',
                'work_mode' => 'remote',
                'status' => 'active',
                'hire_date' => '2023-07-01',
                'dob' => '1993-02-28',
                'blood_group' => 'O-',
                'genotype' => 'AA',
                'academics' => 'BFA Graphic Design, RISD',
            ],
            [
                'employee_code' => 'EMP-00006',
                'first_name' => 'Sarah',
                'last_name' => 'Mitchell',
                'email' => 'sarah.mitchell@company.com',
                'phone' => '+234-555-0106',
                'branch_code' => 'SAT-LAG',
                'department_code' => 'DEPT-OPS',
                'designation_code' => 'DES-AM',
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => '2022-09-15',
                'dob' => '1989-07-22',
                'blood_group' => 'B-',
                'genotype' => 'AA',
                'academics' => 'MBA, Harvard Business School',
            ],
            [
                'employee_code' => 'EMP-00007',
                'first_name' => 'Michael',
                'last_name' => 'Carter',
                'email' => 'michael.carter@company.com',
                'phone' => '+1-555-0107',
                'branch_code' => 'BR-VRT',
                'department_code' => 'DEPT-IT',
                'designation_code' => 'DES-DA',
                'employment_type' => 'part-time',
                'work_mode' => 'remote',
                'status' => 'active',
                'hire_date' => '2024-02-01',
                'dob' => '1994-12-05',
                'blood_group' => 'A-',
                'genotype' => 'AS',
                'academics' => 'BSc Data Science, Berkeley',
            ],
            [
                'employee_code' => 'EMP-00008',
                'first_name' => 'Alex',
                'last_name' => 'Rivera',
                'email' => 'alex.rivera@company.com',
                'phone' => '+1-555-0108',
                'branch_code' => 'HQ-SFO',
                'department_code' => 'DEPT-ENG',
                'designation_code' => 'DES-SSE',
                'employment_type' => 'full-time',
                'work_mode' => 'hybrid',
                'status' => 'active',
                'hire_date' => '2021-03-10',
                'dob' => '1987-09-14',
                'blood_group' => 'O+',
                'genotype' => 'AA',
                'academics' => 'PhD Computer Science, Stanford',
            ],
            [
                'employee_code' => 'EMP-00009',
                'first_name' => 'Ethan',
                'last_name' => 'Parker',
                'email' => 'ethan.parker@company.com',
                'phone' => '+1-555-0109',
                'branch_code' => 'REG-SEA',
                'department_code' => 'DEPT-PRD',
                'designation_code' => 'DES-SSE',
                'employment_type' => 'full-time',
                'work_mode' => 'onsite',
                'status' => 'active',
                'hire_date' => '2022-01-20',
                'dob' => '1990-04-18',
                'blood_group' => 'A+',
                'genotype' => 'AA',
                'academics' => 'MSc Software Engineering, MIT',
            ],
        ];

        foreach ($employees as $employeeData) {
            $branchCode = $employeeData['branch_code'];
            $departmentCode = $employeeData['department_code'];
            $designationCode = $employeeData['designation_code'];
            
            unset($employeeData['branch_code'], $employeeData['department_code'], $employeeData['designation_code']);
            
            $existing = Employee::where('employee_code', $employeeData['employee_code'])->first();
            if (!$existing) {
                Employee::create(array_merge($employeeData, [
                    'branch_id' => $branches[$branchCode]->id,
                    'department_id' => $departments[$departmentCode]->id,
                    'designation_id' => $designations[$designationCode]->id,
                ]));
            }
        }
    }

    private function updateBranchCounts(array $branches): void
    {
        foreach ($branches as $branch) {
            $employeeCount = Employee::where('branch_id', $branch->id)->count();
            $branch->update(['employee_count' => $employeeCount]);
        }
    }
}
