import React, { useState, useEffect } from 'react';
import GlassCard from '../../GlassCard';
import DynamicForm from '../forms/DynamicForm';
import performanceService from '../../../services/performanceService';
import Skeleton from '../../Skeleton';

interface StaffPortalProps {
  onNotify?: (title: string, message: string, type: any) => void;
}

const StaffPortal: React.FC<StaffPortalProps> = ({ onNotify }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [config, setConfig] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [draft, setDraft] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isLoading && config && submissions.length === 0 && onNotify) {
      const notifiedKey = `notified_eval_${config.id}_${selectedPeriod}`;
      if (!localStorage.getItem(notifiedKey)) {
        onNotify(
          'New Evaluation Available',
          `Your ${selectedPeriod} performance evaluation is ready to be filled.`,
          'PENDING_REVIEW'
        );
        localStorage.setItem(notifiedKey, 'true');
      }
    }
  }, [isLoading, config, submissions, selectedPeriod, onNotify]);

  function getCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  function getWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Get user's department from localStorage
      const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
      const departmentId = user.employee_profile?.department_id;

      if (!departmentId) {
        console.warn('StaffPortal: no department_id found for user');
        setIsLoading(false);
        return;
      }

      // Load submissions and draft concurrently; config may not exist yet
      const [submissionsData, draftData] = await Promise.all([
        performanceService.getSubmissions({ per_page: 10 }),
        performanceService.getDraft(departmentId, selectedPeriod).catch(() => null)
      ]);

      // Config is optional — gracefully handle employee with no active template
      try {
        const configData = await performanceService.getConfigForEmployee();
        setConfig(configData);
      } catch {
        setConfig(null); // No active config yet — admin hasn't published one
      }

      // Submissions can come back as array or paginated object
      const list = Array.isArray(submissionsData)
        ? submissionsData
        : (submissionsData?.data || []);
      setSubmissions(list);
      setDraft(draftData);
    } catch (error) {
      console.error('Failed to load data:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to load performance data', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);

      const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
      const departmentId = user.employee_profile?.department_id;

      await performanceService.createSubmission({
        period: selectedPeriod,
        form_data: formData
      });

      if (onNotify) {
        onNotify('Success', 'Performance submission created successfully', 'success');
      }

      setView('list');
      loadData();
    } catch (error) {
      console.error('Failed to submit:', error);
      if (onNotify) {
        onNotify('Error', 'Failed to submit performance data', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (formData: Record<string, any>) => {
    try {
      const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
      const departmentId = user.employee_profile?.department_id;

      await performanceService.saveDraft({
        department_id: departmentId,
        period: selectedPeriod,
        form_data: formData
      });

      if (onNotify) {
        onNotify('Success', 'Draft saved', 'success');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  if (view === 'form' && config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 glass border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              New Performance Evaluation
            </h2>
            <p className="text-xs text-slate-500">Period: {selectedPeriod}</p>
          </div>
        </div>

        <DynamicForm
          config={config}
          initialData={draft?.form_data || {}}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            My Performance
          </h2>
          <p className="text-xs text-slate-500 mt-1">Track your performance evaluations</p>
        </div>
        <button
          onClick={() => setView('form')}
          disabled={!config}
          className="px-6 py-3 bg-[#8252e9] hover:bg-[#6d39e0] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
        >
          + New Evaluation
        </button>
      </div>

      <GlassCard title="Recent Evaluations">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton variant="rectangle" width={80} height={60} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" height={12} />
                  <Skeleton variant="text" width="40%" height={10} />
                </div>
                <Skeleton variant="rectangle" width={60} height={24} />
              </div>
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            {!config ? (
              <>
                <div className="text-5xl mb-4">⚙️</div>
                <p className="text-sm font-black uppercase text-slate-400 tracking-wider mb-2">No Evaluation Template</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Your department doesn't have an active performance template yet. Contact your HR administrator to set one up.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">📝</div>
                <p className="text-slate-400 mb-4">No evaluations yet</p>
                <button
                  onClick={() => setView('form')}
                  className="px-6 py-3 bg-[#8252e9] hover:bg-[#6d39e0] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                >
                  Start First Evaluation
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-all"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Period: {submission.period}
                  </p>
                  <p className="text-xs text-slate-500">
                    Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#8252e9]">{submission.score}</p>
                  {submission.rating && (
                    <span className={`text-xs px-2 py-1 rounded ${submission.rating.bgColor} ${submission.rating.color}`}>
                      {submission.rating.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default StaffPortal;
