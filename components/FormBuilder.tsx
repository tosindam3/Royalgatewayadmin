import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GlassCard from './GlassCard';
import { performanceService } from '../services/performanceService';
import { toast } from 'sonner';
import {
  Plus, Trash2, ChevronUp, ChevronDown,
  GripVertical, Settings2, Sparkles, Save,
  Globe, Landmark, Building2, AlertTriangle,
  FileText, CheckCircle2, ArrowLeft, XCircle, RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type QuestionType = 'short_text' | 'paragraph' | 'rating' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'date' | 'file' | 'currency' | 'number';

interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  is_scoreable: boolean;
  weight: number;
  target?: number;
  options?: string[];
  placeholder?: string;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  questions: Question[];
  fields?: Question[]; // Alias for API compatibility
}

// --- Question Editor Component ---

interface QuestionEditorProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case 'rating': return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'currency': return <span className="text-emerald-500 font-bold">$</span>;
      case 'number': return <span className="text-blue-500 font-bold">#</span>;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all hover:shadow-md">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col gap-1 pr-2 border-r border-slate-100 dark:border-white/5">
            <button disabled={isFirst} onClick={onMoveUp} className="text-slate-400 hover:text-purple-500 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
            <button disabled={isLast} onClick={onMoveDown} className="text-slate-400 hover:text-purple-500 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
            {getQuestionIcon(question.type)}
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={question.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
              placeholder="Question Label..."
            />
            <div className="flex gap-2 mt-0.5">
              <Badge size="sm">{question.type.replace('_', ' ')}</Badge>
              {question.required && <Badge size="sm" variant="danger">Required</Badge>}
              {question.is_scoreable && <Badge size="sm" variant="success">Scoreable ({question.weight}%)</Badge>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-all"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-16 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Placeholder</label>
              <input
                value={question.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-xs"
                placeholder="Hint for the employee..."
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={question.is_scoreable}
                  onChange={(e) => onUpdate({ is_scoreable: e.target.checked, weight: e.target.checked ? 10 : 0 })}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Scoreable</span>
              </label>
            </div>
          </div>

          {question.is_scoreable && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1.5 block">Weight (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={question.weight}
                    onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
                    className="flex-1 bg-white dark:bg-white/5 border border-purple-500/20 rounded-xl py-2 px-3 text-sm font-black"
                  />
                  <input
                    type="range"
                    min="0" max="100" step="5"
                    value={question.weight}
                    onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
                    className="flex-1 accent-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-1.5 block">Target/Goal (Optional)</label>
                <input
                  type="number"
                  value={question.target || ''}
                  onChange={(e) => onUpdate({ target: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-white/5 border border-purple-500/20 rounded-xl py-2 px-3 text-sm font-black"
                  placeholder="e.g. 5.0"
                />
              </div>
            </div>
          )}

          {['multiple_choice', 'checkboxes', 'dropdown'].includes(question.type) && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Options</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(question.options || []).map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(question.options || [])];
                        newOpts[i] = e.target.value;
                        onUpdate({ options: newOpts });
                      }}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs"
                    />
                    <button
                      onClick={() => {
                        const newOpts = (question.options || []).filter((_, idx) => idx !== i);
                        onUpdate({ options: newOpts });
                      }}
                      className="text-rose-500 p-1"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onUpdate({ options: [...(question.options || []), 'New Option'] })}
                  className="text-purple-500 text-xs font-bold p-2 text-left hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-all border border-dashed border-purple-200 dark:border-purple-500/20"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main FormBuilder Component ---

const FormBuilder: React.FC = () => {
  const { mode, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [templateName, setTemplateName] = useState('Untitled Template');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'global' | 'branch' | 'department'>((searchParams.get('scope') as any) || 'department');
  const [targetId, setTargetId] = useState<number | undefined>(searchParams.get('targetId') ? Number(searchParams.get('targetId')) : undefined);
  const [targetIds, setTargetIds] = useState<number[]>(searchParams.getAll('targetIds[]').map(Number));

  const [sections, setSections] = useState<Section[]>([
    { id: 'sec_1', title: 'Main Assessment', questions: [] }
  ]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadTemplate(Number(id));
    }
  }, [mode, id]);

  const loadTemplate = async (templateId: number) => {
    try {
      setIsLoading(true);
      const data = await performanceService.getConfig(templateId);
      setTemplateName(data.name);
      setDescription(data.description || '');
      setScope(data.scope);
      setTargetId(data.department_id || data.branch_id);

      if (data.scope === 'department' && data.departments?.length > 0) {
        setTargetIds(data.departments.map((d: any) => d.id));
      } else if (data.scope === 'department' && data.department_id) {
        setTargetIds([data.department_id]);
      }

      // Transform sections: convert 'fields' to 'questions' if needed
      const transformedSections = (data.sections || []).map((section: any) => ({
        ...section,
        questions: section.fields || section.questions || []
      }));

      setSections(transformedSections.length > 0 ? transformedSections : [{ id: 'sec_1', title: 'Main Assessment', questions: [] }]);
    } catch (error) {
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Actions ---

  const addSection = () => {
    setSections([...sections, {
      id: `sec_${Date.now()}`,
      title: 'New Section',
      questions: []
    }]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length === 1) {
      toast.error('Template must have at least one section');
      return;
    }
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const addQuestion = (sectionId: string, type: QuestionType) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: [...s.questions, {
          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          label: 'Untitled Question',
          type,
          required: true,
          is_scoreable: ['rating', 'currency', 'number'].includes(type),
          weight: ['rating', 'currency', 'number'].includes(type) ? 10 : 0,
          target: undefined,
          placeholder: '',
          options: ['multiple_choice', 'checkboxes', 'dropdown'].includes(type) ? ['Option 1', 'Option 2'] : undefined
        }]
      };
    }));
  };

  const updateQuestion = (sectionId: string, questionId: string, updates: Partial<Question>) => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        questions: s.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
      };
    }));
  };

  const moveQuestion = (sectionId: string, index: number, direction: 'up' | 'down') => {
    setSections(sections.map(s => {
      if (s.id !== sectionId) return s;
      const newQuestions = [...s.questions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
      return { ...s, questions: newQuestions };
    }));
  };

  // --- Compute Weights ---

  const totalWeight = useMemo(() => {
    if (!sections || sections.length === 0) return 0;
    return sections.reduce((acc, s) => {
      if (!s || !s.questions) return acc;
      return acc + s.questions.reduce((qAcc, q) => qAcc + (q.is_scoreable ? q.weight : 0), 0);
    }, 0);
  }, [sections]);

  const isWeightValid = totalWeight === 100;

  const handleSave = async (publishAfter = false) => {
    if (!isWeightValid && sections.some(s => s?.questions?.some(q => q.is_scoreable))) {
      toast.error(`Total weight must be 100%. Current: ${totalWeight}%`);
      return;
    }

    try {
      setIsSaving(true);

      // Transform sections: convert 'questions' to 'fields' for API
      const transformedSections = sections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        required: section.required !== undefined ? section.required : true,
        fields: section.questions || section.fields || []
      }));

      const payload = {
        name: templateName,
        description,
        scope,
        department_id: scope === 'department' && targetIds.length > 0 ? targetIds[0] : (scope === 'department' ? targetId : null),
        department_ids: scope === 'department' && targetIds.length > 0 ? targetIds : undefined,
        branch_id: scope === 'branch' ? targetId : null,
        sections: transformedSections,
        scoring_config: {
          method: 'weighted',
          ratingThresholds: [
            { min: 90, max: 100, label: 'Exceptional', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
            { min: 80, max: 89, label: 'Excellent', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
            { min: 70, max: 79, label: 'Very Good', color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-300' },
            { min: 60, max: 69, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
            { min: 50, max: 59, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
            { min: 0, max: 49, label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
          ]
        }
      };

      let config;
      if (mode === 'edit' && id) {
        config = await performanceService.updateConfig(Number(id), payload);
      } else {
        config = await performanceService.createConfig(payload as any);
      }

      if (publishAfter) {
        await performanceService.publishConfig(config.id);
        toast.success('Template saved and published');
      } else {
        toast.success('Draft saved successfully');
      }

      navigate('/performance/settings');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error?.response?.data?.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render ---

  if (isLoading) return <div className="p-20 flex justify-center"><div className="w-12 h-12 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 animate-in fade-in duration-700">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <button onClick={() => navigate('/performance/settings')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-purple-500 transition-colors mb-4">
              <ArrowLeft className="w-3 h-3" /> Back to Templates
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-xl shadow-purple-500/20">
                <Plus className="w-8 h-8" />
              </div>
              <div>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="text-4xl font-black text-slate-900 dark:text-white bg-transparent border-none outline-none p-0 italic tracking-tighter"
                />
                <div className="flex gap-2 mt-1">
                  {scope === 'global' && <Badge variant="warning"><Globe className="w-3 h-3 mr-1" /> Global</Badge>}
                  {scope === 'branch' && <Badge variant="info"><Landmark className="w-3 h-3 mr-1" /> Branch Specific</Badge>}
                  {scope === 'department' && <Badge variant="primary"><Building2 className="w-3 h-3 mr-1" /> Department Specific</Badge>}
                  {mode === 'edit' && <Badge variant="default">Editing ID: {id}</Badge>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => handleSave(false)} isLoading={isSaving}>Save Draft</Button>
            <Button
              onClick={() => handleSave(true)}
              isLoading={isSaving}
              className="rounded-2xl px-8 shadow-2xl shadow-purple-500/20"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Save & Publish
            </Button>
          </div>
        </div>

        {/* Global Controls & Meta */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Description & Instructions</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm font-bold resize-none h-24"
              placeholder="Explain how employees should fill this evaluation..."
            />
          </GlassCard>

          <GlassCard className={cn(
            "flex flex-col justify-center items-center text-center",
            isWeightValid ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
          )}>
            <div className="relative w-20 h-20 mb-3">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8" className="opacity-10" />
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${(totalWeight / 100) * 226} 226`}
                  className={cn("transition-all duration-1000", isWeightValid ? "text-emerald-500" : "text-amber-500")}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-lg italic">
                {totalWeight}%
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1">Total Scoring Weight</p>
            <p className="text-[11px] font-bold opacity-80">
              {isWeightValid ? 'Weight is perfectly balanced' : `Missing ${100 - totalWeight}% more`}
            </p>
          </GlassCard>
        </div>

        {/* Sections List */}
        <div className="space-y-12">
          {sections.map((section, sIdx) => (
            <div key={section.id} className="relative animate-in slide-in-from-left duration-500">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <input
                    value={section.title}
                    onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                    className="text-2xl font-black text-slate-900 dark:text-white bg-transparent border-none outline-none p-0 tracking-tight"
                  />
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    <span className="w-8 h-0.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                    Section {sIdx + 1} • {section.questions.length} Questions
                  </div>
                </div>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove Section"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {section.questions.map((q, qIdx) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    onUpdate={(upd) => updateQuestion(section.id, q.id, upd)}
                    onRemove={() => setSections(sections.map(s => s.id === section.id ? { ...s, questions: s.questions.filter(qu => qu.id !== q.id) } : s))}
                    onMoveUp={() => moveQuestion(section.id, qIdx, 'up')}
                    onMoveDown={() => moveQuestion(section.id, qIdx, 'down')}
                    isFirst={qIdx === 0}
                    isLast={qIdx === section.questions.length - 1}
                  />
                ))}

                {/* Question Type Shortcuts */}
                <div className="flex flex-wrap gap-2 p-6 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-white/5 items-center justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">Add Question:</span>
                  {(['short_text', 'paragraph', 'rating', 'multiple_choice', 'checkboxes', 'dropdown', 'date', 'file', 'currency', 'number'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => addQuestion(section.id, type)}
                      className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-purple-500 hover:text-purple-500 transition-all shadow-sm"
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Add Section Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={addSection}
              className="flex items-center gap-2 group px-8 py-4 rounded-[32px] bg-slate-100 dark:bg-white/5 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-purple-500 hover:text-white transition-all shadow-lg hover:shadow-purple-500/20"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Add New Section
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---

const Badge: React.FC<{ children: React.ReactNode, variant?: any, size?: any }> = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    primary: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    default: 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-white/10'
  };
  const sizes = { sm: 'px-1.5 py-0.5 text-[8px]', md: 'px-2.5 py-1 text-[10px]' };
  return <span className={cn("inline-flex items-center font-black uppercase tracking-wider border rounded-lg", variants[variant as keyof typeof variants] || variants.default, sizes[size as keyof typeof sizes] || sizes.md)}>{children}</span>;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className, ...props }) => {
  const variants = {
    primary: 'bg-purple-500 text-white hover:bg-purple-600',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    warning: 'bg-amber-500 text-white hover:bg-amber-600'
  };
  return (
    <button
      className={cn(
        "px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center disabled:opacity-50",
        variants[variant],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

export default FormBuilder;
