
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { FormTemplate, FormField } from '../types';

interface EvaluationFormProps {
  template: FormTemplate;
  employeeName: string;
  onClose: () => void;
  onSubmit: (answers: Record<string, any>) => void;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ template, employeeName, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Bridge backend EvaluationTemplate (sessions) to frontend FormTemplate (fields)
  const flattenedFields = (template as any).fields ||
    ((template as any).sessions ? (template as any).sessions.flatMap((s: any) => s.fields || []) : []);

  const safeFields = flattenedFields || [];

  // Split fields into steps of 3 for multi-step experience
  const stepSize = 3;
  const totalSteps = Math.ceil(safeFields.length / stepSize);
  const currentFields = safeFields.slice(currentStep * stepSize, (currentStep + 1) * stepSize);

  // Calculate completion progress
  const requiredFields = safeFields.filter(f => f.required);
  const completedRequired = requiredFields.filter(f => answers[f.id] !== undefined && answers[f.id] !== '').length;
  const allFields = safeFields;
  const completedAll = allFields.filter(f => answers[f.id] !== undefined && answers[f.id] !== '').length;

  const requiredProgress = requiredFields.length > 0 ? (completedRequired / requiredFields.length) * 100 : 100;
  const overallProgress = allFields.length > 0 ? (completedAll / allFields.length) * 100 : 100;

  // Calculate current score for scorable fields
  const calculateCurrentScore = () => {
    const scorableFields = safeFields.filter(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type));
    if (scorableFields.length === 0) return null;

    let totalWeight = 0;
    let weightedScore = 0;

    scorableFields.forEach(field => {
      const weight = field.weight || 0;
      const answer = answers[field.id];

      if (answer !== undefined && answer !== '') {
        totalWeight += weight;

        let fieldScore = 0;
        if (field.type === 'RATING') {
          fieldScore = (parseInt(answer) / 5) * 100;
        } else if (field.type === 'MULTIPLE_CHOICE') {
          // Assign scores based on option index (first option = 100%, last = 0%)
          const optionIndex = field.options?.indexOf(answer) || 0;
          const totalOptions = field.options?.length || 1;
          fieldScore = ((totalOptions - optionIndex) / totalOptions) * 100;
        } else if (field.type === 'KPI') {
          fieldScore = Math.min(100, parseFloat(answer) || 0);
        }

        weightedScore += (fieldScore * weight) / 100;
      }
    });

    return totalWeight > 0 ? Math.round(weightedScore) : null;
  };

  const getScoringData = () => {
    const scorableFields = safeFields.filter(f => ['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(f.type));
    const totalWeight = scorableFields.reduce((acc, f) => acc + (f.weight || 0), 0);
    return {
      currentScore: calculateCurrentScore() || 0,
      maxPossibleScore: totalWeight || 100,
      hasScorableFields: scorableFields.length > 0
    };
  };

  const { currentScore, maxPossibleScore, hasScorableFields } = getScoringData();

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));

    // Clear validation error when user provides input
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};

    currentFields.forEach(field => {
      if (field.required) {
        const answer = answers[field.id];
        if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          errors[field.id] = 'This field is required';
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsSubmitted(true);
      onSubmit(answers);
      setTimeout(onClose, 3000);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const renderField = (field: FormField) => {
    const value = answers[field.id] || '';

    switch (field.type) {
      case 'SHORT_TEXT':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9]"
            placeholder={field.placeholder || "Your answer"}
          />
        );
      case 'PARAGRAPH':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9] min-h-[120px]"
            placeholder={field.placeholder || "Long answer text"}
          />
        );
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === opt}
                  onChange={() => handleInputChange(field.id, opt)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${value === opt ? 'border-[#8252e9] bg-[#8252e9]' : 'border-white/20 group-hover:border-white/40'}`}>
                  {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-slate-300 group-hover:text-white transition-colors">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'CHECKBOXES':
        const checkedValues = Array.isArray(value) ? value : [];
        const toggleCheckbox = (opt: string) => {
          const newVal = checkedValues.includes(opt)
            ? checkedValues.filter(v => v !== opt)
            : [...checkedValues, opt];
          handleInputChange(field.id, newVal);
        };
        return (
          <div className="space-y-3">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checkedValues.includes(opt)}
                  onChange={() => toggleCheckbox(opt)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${checkedValues.includes(opt) ? 'border-[#8252e9] bg-[#8252e9]' : 'border-white/20 group-hover:border-white/40'}`}>
                  {checkedValues.includes(opt) && <span className="text-white text-[10px]">✓</span>}
                </div>
                <span className="text-slate-300 group-hover:text-white transition-colors">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'DROPDOWN':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9]"
          >
            <option value="" className="bg-[#0f172a]">Choose an option</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt} className="bg-[#0f172a]">{opt}</option>
            ))}
          </select>
        );
      case 'RATING':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleInputChange(field.id, star)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${value >= star
                  ? 'bg-[#8252e9] text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 text-slate-700 hover:bg-white/10'
                  }`}
              >
                ★
              </button>
            ))}
          </div>
        );
      case 'DATE':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#8252e9]"
          />
        );
      case 'FILE':
        return (
          <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-500 group hover:border-[#8252e9]/50 transition-all cursor-pointer relative">
            <span className="text-3xl mb-2">📎</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Select files to upload</p>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        );
      case 'KPI':
        return (
          <div className="p-6 bg-[#8252e9]/5 border border-[#8252e9]/20 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-tight">Active Performance Metric</span>
              <span className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest">Linked to Organization OKR</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#8252e9] w-[75%]" />
            </div>
            <input
              type="number"
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1 text-white w-24 outline-none"
              placeholder="Result"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-emerald-500/40 animate-bounce">
          ✅
        </div>
        <h2 className="text-3xl font-black text-white">Review Submitted</h2>
        <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Records updated successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Form Progress Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-white">{template.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{template.description}</p>
            {hasScorableFields && (
              <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Scoring Matrix
                  </h3>
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">Real-time Calculation</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter">{currentScore.toFixed(1)}</span>
                  <span className="text-slate-500 font-black text-sm mb-2 uppercase tracking-widest">/ {maxPossibleScore.toFixed(0)} Points</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-4 leading-relaxed uppercase tracking-widest max-w-[200px]">Strategic performance alignment based on weighted KPI parameters.</p>
              </div>
            )}
            <p className="text-slate-500 text-xs mt-1">Evaluating: <span className="text-white font-bold">{employeeName}</span></p>
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step Progress</p>
              <p className="text-lg font-black text-[#8252e9]">{currentStep + 1} / {totalSteps}</p>
            </div>
            {currentScore !== null && (
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Score</p>
                <p className="text-lg font-black text-emerald-400">{currentScore}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Step Progress */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Section Milestone</span>
              <span className="text-[10px] font-black text-[#8252e9] uppercase tracking-widest">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-[#8252e9] to-[#a855f7] rounded-full transition-all duration-700 relative"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Overall Completion */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Completion Matrix</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Required Fields */}
          {requiredFields.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Required Fields</span>
                <span className="text-xs text-slate-400">{completedRequired}/{requiredFields.length}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${requiredProgress === 100 ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`}
                  style={{ width: `${requiredProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Field Render Section */}
      <div className="space-y-6">
        {currentFields.map((field) => (
          <GlassCard key={field.id} className={`relative overflow-hidden ${validationErrors[field.id] ? 'border-red-500/50 bg-red-500/5' : ''
            }`}>
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-rose-500">*</span>}
                  {['RATING', 'MULTIPLE_CHOICE', 'KPI'].includes(field.type) && field.weight && (
                    <span className="px-2 py-0.5 bg-[#8252e9]/20 text-[#8252e9] text-[10px] font-black uppercase rounded">
                      {field.weight}% Weight
                    </span>
                  )}
                </h4>
                {validationErrors[field.id] && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" strokeWidth="2" />
                    </svg>
                    {validationErrors[field.id]}
                  </p>
                )}
              </div>
              {field.type === 'RATING' && answers[field.id] && (
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    {Math.round((parseInt(answers[field.id]) / 5) * 100)}%
                  </div>
                  <div className="text-xs text-slate-400">Score</div>
                </div>
              )}
            </div>
            <div className={validationErrors[field.id] ? 'animate-pulse' : ''}>
              {renderField(field)}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-white/5">
        <button
          onClick={handleBack}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-white'
            }`}
        >
          ← Back
        </button>

        <div className="flex items-center gap-4">
          {/* Progress Summary */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Completion</div>
            <div className="text-sm font-bold text-white">{Math.round(overallProgress)}%</div>
          </div>

          {currentScore !== null && (
            <div className="text-center">
              <div className="text-xs text-slate-400">Score</div>
              <div className="text-sm font-bold text-emerald-400">{currentScore}%</div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 rounded-xl transition-all"
          >
            Exit
          </button>
          <button
            onClick={handleNext}
            disabled={currentFields.some(f => f.required && (!answers[f.id] || answers[f.id] === ''))}
            className={`px-8 py-3 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl transition-all ${currentFields.some(f => f.required && (!answers[f.id] || answers[f.id] === ''))
              ? 'bg-slate-500 text-slate-300 cursor-not-allowed'
              : 'bg-[#8252e9] text-white shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {currentStep === totalSteps - 1 ? 'Finish Review' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;
