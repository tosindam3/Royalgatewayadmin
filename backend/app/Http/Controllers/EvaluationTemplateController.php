<?php

namespace App\Http\Controllers;

use App\Models\EvaluationTemplate;
use App\Services\PerformanceAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EvaluationTemplateController extends Controller
{
    protected $accessService;

    public function __construct(PerformanceAccessService $accessService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('performance.access');
        $this->accessService = $accessService;
    }

    /**
     * Get all templates (with access control)
     */
    public function index(Request $request)
    {
        $permissions = $request->get('user_permissions');
        
        $query = EvaluationTemplate::with('creator:id,name,email');
        
        // Non-admins can only see published templates
        if (!$permissions['is_hr_admin']) {
            $query->published();
        }
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $templates = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));
        
        // Add computed fields
        $templates->getCollection()->each(function ($template) {
            $template->total_questions = $template->total_questions;
            $template->is_editable = $template->is_editable;
            $template->can_be_cloned = $template->can_be_cloned;
        });
        
        return response()->json([
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
                'last_page' => $templates->lastPage(),
            ]
        ]);
    }

    /**
     * Get single template
     */
    public function show(int $id, Request $request)
    {
        $permissions = $request->get('user_permissions');
        
        $query = EvaluationTemplate::with('creator:id,name,email');
        
        // Non-admins can only see published templates
        if (!$permissions['is_hr_admin']) {
            $query->published();
        }
        
        $template = $query->findOrFail($id);
        
        $template->total_questions = $template->total_questions;
        $template->is_editable = $template->is_editable;
        $template->can_be_cloned = $template->can_be_cloned;
        
        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    /**
     * Create template
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sessions' => 'required|array|min:1',
            'sessions.*.title' => 'required|string',
            'sessions.*.description' => 'nullable|string',
            'sessions.*.fields' => 'required|array|min:1',
            'sessions.*.fields.*.id' => 'required|string',
            'sessions.*.fields.*.type' => 'required|string|in:SHORT_TEXT,PARAGRAPH,MULTIPLE_CHOICE,CHECKBOXES,DROPDOWN,RATING,DATE,FILE,KPI',
            'sessions.*.fields.*.label' => 'required|string',
            'sessions.*.fields.*.required' => 'required|boolean',
            'sessions.*.fields.*.weight' => 'required|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $template = EvaluationTemplate::create([
            'title' => $request->title,
            'description' => $request->description,
            'sessions' => $request->sessions,
            'metadata' => $request->metadata ?? [],
            'created_by' => auth()->id(),
            'status' => 'draft',
            'version' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template created successfully',
            'data' => $template,
        ], 201);
    }

    /**
     * Update template (only drafts)
     */
    public function update(Request $request, int $id)
    {
        $template = EvaluationTemplate::findOrFail($id);
        
        if (!$template->is_editable) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be edited',
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'sessions' => 'sometimes|required|array|min:1',
            'sessions.*.title' => 'required|string',
            'sessions.*.description' => 'nullable|string',
            'sessions.*.fields' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $template->update($request->only(['title', 'description', 'sessions', 'metadata']));

        return response()->json([
            'success' => true,
            'message' => 'Template updated successfully',
            'data' => $template,
        ]);
    }

    /**
     * Publish template
     */
    public function publish(int $id)
    {
        $template = EvaluationTemplate::findOrFail($id);
        
        if ($template->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be published',
            ], 422);
        }
        
        $template->publish();

        return response()->json([
            'success' => true,
            'message' => 'Template published successfully',
            'data' => $template,
        ]);
    }

    /**
     * Clone template
     */
    public function clone(Request $request, int $id)
    {
        $template = EvaluationTemplate::findOrFail($id);
        
        if (!$template->can_be_cloned) {
            return response()->json([
                'success' => false,
                'message' => 'This template cannot be cloned',
            ], 422);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $clone = $template->createClone(auth()->id(), $request->title);

        return response()->json([
            'success' => true,
            'message' => 'Template cloned successfully',
            'data' => $clone,
        ], 201);
    }

    /**
     * Archive template
     */
    public function archive(int $id)
    {
        $template = EvaluationTemplate::findOrFail($id);
        
        // Check if template is used in any active cycles
        if ($template->cycles()->where('status', 'active')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot archive template that is used in active cycles',
            ], 422);
        }
        
        $template->archive();

        return response()->json([
            'success' => true,
            'message' => 'Template archived successfully',
            'data' => $template,
        ]);
    }

    /**
     * Delete template
     */
    public function destroy(int $id)
    {
        $template = EvaluationTemplate::findOrFail($id);
        
        if ($template->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft templates can be deleted',
            ], 422);
        }
        
        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted successfully',
        ]);
    }

    /**
     * Get published templates for employees
     */
    public function published()
    {
        $templates = EvaluationTemplate::published()
            ->with('creator:id,name')
            ->orderBy('published_at', 'desc')
            ->get();
            
        $templates->each(function ($template) {
            $template->total_questions = $template->total_questions;
        });

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }
}
