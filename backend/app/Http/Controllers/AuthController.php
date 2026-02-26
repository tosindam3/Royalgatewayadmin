<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with(['roles', 'employeeProfile'])
            ->where('email', $credentials['email'])
            ->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Delete all tokens for the user
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user()->load(['employeeProfile', 'roles', 'primaryRole']);

        // Check if password change is required
        $passwordChangeRequired = $user->employeeProfile &&
            $user->employeeProfile->password_change_required;

        return response()->json([
            'user' => $user,
            'password_change_required' => $passwordChangeRequired,
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/',
            'new_password_confirmation' => 'required|string',
        ], [
            'new_password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            'new_password.min' => 'Password must be at least 8 characters long.',
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['The current password is incorrect.']]
            ], 422);
        }

        // Update password
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        // Update employee profile to mark password as changed
        if ($user->employeeProfile) {
            $user->employeeProfile->password_change_required = false;
            $user->employeeProfile->save();
        }

        // Log audit trail
        if (class_exists(\App\Services\AuditLogger::class)) {
            app(\App\Services\AuditLogger::class)->log(
                'password_changed',
                User::class,
                $user->id,
                null,
                ['changed_at' => now()]
            );
        }

        return response()->json([
            'message' => 'Password changed successfully',
            'password_change_required' => false,
        ]);
    }
}
