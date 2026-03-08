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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    config.sections?.forEach((section: any) => {
      section.fields?.forEach((field: any) => {
        if (field.required && !formData[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }

        // Validate min/max for numeric fields
        if (field.type === 'number' || field.type === 'currency' || field.type === 'percentage') {
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
      case 'text':
        return <TextField key={field.id} {...commonProps} />;
      case 'number':
        return <NumberField key={field.id} {...commonProps} />;
      case 'currency':
        return <CurrencyField key={field.id} {...commonProps} />;
      case 'percentage':
        return <PercentageField key={field.id} {...commonProps} />;
      case 'rating':
        return <RatingField key={field.id} {...commonProps} />;
      case 'textarea':
        return <TextAreaField key={field.id} {...commonProps} />;
      case 'select':
        return <SelectField key={field.id} {...commonProps} />;
      case 'date':
        return <DateField key={field.id} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.sections?.map((section: any, index: number) => (
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
