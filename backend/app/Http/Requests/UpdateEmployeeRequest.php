<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add proper authorization logic
    }

    public function rules(): array
    {
        $employeeId = $this->route('id');
        $user = auth()->user();

        // Base rules for personal fields - Allowed to everyone with update permission
        $rules = [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('employees', 'email')->ignore($employeeId)
            ],
            'phone' => 'nullable|string|max:20',
            'dob' => 'nullable|date|before:today',
            'avatar' => 'nullable|string',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'academics' => 'nullable|string',
        ];

        // Organizational fields - only allowed if user has higher than 'self' scope
        // or if they are explicitly allowed to update other employees.
        $userScope = $user->getPermissionScope('employees.update') ?? 'self';
        
        if ($userScope !== 'self') {
            $rules = array_merge($rules, [
                'branch_id' => 'sometimes|required|exists:branches,id',
                'department_id' => 'sometimes|required|exists:departments,id',
                'designation_id' => 'sometimes|required|exists:designations,id',
                'manager_id' => 'nullable|exists:employees,id',
                'employment_type' => 'sometimes|required|in:full-time,part-time,contract',
                'work_mode' => 'sometimes|required|in:onsite,remote,hybrid',
                'status' => 'sometimes|required|in:active,probation,suspended,terminated',
                'hire_date' => 'sometimes|required|date',
            ]);
        }

        return $rules;
    }
}
