import React from 'react';

interface NumberFieldProps {
  field: any;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const NumberField: React.FC<NumberFieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.target && (
          <span className="text-xs text-slate-500 ml-2">(Target: {field.target})</span>
        )}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 mb-2">{field.description}</p>
      )}
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step || 1}
        className="w-full glass border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-[#8252e9] transition-all"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default NumberField;
