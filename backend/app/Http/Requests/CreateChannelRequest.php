<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:100',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:public,private,direct',
            'organization_id' => 'nullable|exists:branches,id',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
            'metadata' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Channel name is required',
            'name.min' => 'Channel name must be at least 2 characters',
            'name.max' => 'Channel name cannot exceed 100 characters',
            'type.required' => 'Channel type is required',
            'type.in' => 'Channel type must be public, private, or direct',
            'member_ids.*.exists' => 'One or more selected users do not exist',
        ];
    }
}
