import React, { useState, useEffect, useCallback } from 'react';
import GlassCard from '../../GlassCard';
import TextField from './TextField';
import NumberField from './NumberField';
import RatingField from './RatingField';
import TextAreaField from './TextAreaField';
import SelectField from './SelectField';
import DateField from './DateField';
import CurrencyField from './CurrencyField';
import PercentageField from './PercentageField';

interface DynamicFormProps {
  config: any;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  initialData = {},
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!onSaveDraft || !hasChanges) return;

    const timer = setTimeout(() => {
      onSaveDraft(formData);
      setHasChanges(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, [formData, hasChanges, onSaveDraft]);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }, [errors]);

  // Normalize a section so it always has a `fields` array.
  // FormBuilder saves sections as { fields: Question[] }
  // The seeder stores sections as { metrics: [{ label, max_score }] }
  // Handle all three shapes.
  const normalizeSection = (section: any) => {
    // Already has fields with content
    if (section.fields?.length) return section;
    // FormBuilder in-memory shape uses 'questions'
    if (section.questions?.length) return { ...section, fields: section.questions };
    // Seeder shape uses 'metrics'
    const metrics: any[] = section.metrics || [];
    return {
      ...section,
      fields: metrics.map((m: any) => ({
        id: m.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: m.label,
        type: 'rating',
        max: m.max_score ?? 10,
        min: 0,
        required: true,
      })),
    };
  };

  const normalizedSections = config.sections?.map(normalizeSection) ?? [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    normalizedSections.forEach((section: any) => {
      section.fields?.forEach((field: any) => {
        if (field.required && (formData[field.id] === undefined || formData[field.id] === null || formData[field.id] === '')) {
          newErrors[field.id] = `${field.label} is required`;
        }

        if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage' || field.type === 'rating') {
          const value = parseFloat(formData[field.id]);
          if (!isNaN(value)) {
            if (field.min !== undefined && value < field.min) {
              newErrors[field.id] = `Minimum value is ${field.min}`;
            }
            if (field.max !== undefined && value > field.max) {
              newErrors[field.id] = `Maximum value is ${field.max}`;
            }
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderField = (field: any) => {
    const commonProps = {
      field,
      value: formData[field.id],
      onChange: (value: any) => handleFieldChange(field.id, value),
      error: errors[field.id],
    };

    switch (field.type) {
      // FormBuilder types
      case 'short_text':
      case 'text':
        return <TextField key={field.id} {...commonProps} />;
      case 'paragraph':
      case 'textarea':
        return <TextAreaField key={field.id} {...commonProps} />;
      case 'multiple_choice':
      case 'checkboxes':
      case 'dropdown':
      case 'select':
        return <SelectField key={field.id} {...commonProps} />;
      case 'number':
        return <NumberField key={field.id} {...commonProps} />;
      case 'currency':
        return <CurrencyField key={field.id} {...commonProps} />;
      case 'percentage':
        return <PercentageField key={field.id} {...commonProps} />;
      case 'rating':
        return <RatingField key={field.id} {...commonProps} />;
      case 'date':
        return <DateField key={field.id} {...commonProps} />;
      // file type — render a basic file input inline
      case 'file':
        return (
          <div key={field.id}>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0]?.name || '')}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {errors[field.id] && <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>}
          </div>
        );
      default:
        // Unknown type — render as text so nothing is silently hidden
        return <TextField key={field.id} {...commonProps} />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {normalizedSections.map((section: any, index: number) => (
        <GlassCard key={index}>
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-xs text-slate-500 mt-1">{section.description}</p>
            )}
          </div>

          <div className="space-y-4">
            {section.fields?.map((field: any) => renderField(field))}
          </div>
        </GlassCard>
      ))}

      <div className="flex gap-3 justify-end">
        {onSaveDraft && (
          <button
            type="button"
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="px-6 py-3 glass border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Save Draft
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#8252e9] hover:bg-[#6d39e0] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {hasChanges && (
        <p className="text-xs text-slate-500 text-center">
          Unsaved changes • Auto-saving in 30 seconds
        </p>
      )}
    </form>
  );
};

export default DynamicForm;
