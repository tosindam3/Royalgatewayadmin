<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add permission check here later
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'type' => 'required|in:HQ,Regional,Satellite,Virtual',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'timezone' => 'required|string|max:100',
            'status' => 'required|in:active,inactive',
            'is_hq' => 'boolean',
            'manager_id' => 'nullable|exists:employees,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Branch name is required',
            'code.required' => 'Branch code is required',
            'code.unique' => 'This branch code is already in use',
            'type.required' => 'Branch type is required',
            'type.in' => 'Invalid branch type',
            'timezone.required' => 'Timezone is required',
            'status.required' => 'Status is required',
            'status.in' => 'Status must be either active or inactive',
            'manager_id.exists' => 'Selected manager does not exist',
        ];
    }
}
