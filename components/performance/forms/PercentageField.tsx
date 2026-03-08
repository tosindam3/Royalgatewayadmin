import React from 'react';

interface PercentageFieldProps {
  field: any;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const PercentageField: React.FC<PercentageFieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.target && (
          <span className="text-xs text-slate-500 ml-2">(Target: {field.target}%)</span>
        )}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 mb-2">{field.description}</p>
      )}
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={field.placeholder}
          min={field.min || 0}
          max={field.max || 100}
          step="0.1"
          className="w-full glass border border-slate-200 dark:border-white/10 rounded-xl px-4 pr-10 py-3 text-slate-900 dark:text-white outline-none focus:border-[#8252e9] transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default PercentageField;
