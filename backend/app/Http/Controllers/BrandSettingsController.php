<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBrandSettingsRequest;
use App\Services\AuditLogger;
use App\Services\BrandSettingsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandSettingsController extends Controller
{
    use ApiResponse;

    protected BrandSettingsService $brandService;
    protected AuditLogger $auditLogger;

    public function __construct(BrandSettingsService $brandService, AuditLogger $auditLogger)
    {
        $this->brandService = $brandService;
        $this->auditLogger = $auditLogger;
    }

    /**
     * Get current brand settings
     * 
     * @group Brand Settings
     * @authenticated
     * 
     * @response {
     *   "status": "success",
     *   "message": "Brand settings retrieved successfully",
     *   "data": {
     *     "companyName": "HR360",
     *     "logoUrl": "https://example.com/logo.png",
     *     "primaryColor": "#8252e9"
     *   }
     * }
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // PUBLIC endpoint — no auth required. Brand settings are global organisation
            // configuration (colours, logo, company name) needed even on the login screen.
            // The route intentionally has NO auth:sanctum middleware. If a caller sends
            // an expired Bearer token, the token is simply ignored at the route level
            // because there is no authentication middleware to validate it.
            $settings = $this->brandService->getBrandSettings();

            return $this->success(
                $settings,
                'Brand settings retrieved successfully'
            );
        } catch (\Exception $e) {
            return $this->error(
                'Failed to retrieve brand settings: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Update brand settings
     * 
     * @group Brand Settings
     * @authenticated
     * 
     * @bodyParam companyName string required Company trading name. Example: Acme Corp
     * @bodyParam logoUrl string nullable Company logo URL. Example: https://example.com/logo.png
     * @bodyParam primaryColor string required Primary brand color in hex format. Example: #8252e9
     * 
     * @response {
     *   "status": "success",
     *   "message": "Brand settings updated successfully",
     *   "data": {
     *     "companyName": "Acme Corp",
     *     "logoUrl": "https://example.com/logo.png",
     *     "primaryColor": "#8252e9"
     *   }
     * }
     * 
     * @response 403 {
     *   "status": "error",
     *   "message": "Unauthorized to update brand settings"
     * }
     * 
     * @response 422 {
     *   "status": "error",
     *   "message": "Validation failed",
     *   "errors": {
     *     "companyName": ["Company name is required"],
     *     "primaryColor": ["Primary color must be a valid hex color code"]
     *   }
     * }
     */
    public function update(UpdateBrandSettingsRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $result = $this->brandService->updateBrandSettings($validated);

            // Audit log
            AuditLogger::log(
                'brand_settings_updated',
                'OrganizationSetting',
                null,
                $result['old'],
                $result['new']
            );

            return $this->success(
                $result['new'],
                'Brand settings updated successfully'
            );
        } catch (\Exception $e) {
            return $this->error(
                'Failed to update brand settings: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Reset brand settings to defaults
     * 
     * @group Brand Settings
     * @authenticated
     * 
     * @response {
     *   "status": "success",
     *   "message": "Brand settings reset to defaults successfully",
     *   "data": {
     *     "companyName": "HR360",
     *     "logoUrl": "",
     *     "primaryColor": "#8252e9"
     *   }
     * }
     */
    public function reset(Request $request): JsonResponse
    {
        try {
            // Authorization check
            if (!$request->user()->hasAnyRole(['super_admin', 'admin', 'hr_manager', 'ceo'])) {
                return $this->error('Unauthorized to reset brand settings', 403);
            }

            $oldSettings = $this->brandService->getBrandSettings();
            $result = $this->brandService->resetToDefaults();

            // Audit log
            AuditLogger::log(
                'brand_settings_reset',
                'OrganizationSetting',
                null,
                $oldSettings,
                $result['new']
            );

            return $this->success(
                $result['new'],
                'Brand settings reset to defaults successfully'
            );
        } catch (\Exception $e) {
            return $this->error(
                'Failed to reset brand settings: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get brand settings history from audit logs
     * 
     * @group Brand Settings
     * @authenticated
     * 
     * @queryParam per_page int Number of records per page. Default: 20
     * @queryParam page int Page number. Default: 1
     * 
     * @response {
     *   "status": "success",
     *   "message": "Brand settings history retrieved successfully",
     *   "data": [
     *     {
     *       "id": 1,
     *       "user_id": 1,
     *       "action": "brand_settings_updated",
     *       "old_values": {"companyName": "HR360"},
     *       "new_values": {"companyName": "Acme Corp"},
     *       "ip_address": "192.168.1.1",
     *       "created_at": "2026-03-05T10:00:00Z"
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "last_page": 1,
     *     "per_page": 20,
     *     "total": 5
     *   }
     * }
     */
    public function history(Request $request): JsonResponse
    {
        try {
            // Authorization check
            if (!$request->user()->hasAnyRole(['super_admin', 'admin', 'hr_manager', 'ceo'])) {
                return $this->error('Unauthorized to view brand settings history', 403);
            }

            $perPage = $request->get('per_page', 20);
            
            $history = \App\Models\AuditLog::where('entity_type', 'OrganizationSetting')
                ->whereIn('action', ['brand_settings_updated', 'brand_settings_reset'])
                ->with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return $this->success($history, 'Brand settings history retrieved successfully');
        } catch (\Exception $e) {
            return $this->error(
                'Failed to retrieve brand settings history: ' . $e->getMessage(),
                500
            );
        }
    }
}
