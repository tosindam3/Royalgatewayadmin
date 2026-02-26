<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Traits\ApiResponse;

class OrganizationController extends Controller
{
    use ApiResponse;

    public function branches()
    {
        $branches = Branch::withCount('employees')->get();
        return $this->success($branches);
    }

    public function branch($id)
    {
        $branch = Branch::with(['employees', 'departments'])->findOrFail($id);
        return $this->success($branch);
    }

    public function departments()
    {
        $departments = Department::with('branch')->withCount('employees')->get();
        return $this->success($departments);
    }

    public function department($id)
    {
        $department = Department::with(['branch', 'employees'])->findOrFail($id);
        return $this->success($department);
    }

    public function designations()
    {
        $designations = Designation::withCount('employees')->get();
        return $this->success($designations);
    }

    public function designation($id)
    {
        $designation = Designation::with('employees')->findOrFail($id);
        return $this->success($designation);
    }
}
