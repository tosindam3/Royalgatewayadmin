<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\KeyResult;
use App\Services\PerformanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GoalController extends Controller
{
    protected $performanceService;

    public function __construct(PerformanceService $performanceService)
    {
        $this->performanceService = $performanceService;
    }

    /**
     * Get all goals
     */
    public function index(Request $request)
    {
        $query = Goal::with([
            'owner:id,first_name,last_name,employee_code',
            'parent:id,title',
            'keyResults',
        ]);
        
        // Filter by type
        if ($request->has('type')) {
            $query->byType($request->type);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by owner
        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }
        
        $goals = $query->orderBy('created_at', 'desc')->get();
        
        // Add calculated progress
        $goals->each(function ($goal) {
            $goal->calculated_progress = $goal->calculateProgress();
        });
        
        return response()->json([
            'success' => true,
            'data' => $goals,
        ]);
    }

    /**
     * Get single goal
     */
    public function show(int $id)
    {
        $goal = Goal::with([
            'owner:id,first_name,last_name,employee_code',
            'owner.department:id,name',
            'parent:id,title,type',
            'children:id,title,progress,status',
            'keyResults',
            'updates.updater:id,name',
        ])->findOrFail($id);
        
        $goal->calculated_progress = $goal->calculateProgress();
        
        return response()->json([
            'success' => true,
            'data' => $goal,
        ]);
    }

    /**
     * Create goal
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'owner_id' => 'required|exists:employees,id',
            'parent_goal_id' => 'nullable|exists:goals,id',
            'type' => 'required|in:company,department,team,individual',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'key_results' => 'nullable|array',
            'key_results.*.description' => 'required|string',
            'key_results.*.target_value' => 'required|numeric',
            'key_results.*.unit' => 'required|string',
            'key_results.*.weight' => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $goal = Goal::create([
                'title' => $request->title,
                'description' => $request->description,
                'owner_id' => $request->owner_id,
                'parent_goal_id' => $request->parent_goal_id,
                'type' => $request->type,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'status' => 'draft',
                'progress' => 0,
            ]);

            // Create key results
            if ($request->has('key_results')) {
                foreach ($request->key_results as $kr) {
                    KeyResult::create([
                        'goal_id' => $goal->id,
                        'description' => $kr['description'],
                        'target_value' => $kr['target_value'],
                        'current_value' => 0,
                        'unit' => $kr['unit'],
                        'weight' => $kr['weight'] ?? 100,
                    ]);
                }
            }

            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Goal created successfully',
                'data' => $goal->load('keyResults'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create goal: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update goal
     */
    public function update(Request $request, int $id)
    {
        $goal = Goal::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'status' => 'sometimes|in:draft,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $goal->update($request->only(['title', 'description', 'start_date', 'end_date', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Goal updated successfully',
            'data' => $goal,
        ]);
    }

    /**
     * Get goal progress
     */
    public function progress(int $id)
    {
        $progress = $this->performanceService->calculateGoalProgress($id);
        
        return response()->json([
            'success' => true,
            'data' => [
                'goal_id' => $id,
                'progress' => $progress,
            ],
        ]);
    }

    /**
     * Add key result to goal
     */
    public function addKeyResult(Request $request, int $id)
    {
        $goal = Goal::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'description' => 'required|string',
            'target_value' => 'required|numeric',
            'unit' => 'required|string',
            'weight' => 'nullable|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $keyResult = KeyResult::create([
            'goal_id' => $goal->id,
            'description' => $request->description,
            'target_value' => $request->target_value,
            'current_value' => 0,
            'unit' => $request->unit,
            'weight' => $request->weight ?? 100,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Key result added successfully',
            'data' => $keyResult,
        ], 201);
    }

    /**
     * Update key result value
     */
    public function updateKeyResult(Request $request, int $goalId, int $krId)
    {
        $keyResult = KeyResult::where('goal_id', $goalId)->findOrFail($krId);
        
        $validator = Validator::make($request->all(), [
            'current_value' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $keyResult->updateValue(
            $request->current_value,
            $request->notes,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'message' => 'Key result updated successfully',
            'data' => $keyResult->fresh(),
        ]);
    }

    /**
     * Delete goal
     */
    public function destroy(int $id)
    {
        $goal = Goal::findOrFail($id);
        
        // Check if goal has children
        if ($goal->children()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete goal with child goals',
            ], 422);
        }
        
        $goal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Goal deleted successfully',
        ]);
    }
}
