<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        channels: __DIR__.'/../routes/channels.php',
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Diagnostic routes (development only)
            if (file_exists(__DIR__.'/../routes/diagnostic-talent.php')) {
                Route::middleware('web')
                    ->group(base_path('routes/diagnostic-talent.php'));
            }
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // Register custom middleware aliases
        $middleware->alias([
            'attendance.access' => \App\Http\Middleware\AttendanceAccessMiddleware::class,
            'performance.access' => \App\Http\Middleware\PerformanceAccessMiddleware::class,
            'permission' => \App\Http\Middleware\PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON responses for API routes
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                $message = 'Internal Server Error';
                
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $status = 404;
                    $message = 'Resource not found';
                } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                    $status = 422;
                    $message = 'Validation failed';
                } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $status = 401;
                    $message = 'Unauthenticated';
                } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $status = 403;
                    $message = 'Unauthorized';
                } elseif (method_exists($e, 'getStatusCode')) {
                    $status = $e->getStatusCode();
                    $message = $e->getMessage() ?: $message;
                }
                
                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                    'errors' => $e instanceof \Illuminate\Validation\ValidationException ? $e->errors() : null,
                ], $status);
            }
        });
    })->create();
