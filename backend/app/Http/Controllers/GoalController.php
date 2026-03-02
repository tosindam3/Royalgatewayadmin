<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\KeyResult;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class GoalController extends Controller
{
    public function __construct(private AuditLogger $auditLogger) {}

    public function index(Request $request): JsonResponse
    {
        $query = Goal::with(['owner:id,first_name,last_name', 'keyResults', 'parent:id,title']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('owner_id')) {
            $query->where('owner_id', $request->owner_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $goals = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json($goals);
    }

    public function show(int $id): JsonResponse
    {
        $goal = Goal::with([
            'owner:id,first_name,last_name',
            'parent:id,title',
            'children.keyResults',
            'keyResults.updates.updater:id,name',
            'creator:id,name',
        ])->findOrFail($id);

        $goal->health_status = $goal->getHealthStatus();

        return response()->json(['data' => $goal]);
    }

    public function store(Request $request): JsonResponse
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
            'key_results.*.weight' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $goal = Goal::create([
                ...$request->only(['title', 'description', 'owner_id', 'parent_goal_id', 'type', 'start_date', 'end_date']),
                'created_by' => auth()->id(),
                'status' => 'draft',
            ]);

            if ($request->has('key_results')) {
                foreach ($request->key_results as $kr) {
                    KeyResult::create([
                        'goal_id' => $goal->id,
                        'description' => $kr['description'],
                        'target_value' => $kr['target_value'],
                        'unit' => $kr['unit'],
                        'weight' => $kr['weight'] ?? 100,
                    ]);
                }
            }

            $this->auditLogger->log('goal_created', 'Goal', $goal->id, null, $goal->toArray());

            DB::commit();

            return response()->json(['success' => true, 'data' => $goal->load('keyResults')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $goal = Goal::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'date',
            'end_date' => 'date|after:start_date',
            'status' => 'in:draft,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $oldData = $goal->toArray();
        $goal->update($request->only(['title', 'description', 'start_date', 'end_date', 'status']));

        $this->auditLogger->log('goal_updated', 'Goal', $goal->id, $oldData, $goal->fresh()->toArray());

        return response()->json(['success' => true, 'data' => $goal]);
    }

    public function updateKeyResult(Request $request, int $goalId, int $krId): JsonResponse
    {
        $keyResult = KeyResult::where('goal_id', $goalId)->findOrFail($krId);

        $validator = Validator::make($request->all(), [
            'current_value' => 'required|numeric',
            'note' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $keyResult->updateValue(
            $request->current_value,
            $request->note,
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'data' => $keyResult->fresh(['updates', 'goal']),
            'message' => 'Progress updated successfully',
        ]);
    }
}
