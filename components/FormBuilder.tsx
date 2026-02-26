
import React, { useState } from 'react';
import GlassCard from './GlassCard';
import { FormField, FormFieldType, FormTemplate } from '../types';
import { generateFormTemplate } from '../services/geminiService';

interface DraggableItemProps {
  type: FormFieldType;
  label: string;
  icon: string;
}

const DraggableSourceItem: React.FC<DraggableItemProps> = ({ type, label, icon }) => {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sourceType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-white/10 hover:border-[#8252e9]/50 transition-all group"
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const result = await generateFormTemplate(aiPrompt);
      if (result && result.fields) {
        setTemplate({ ...template, title: result.title || template.title, description: result.description || template.description, fields: result.fields });
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
          <button onClick={() => setShowAiModal(true)} className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-2">✨ AI Architect</button>
          <button onClick={() => onSave(template)} className="px-8 py-3 bg-[#8252e9] text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all">Save Template</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-[calc(100vh-280px)]">
        <aside className="lg:col-span-3 space-y-6 h-full overflow-y-auto pr-2 no-scrollbar">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-1">Questions Types</p>
          <div className="space-y-2">
            <DraggableSourceItem type="SHORT_TEXT" label="Short Answer" icon="✍️" />
            <DraggableSourceItem type="RATING" label="Star Rating" icon="⭐️" />
          </div>
        </aside>
        <main className="lg:col-span-9 h-full border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[32px] p-6 overflow-y-auto no-scrollbar">
           <p className="text-center text-slate-400 text-xs mt-10">Drag components or use AI Architect to build the form.</p>
        </main>
      </div>

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
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg></button>
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
