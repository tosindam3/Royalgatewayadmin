import React, { useState } from 'react';
import AIAdvisorModal from './AIAdvisorModal';

const AIAdvisorButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 border border-brand-primary/20 dark:border-brand-primary/30 transition-all duration-200 group hover:shadow-[0_0_15px_rgba(130,82,233,0.3)] dark:hover:shadow-[0_0_20px_rgba(130,82,233,0.2)]"
        aria-label="Open AI Advisor"
      >
        {/* Orb */}
        <span className="relative flex-shrink-0">
          <span className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] animate-[pulse_3s_ease-in-out_infinite]">
            ✦
          </span>
          {/* Live dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-[#0d0a1a]" />
        </span>

        {/* Label — hidden on small screens */}
        <span className="hidden sm:block text-xs font-semibold text-brand-primary tracking-wide">
          AI Advisor
        </span>
      </button>

      {open && <AIAdvisorModal onClose={() => setOpen(false)} />}
    </>
  );
};

export default AIAdvisorButton;
