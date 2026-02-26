
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

  // Split fields into steps of 3 for multi-step experience
  const stepSize = 3;
  const totalSteps = Math.ceil(template.fields.length / stepSize);
  const currentFields = template.fields.slice(currentStep * stepSize, (currentStep + 1) * stepSize);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
    else {
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
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                  value >= star 
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
      {/* Form Progress */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-white">{template.title}</h2>
          <p className="text-slate-400 text-sm mt-1">{template.description}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Step</p>
          <p className="text-lg font-black text-[#8252e9]">{currentStep + 1} / {totalSteps}</p>
        </div>
      </div>

      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#8252e9] transition-all duration-700" 
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }} 
        />
      </div>

      {/* Field Render Section */}
      <div className="space-y-6">
        {currentFields.map((field) => (
          <GlassCard key={field.id} className="relative overflow-hidden">
            <div className="mb-4">
              <h4 className="text-sm font-black text-white tracking-tight">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </h4>
            </div>
            {renderField(field)}
          </GlassCard>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-white/5">
        <button 
          onClick={handleBack}
          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-white'
          }`}
        >
          ← Back
        </button>
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 rounded-xl transition-all"
          >
            Exit
          </button>
          <button 
            onClick={handleNext}
            className="px-8 py-3 bg-[#8252e9] text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {currentStep === totalSteps - 1 ? 'Finish Review' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;
