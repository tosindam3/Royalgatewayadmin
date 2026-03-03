<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogEmployeeRequests
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->is("api/v1/hr-core/employees/*") && $request->method() === "PUT") {
            Log::channel("single")->info("Employee Update Request", [
                "url" => $request->fullUrl(),
                "method" => $request->method(),
                "headers" => $request->headers->all(),
                "input" => $request->all(),
                "raw_content" => $request->getContent(),
                "content_type" => $request->header("Content-Type"),
                "user" => $request->user() ? $request->user()->id : null,
            ]);
        }

        return $next($request);
    }
}