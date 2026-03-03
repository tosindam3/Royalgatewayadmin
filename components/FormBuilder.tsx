
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { FormField, FormFieldType, FormTemplate } from '../types';
import { generateFormTemplate } from '../services/geminiService';
import performanceService from '../services/performanceService';

// Add CSS for slider styling
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8252e9;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(130, 82, 233, 0.5);
  }
  
  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #8252e9;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px rgba(130, 82, 233, 0.5);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
}

interface FieldEditorProps {
  field: FormField;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onRemove: () => void;
  onWeightChange: (weight: number) => void;
  totalWeight: number;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  onWeightChange,
  totalWeight
}) => {
  const isScorableField = ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(field.type);
  const fieldWeight = field.weight || 0;

  const getFieldIcon = (type: FormFieldType) => {
    const icons = {
      'SHORT_TEXT': '✍️',
      'PARAGRAPH': '📝',
      'RATING': '⭐',
      'MULTIPLE_CHOICE': '🔘',
      'CHECKBOXES': '☑️',
      'DROPDOWN': '📋',
      'DATE': '📅',
      'FILE': '📎',
      'KPI': '📊'
    };
    return icons[type] || '❓';
  };

  const addOption = () => {
    const currentOptions = field.options || [];
    onUpdate({
      options: [...currentOptions, `Option ${currentOptions.length + 1}`]
    });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const updatedOptions = (field.options || []).map((opt, i) =>
      i === optionIndex ? value : opt
    );
    onUpdate({ options: updatedOptions });
  };

  const removeOption = (optionIndex: number) => {
    const updatedOptions = (field.options || []).filter((_, i) => i !== optionIndex);
    onUpdate({ options: updatedOptions });
  };

  return (
    <div className={`bg-white/5 border rounded-2xl transition-all ${isEditing ? 'border-[#8252e9] shadow-lg shadow-[#8252e9]/20' : 'border-white/10 hover:border-white/20'
      }`}>
      {/* Field Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFieldIcon(field.type)}</span>
          <div>
            <h4 className="text-sm font-bold text-white">{field.label}</h4>
            <p className="text-xs text-slate-400">{field.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isScorableField && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Weight:</span>
              <span className={`text-sm font-bold px-2 py-1 rounded ${fieldWeight > 0 ? 'bg-[#8252e9]/20 text-[#8252e9]' : 'bg-slate-500/20 text-slate-400'
                }`}>
                {fieldWeight}%
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={onRemove}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Field Editor */}
      {isEditing && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Question Label</label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
            />
          </div>

          {field.placeholder !== undefined && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Placeholder Text</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
              />
            </div>
          )}

          {/* Options for choice fields */}
          {['MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN'].includes(field.type) && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-300">Options</label>
                <button
                  onClick={addOption}
                  className="px-2 py-1 bg-[#8252e9] text-white text-xs font-bold rounded hover:bg-[#6d39e0] transition-all"
                >
                  + Add Option
                </button>
              </div>
              <div className="space-y-2">
                {(field.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(optionIndex, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                    />
                    {(field.options?.length || 0) > 1 && (
                      <button
                        onClick={() => removeOption(optionIndex)}
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weight adjustment for scorable fields */}
          {isScorableField && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Scoring Weight ({fieldWeight}%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={fieldWeight}
                  onChange={(e) => onWeightChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fieldWeight}
                  onChange={(e) => onWeightChange(parseInt(e.target.value) || 0)}
                  className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
                />
              </div>
              {totalWeight > 100 && (
                <p className="text-xs text-red-400 mt-1">
                  Total weight exceeds 100%. Consider adjusting other fields.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${field.required ? 'border-[#8252e9] bg-[#8252e9]' : 'border-white/20'
                }`}>
                {field.required && (
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="3" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-slate-300">Required field</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

interface DraggableItemProps {
  type: FormFieldType;
  label: string;
  icon: string;
  onClick: () => void;
}

const DraggableSourceItem: React.FC<DraggableItemProps> = ({ type, label, icon, onClick }) => {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourceType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-3 cursor-pointer active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-white/10 hover:border-[#8252e9]/50 transition-all group"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{label}</span>
    </div>
  );
};

interface FormBuilderProps {
  onBack: () => void;
  initialTemplate?: FormTemplate;
  onSave: (template: FormTemplate) => void;
}

interface WeightedFormField extends FormField {
  weight: number;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ onBack, initialTemplate, onSave }) => {
  const [template, setTemplate] = useState<FormTemplate>(initialTemplate || {
    id: Math.random().toString(36).substr(2, 9),
    title: 'Untitled Performance Review',
    description: 'Provide your feedback for the current performance cycle.',
    fields: [],
    createdAt: new Date().toISOString()
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [editingField, setEditingField] = useState<number | null>(null);
  const [showWeightWarning, setShowWeightWarning] = useState(false);

  // Calculate total weight
  const totalWeight = template.fields.reduce((sum, field) => sum + (field.weight || 0), 0);
  const isWeightValid = totalWeight === 100;
  const weightProgress = Math.min(100, totalWeight);

  // Auto-adjust weights when fields are added/removed
  const autoAdjustWeights = (fields: FormField[]) => {
    if (fields.length === 0) return fields;

    const scorableFields = fields.filter(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type));
    if (scorableFields.length === 0) return fields;

    const baseWeight = Math.floor(100 / scorableFields.length);
    const remainder = 100 - (baseWeight * scorableFields.length);

    return fields.map((field, index) => {
      if (['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(field.type)) {
        const scorableIndex = scorableFields.findIndex(f => f.id === field.id);
        return {
          ...field,
          weight: baseWeight + (scorableIndex < remainder ? 1 : 0)
        };
      }
      return { ...field, weight: 0 };
    });
  };

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: `${type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} Question`,
      required: true,
      weight: ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(type) ? 20 : 0,
      ...(type === 'MULTIPLE_CHOICE' && { options: ['Option 1', 'Option 2', 'Option 3'] }),
      ...(type === 'CHECKBOXES' && { options: ['Option 1', 'Option 2', 'Option 3'] }),
      ...(type === 'DROPDOWN' && { options: ['Option 1', 'Option 2', 'Option 3'] })
    };

    const updatedFields = [...template.fields, newField];
    const adjustedFields = autoAdjustWeights(updatedFields);

    setTemplate(prev => ({ ...prev, fields: adjustedFields }));
    setEditingField(adjustedFields.length - 1);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = template.fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setTemplate(prev => ({ ...prev, fields: updatedFields }));
  };

  const removeField = (index: number) => {
    const updatedFields = template.fields.filter((_, i) => i !== index);
    const adjustedFields = autoAdjustWeights(updatedFields);
    setTemplate(prev => ({ ...prev, fields: adjustedFields }));
    setEditingField(null);
  };

  const handleWeightChange = (index: number, newWeight: number) => {
    if (newWeight < 0 || newWeight > 100) return;

    updateField(index, { weight: newWeight });

    // Show warning if total exceeds 100
    const newTotal = template.fields.reduce((sum, field, i) =>
      sum + (i === index ? newWeight : (field.weight || 0)), 0
    );

    if (newTotal > 100) {
      setShowWeightWarning(true);
      setTimeout(() => setShowWeightWarning(false), 3000);
    }
  };

  const redistributeWeights = () => {
    const adjustedFields = autoAdjustWeights(template.fields);
    setTemplate(prev => ({ ...prev, fields: adjustedFields }));
  };

  const handleSave = async () => {
    if (!isWeightValid && template.fields.some(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type))) {
      setShowWeightWarning(true);
      setTimeout(() => setShowWeightWarning(false), 3000);
      return;
    }

    try {
      // Save to backend
      const savedTemplate = await performanceService.createTemplate({
        title: template.title,
        description: template.description,
        fields: template.fields,
        is_global: template.isGlobal
      });

      onSave(savedTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
      // Fallback to local save
      onSave(template);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const result = await generateFormTemplate(aiPrompt);
      if (result && result.fields) {
        const adjustedFields = autoAdjustWeights(result.fields);
        setTemplate({
          ...template,
          title: result.title || template.title,
          description: result.description || template.description,
          fields: adjustedFields
        });
        setShowAiModal(false);
        setAiPrompt('');
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <button onClick={onBack} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white mb-2 flex items-center gap-2 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>Back</button>
          <input type="text" value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} className="text-4xl font-black text-slate-900 dark:text-white bg-transparent outline-none border-b-2 border-transparent focus:border-[#8252e9] w-full transition-all" placeholder="Template Title" />
        </div>
        <div className="flex gap-3 ml-8">
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all">
            <input
              type="checkbox"
              checked={template.isGlobal || false}
              onChange={(e) => setTemplate({ ...template, isGlobal: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-all relative ${template.isGlobal ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${template.isGlobal ? 'left-6' : 'left-1'}`} />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Form</span>
          </label>
          <button onClick={() => setShowAiModal(true)} className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-2">✨ AI Architect</button>
          <button
            onClick={handleSave}
            disabled={!isWeightValid && template.fields.some(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type))}
            className={`px-8 py-3 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-xl transition-all flex items-center gap-2 ${isWeightValid || !template.fields.some(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type))
              ? 'bg-[#8252e9] shadow-purple-500/20 hover:bg-[#6d39e0] active:scale-95'
              : 'bg-slate-500 cursor-not-allowed opacity-50'
              }`}>
            {!isWeightValid && template.fields.some(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type)) ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" strokeWidth="2" />
                </svg>
                Fix Weights
              </>
            ) : (
              'Save Template'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-280px)]">
        <aside className="lg:col-span-3 space-y-6 h-full overflow-y-auto pr-2 no-scrollbar">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Question Types</p>
            <div className="space-y-2">
              <DraggableSourceItem type="SHORT_TEXT" label="Short Answer" icon="✍️" onClick={() => addField('SHORT_TEXT')} />
              <DraggableSourceItem type="PARAGRAPH" label="Long Answer" icon="📝" onClick={() => addField('PARAGRAPH')} />
              <DraggableSourceItem type="RATING" label="Star Rating" icon="⭐" onClick={() => addField('RATING')} />
              <DraggableSourceItem type="MULTIPLE_CHOICE" label="Multiple Choice" icon="🔘" onClick={() => addField('MULTIPLE_CHOICE')} />
              <DraggableSourceItem type="CHECKBOXES" label="Checkboxes" icon="☑️" onClick={() => addField('CHECKBOXES')} />
              <DraggableSourceItem type="DROPDOWN" label="Dropdown" icon="📋" onClick={() => addField('DROPDOWN')} />
              <DraggableSourceItem type="DATE" label="Date Picker" icon="📅" onClick={() => addField('DATE')} />
              <DraggableSourceItem type="FILE" label="File Upload" icon="📎" onClick={() => addField('FILE')} />
              <DraggableSourceItem type="KPI" label="KPI Metric" icon="📊" onClick={() => addField('KPI')} />
            </div>
          </div>

          {/* Weight Summary */}
          {template.fields.length > 0 && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Scoring Weight</h4>
                <span className={`text-sm font-bold ${isWeightValid ? 'text-emerald-400' : totalWeight > 100 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {totalWeight}%
                </span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 ${isWeightValid ? 'bg-emerald-500' :
                    totalWeight > 100 ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}
                  style={{ width: `${Math.min(100, weightProgress)}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[9px] text-slate-400">
                  {isWeightValid ? 'Perfect!' : totalWeight > 100 ? 'Over limit' : 'Incomplete'}
                </p>
                {!isWeightValid && (
                  <button
                    onClick={redistributeWeights}
                    className="text-[9px] font-bold text-[#8252e9] hover:text-white transition-all"
                  >
                    Auto-fix
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>

        <main className="lg:col-span-9 h-full border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] p-6 overflow-y-auto no-scrollbar">
          {template.fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">Start Building Your Form</h3>
              <p className="text-slate-400 mb-6">Add questions from the sidebar or use AI Architect to generate a complete form</p>
              <button
                onClick={() => setShowAiModal(true)}
                className="px-6 py-3 bg-[#8252e9] text-white font-bold text-sm rounded-xl hover:bg-[#6d39e0] transition-all flex items-center gap-2"
              >
                ✨ Use AI Architect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {template.fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  index={index}
                  isEditing={editingField === index}
                  onEdit={() => setEditingField(editingField === index ? null : index)}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                  onWeightChange={(weight) => handleWeightChange(index, weight)}
                  totalWeight={totalWeight}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Weight Warning */}
      {showWeightWarning && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" strokeWidth="2" />
            </svg>
            <span className="font-bold text-sm">
              {totalWeight > 100 ? 'Total weight exceeds 100%' : 'Total weight must equal 100%'}
            </span>
          </div>
        </div>
      )}

      {/* AI CENTERED MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowAiModal(false)} />
          <div className="max-w-xl w-full bg-white dark:bg-[#0d0a1a] rounded-[40px] p-10 border border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><span className="text-2xl">✨</span> AI Form Architect</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Describe the evaluation requirements for strategy synthesis.</p>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg></button>
            </div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Build a performance evaluation for senior developers focusing on system architecture..." className="w-full h-40 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-6 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500/50 transition-all mb-6 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowAiModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleAiGenerate} disabled={isAiGenerating || !aiPrompt.trim()} className="flex-[2] py-4 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                {isAiGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate Form Structure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilder;
