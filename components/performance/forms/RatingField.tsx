import React from 'react';

interface RatingFieldProps {
  field: any;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const RatingField: React.FC<RatingFieldProps> = ({ field, value, onChange, error }) => {
  const maxRating = field.max || 5;
  const ratings = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-slate-500 mb-2">{field.description}</p>
      )}
      <div className="flex gap-2">
        {ratings.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${
              value >= rating
                ? 'bg-[#8252e9] text-white shadow-lg shadow-purple-500/20'
                : 'glass border border-slate-200 dark:border-white/10 text-slate-500 hover:border-[#8252e9]'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default RatingField;
