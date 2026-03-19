import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import type { JobOpening } from '../../types/talent';

interface ApplicationFormModalProps {
  job: JobOpening;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { cover_letter: string; resume?: File; referrer_employee_id?: number }) => void;
  isSubmitting?: boolean;
}

const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  job,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [referrerId, setReferrerId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      cover_letter: coverLetter,
      resume: resume || undefined,
      referrer_employee_id: referrerId ? parseInt(referrerId) : undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setResume(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Apply for Position
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Cover Letter <span className="text-red-500">*</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
              rows={8}
              maxLength={5000}
              placeholder="Tell us why you're a great fit for this role..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
              {coverLetter.length}/5000 characters
            </p>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Resume/CV
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="flex items-center justify-center gap-3 w-full px-4 py-6 bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl cursor-pointer hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group"
              >
                {resume ? (
                  <>
                    <FileText className="w-5 h-5 text-orange-500" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{resume.name}</p>
                      <p className="text-xs text-slate-500">
                        {(resume.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Click to upload resume
                      </p>
                      <p className="text-xs text-slate-500">PDF, DOC, DOCX (Max 5MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Referrer (Optional) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Employee Referral ID (Optional)
            </label>
            <input
              type="number"
              value={referrerId}
              onChange={(e) => setReferrerId(e.target.value)}
              placeholder="Enter employee ID if referred"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !coverLetter.trim()}
              className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationFormModal;
