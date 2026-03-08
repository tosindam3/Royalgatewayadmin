<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ManageMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'role' => 'sometimes|in:owner,admin,member',
        ];
    }

    public function messages(): array
    {
        return [
            'user_ids.required' => 'At least one user must be selected',
            'user_ids.*.exists' => 'One or more selected users do not exist',
            'role.in' => 'Role must be owner, admin, or member',
        ];
    }
}
