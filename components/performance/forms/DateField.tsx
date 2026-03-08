import React from 'react';

interface DateFieldProps {
  field: any;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const DateField: React.FC<DateFieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 mb-2">{field.description}</p>
      )}
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full glass border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-[#8252e9] transition-all"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default DateField;
