<?php

namespace App\Http\Controllers;

use App\Models\ReviewCycle;
use App\Models\Employee;
use App\Services\PerformanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReviewCycleController extends Controller
{
    protected $performanceService;

    public function __construct(PerformanceService $performanceService)
    {
        $this->performanceService = $performanceService;
    }

    /**
     * Get all cycles
     */
    public function index(Request $request)
    {
        $query = ReviewCycle::with(['template:id,title', 'participants']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $cycles = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));
        
        // Add computed fields
        $cycles->getCollection()->each(function ($cycle) {
            $cycle->completion_rate = $cycle->completion_rate;
            $cycle->total_participants = $cycle->participants->count();
            $cycle->completed_count = $cycle->participants->where('status', 'completed')->count();
        });
        
        return response()->json([
            'data' => $cycles->items(),
            'meta' => [
                'current_page' => $cycles->currentPage(),
                'per_page' => $cycles->perPage(),
                'total' => $cycles->total(),
                'last_page' => $cycles->lastPage(),
            ]
        ]);
    }

    /**
     * Get single cycle
     */
    public function show(int $id)
    {
        $cycle = ReviewCycle::with([
            'template:id,title,description',
            'participants.employee:id,first_name,last_name,employee_code',
            'participants.employee.department:id,name',
            'participants.evaluator:id,name',
        ])->findOrFail($id);
        
        $cycle->completion_rate = $cycle->completion_rate;
        
        return response()->json([
            'success' => true,
            'data' => $cycle,
        ]);
    }

    /**
     * Create cycle
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'template_id' => 'required|exists:evaluation_templates,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $cycle = ReviewCycle::create([
            'name' => $request->name,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'template_id' => $request->template_id,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review cycle created successfully',
            'data' => $cycle,
        ], 201);
    }

    /**
     * Update cycle
     */
    public function update(Request $request, int $id)
    {
        $cycle = ReviewCycle::findOrFail($id);
        
        // Prevent updating active cycles
        if ($cycle->status === 'active' && $request->has('template_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot change template of an active cycle',
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after:start_date',
            'template_id' => 'sometimes|required|exists:evaluation_templates,id',
            'status' => 'sometimes|in:draft,active,closed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $cycle->update($request->only(['name', 'description', 'start_date', 'end_date', 'template_id', 'status']));

        return response()->json([
            'success' => true,
            'message' => 'Review cycle updated successfully',
            'data' => $cycle,
        ]);
    }

    /**
     * Launch cycle (activate and assign employees)
     */
    public function launch(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $this->performanceService->launchCycle($id, $request->employee_ids);
            
            return response()->json([
                'success' => true,
                'message' => 'Review cycle launched successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to launch cycle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cycle participants
     */
    public function participants(int $id)
    {
        $cycle = ReviewCycle::findOrFail($id);
        
        $participants = $cycle->participants()
            ->with([
                'employee:id,first_name,last_name,employee_code',
                'employee.department:id,name',
                'evaluator:id,name',
            ])
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $participants,
        ]);
    }

    /**
     * Delete cycle
     */
    public function destroy(int $id)
    {
        $cycle = ReviewCycle::findOrFail($id);
        
        if ($cycle->status === 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete an active cycle',
            ], 422);
        }
        
        $cycle->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review cycle deleted successfully',
        ]);
    }
}
