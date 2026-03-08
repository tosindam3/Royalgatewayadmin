<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'required|string|max:10000',
            'type' => 'sometimes|in:text,file,audio,system',
            'parent_message_id' => 'nullable|exists:chat_messages,id',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => 'file|max:10240', // 10MB max per file
            'metadata' => 'nullable|array',
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Message content is required',
            'content.max' => 'Message cannot exceed 10,000 characters',
            'parent_message_id.exists' => 'Parent message not found',
            'attachments.max' => 'You can upload a maximum of 10 files',
            'attachments.*.max' => 'Each file must not exceed 10MB',
        ];
    }
}
