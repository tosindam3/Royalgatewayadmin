<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AddReactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'emoji' => 'required|string|max:10',
        ];
    }

    public function messages(): array
    {
        return [
            'emoji.required' => 'Emoji is required',
            'emoji.max' => 'Invalid emoji format',
        ];
    }
}
