<?php

namespace App\Http\Controllers;

use App\Services\NavigationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NavigationController extends Controller
{
    public function __construct(
        protected NavigationService $navigationService
    ) {}

    /**
     * Get the navigation menu for the current user
     */
    public function me(Request $request): JsonResponse
    {
        $navigation = $this->navigationService->getNavigation($request->user());

        return $this->success($navigation);
    }
}
