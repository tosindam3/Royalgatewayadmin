<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) return false;
        
        // Check via Spatie roles
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole(['super_admin', 'admin', 'hr_manager', 'ceo']);
        }
        
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'companyName' => 'required|string|min:2|max:255',
            'logoUrl' => ['nullable', 'string', 'max:2048000'],
            'primaryColor' => ['required', 'string', 'hex_color'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'companyName.required' => 'Company name is required',
            'companyName.min' => 'Company name must be at least 2 characters',
            'companyName.max' => 'Company name cannot exceed 255 characters',
            'logoUrl.url' => 'Logo URL must be a valid URL',
            'logoUrl.max' => 'Logo URL cannot exceed 2MB',
            'primaryColor.required' => 'Primary color is required',
            'primaryColor.hex_color' => 'Primary color must be a valid hex color code (e.g., #8252e9)',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'companyName' => 'company name',
            'logoUrl' => 'logo URL',
            'primaryColor' => 'primary color',
        ];
    }
}
