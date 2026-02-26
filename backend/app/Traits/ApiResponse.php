<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponse
{
    /**
     * Standardized success response
     */
    protected function success($data, ?string $message = null, int $code = 200, array $meta = []): JsonResponse
    {
        $response = [
            'status' => 'success',
            'message' => $message,
            'data' => $data,
        ];

        if ($data instanceof LengthAwarePaginator) {
            $response['data'] = $data->items();
            $response['meta'] = [
                'current_page' => $data->currentPage(),
                'last_page' => $data->lastPage(),
                'per_page' => $data->perPage(),
                'total' => $data->total(),
            ];
        } elseif (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $code);
    }

    /**
     * Standardized error response
     */
    protected function error(string $message, int $code = 400, $errors = null): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
