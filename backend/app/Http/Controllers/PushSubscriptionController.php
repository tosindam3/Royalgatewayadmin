<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Traits\ApiResponse;

class PushSubscriptionController extends Controller
{
    use ApiResponse;

    /**
     * Store or update a push subscription
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $endpoint = $request->input('endpoint');
            $key = $request->input('keys.p256dh');
            $token = $request->input('keys.auth');
            $contentEncoding = $request->input('content_encoding', 'aesgcm');

            if (!$endpoint) {
                return $this->error('Endpoint is required', 400);
            }

            $user->updatePushSubscription($endpoint, $key, $token, $contentEncoding);

            return $this->success(null, 'Push subscription updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update push subscription: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove a push subscription
     */
    public function destroy(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $endpoint = $request->get('endpoint');

            if ($endpoint) {
                $user->deletePushSubscription($endpoint);
            } else {
                // If no endpoint provided, could optionally clear all for user
                // $user->pushSubscriptions()->delete();
            }

            return $this->success(null, 'Push subscription removed successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to remove push subscription: ' . $e->getMessage(), 500);
        }
    }
}
