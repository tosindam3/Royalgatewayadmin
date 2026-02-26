<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'required|string|max:20',
            'branch_id' => 'required|exists:branches,id',
            'department_id' => 'required|exists:departments,id',
            'designation_id' => 'required|exists:designations,id',
            'manager_id' => 'nullable|exists:employees,id',
            'employment_type' => 'required|in:full-time,part-time,contract',
            'work_mode' => 'required|in:onsite,remote,hybrid',
            'status' => 'required|in:active,inactive,on-leave,terminated',
            'hire_date' => 'required|date',
            'dob' => 'required|date|before:today',
            'blood_group' => 'nullable|string|max:10',
            'genotype' => 'nullable|string|max:10',
            'academics' => 'nullable|string',
            
            // User account creation fields
            'create_user_account' => 'boolean',
            'password' => 'required_if:create_user_account,true|nullable|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            'password_confirmation' => 'required_if:create_user_account,true|nullable|same:password',
            
            // Role assignment fields
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'primary_role_id' => 'nullable|exists:roles,id',
        ];
    }

    /**
     * Get custom validation messages
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required',
            'last_name.required' => 'Last name is required',
            'email.required' => 'Email address is required',
            'email.email' => 'Please provide a valid email address',
            'email.unique' => 'This email address is already registered',
            'phone.required' => 'Phone number is required',
            'branch_id.required' => 'Branch selection is required',
            'branch_id.exists' => 'Selected branch does not exist',
            'department_id.required' => 'Department selection is required',
            'department_id.exists' => 'Selected department does not exist',
            'designation_id.required' => 'Designation selection is required',
            'designation_id.exists' => 'Selected designation does not exist',
            'hire_date.required' => 'Hire date is required',
            'dob.required' => 'Date of birth is required',
            'dob.before' => 'Date of birth must be in the past',
            'password.required_if' => 'Password is required when creating a user account',
            'password.min' => 'Password must be at least 8 characters',
            'password.regex' => 'Password must contain uppercase, lowercase, number, and special character',
            'password_confirmation.same' => 'Password confirmation does not match',
            'role_ids.*.exists' => 'One or more selected roles do not exist',
        ];
    }
}
