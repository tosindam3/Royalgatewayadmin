<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|min:2|max:100',
            'description' => 'nullable|string|max:500',
            'metadata' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Channel name is required',
            'name.min' => 'Channel name must be at least 2 characters',
            'name.max' => 'Channel name cannot exceed 100 characters',
        ];
    }
}
