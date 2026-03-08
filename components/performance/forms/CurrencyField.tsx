import React from 'react';

interface CurrencyFieldProps {
  field: any;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({ field, value, onChange, error }) => {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        {field.target && (
          <span className="text-xs text-slate-500 ml-2">(Target: ₦{field.target.toLocaleString()})</span>
        )}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 mb-2">{field.description}</p>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₦</span>
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder={field.placeholder}
          min={field.min || 0}
          step="0.01"
          className="w-full glass border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white outline-none focus:border-[#8252e9] transition-all"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CurrencyField;
