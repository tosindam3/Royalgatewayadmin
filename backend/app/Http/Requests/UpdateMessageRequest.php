<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'required|string|max:10000',
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Message content is required',
            'content.max' => 'Message cannot exceed 10,000 characters',
        ];
    }
}
