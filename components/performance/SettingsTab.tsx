import React, { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';

interface SettingsTabProps {
  onNotify?: (title: string, message: string, type: string) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onNotify }) => {
  const [activeSection, setActiveSection] = useState<'general' | 'scoring' | 'notifications' | 'templates' | 'permissions'>('general');
  const [settings, setSettings] = useState({
    general: {
      defaultCycleDuration: '90',
      autoReminders: true,
      requireManagerApproval: true,
      allowSelfEvaluation: true,
      enablePeerReviews: false,
    },
    scoring: {
      passingScore: '70',
      weightValidation: true,
      autoCalculateScores: true,
      showScoresToEmployees: true,
      enableScoreComments: true,
    },
    notifications: {
      evaluationReminders: true,
      approvalNotifications: true,
      cycleUpdates: true,
      emailDigest: 'weekly',
      reminderFrequency: '3',
    },
    templates: {
      defaultTemplate: 'standard',
      allowCustomFields: true,
      requireTemplateApproval: false,
      maxFieldsPerTemplate: '20',
    },
    permissions: {
      hrCanViewAll: true,
      managersCanViewTeam: true,
      employeesCanViewOwn: true,
      allowDataExport: false,
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      if (onNotify) {
        onNotify('Settings Saved', 'Performance management settings have been updated successfully.', 'success');
      }
    } catch (error) {
      if (onNotify) {
        onNotify('Error', 'Failed to save settings. Please try again.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      general: {
        defaultCycleDuration: '90',
        autoReminders: true,
        requireManagerApproval: true,
        allowSelfEvaluation: true,
        enablePeerReviews: false,
      },
      scoring: {
        passingScore: '70',
        weightValidation: true,
        autoCalculateScores: true,
        showScoresToEmployees: true,
        enableScoreComments: true,
      },
      notifications: {
        evaluationReminders: true,
        approvalNotifications: true,
        cycleUpdates: true,
        emailDigest: 'weekly',
        reminderFrequency: '3',
      },
      templates: {
        defaultTemplate: 'standard',
        allowCustomFields: true,
        requireTemplateApproval: false,
        maxFieldsPerTemplate: '20',
      },
      permissions: {
        hrCanViewAll: true,
        managersCanViewTeam: true,
        employeesCanViewOwn: true,
        allowDataExport: false,
      }
    });
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Performance Settings</h3>
          <p className="text-xs text-slate-400 mt-1">Configure performance management system preferences</p>
        </div>
        {hasChanges && (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/5 text-slate-300 font-bold text-sm rounded-xl hover:bg-white/10 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-[#8252e9] text-white font-bold text-sm rounded-xl hover:bg-[#6d39e0] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Settings Navigation */}
      <div className="flex gap-2 border-b border-white/5 pb-4 overflow-x-auto">
        {[
          { key: 'general', label: 'General', icon: '⚙️' },
          { key: 'scoring', label: 'Scoring', icon: '📊' },
          { key: 'notifications', label: 'Notifications', icon: '🔔' },
          { key: 'templates', label: 'Templates', icon: '📋' },
          { key: 'permissions', label: 'Permissions', icon: '🔐' },
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSection === section.key
                ? 'bg-[#8252e9] text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="space-y-6">
          <GlassCard title="General Configuration">
            <div className="space-y-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Default Review Cycle Duration</label>
                <select
                  value={settings.general.defaultCycleDuration}
                  onChange={(e) => handleSettingChange('general', 'defaultCycleDuration', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                >
                  <option value="30" className="bg-[#0d0a1a]">30 days (Monthly)</option>
                  <option value="90" className="bg-[#0d0a1a]">90 days (Quarterly)</option>
                  <option value="180" className="bg-[#0d0a1a]">180 days (Semi-annual)</option>
                  <option value="365" className="bg-[#0d0a1a]">365 days (Annual)</option>
                </select>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'autoReminders', label: 'Automatic Reminders', description: 'Send automatic reminders for pending evaluations' },
                  { key: 'requireManagerApproval', label: 'Require Manager Approval', description: 'All evaluations must be approved by managers' },
                  { key: 'allowSelfEvaluation', label: 'Allow Self-Evaluation', description: 'Employees can evaluate themselves' },
                  { key: 'enablePeerReviews', label: 'Enable Peer Reviews', description: 'Allow peer-to-peer evaluations' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">{setting.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general[setting.key as keyof typeof settings.general] as boolean}
                        onChange={(e) => handleSettingChange('general', setting.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.general[setting.key as keyof typeof settings.general] 
                          ? 'bg-[#8252e9]' 
                          : 'bg-white/20'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
                          settings.general[setting.key as keyof typeof settings.general] 
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Scoring Settings */}
      {activeSection === 'scoring' && (
        <div className="space-y-6">
          <GlassCard title="Scoring Configuration">
            <div className="space-y-6 mt-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Minimum Passing Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.scoring.passingScore}
                  onChange={(e) => handleSettingChange('scoring', 'passingScore', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                />
                <p className="text-xs text-slate-400 mt-1">Scores below this threshold will be flagged for review</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'weightValidation', label: 'Weight Validation', description: 'Ensure question weights total 100%' },
                  { key: 'autoCalculateScores', label: 'Auto-Calculate Scores', description: 'Automatically calculate weighted scores' },
                  { key: 'showScoresToEmployees', label: 'Show Scores to Employees', description: 'Employees can see their evaluation scores' },
                  { key: 'enableScoreComments', label: 'Enable Score Comments', description: 'Allow comments on individual question scores' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">{setting.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.scoring[setting.key as keyof typeof settings.scoring] as boolean}
                        onChange={(e) => handleSettingChange('scoring', setting.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.scoring[setting.key as keyof typeof settings.scoring] 
                          ? 'bg-[#8252e9]' 
                          : 'bg-white/20'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
                          settings.scoring[setting.key as keyof typeof settings.scoring] 
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Notifications Settings */}
      {activeSection === 'notifications' && (
        <div className="space-y-6">
          <GlassCard title="Notification Preferences">
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Email Digest Frequency</label>
                  <select
                    value={settings.notifications.emailDigest}
                    onChange={(e) => handleSettingChange('notifications', 'emailDigest', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                  >
                    <option value="daily" className="bg-[#0d0a1a]">Daily</option>
                    <option value="weekly" className="bg-[#0d0a1a]">Weekly</option>
                    <option value="monthly" className="bg-[#0d0a1a]">Monthly</option>
                    <option value="never" className="bg-[#0d0a1a]">Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Reminder Frequency (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.notifications.reminderFrequency}
                    onChange={(e) => handleSettingChange('notifications', 'reminderFrequency', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'evaluationReminders', label: 'Evaluation Reminders', description: 'Remind users about pending evaluations' },
                  { key: 'approvalNotifications', label: 'Approval Notifications', description: 'Notify when evaluations need approval' },
                  { key: 'cycleUpdates', label: 'Cycle Updates', description: 'Notify about review cycle changes' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">{setting.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications[setting.key as keyof typeof settings.notifications] as boolean}
                        onChange={(e) => handleSettingChange('notifications', setting.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.notifications[setting.key as keyof typeof settings.notifications] 
                          ? 'bg-[#8252e9]' 
                          : 'bg-white/20'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
                          settings.notifications[setting.key as keyof typeof settings.notifications] 
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Templates Settings */}
      {activeSection === 'templates' && (
        <div className="space-y-6">
          <GlassCard title="Template Management">
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Default Template</label>
                  <select
                    value={settings.templates.defaultTemplate}
                    onChange={(e) => handleSettingChange('templates', 'defaultTemplate', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                  >
                    <option value="standard" className="bg-[#0d0a1a]">Standard Evaluation</option>
                    <option value="360" className="bg-[#0d0a1a]">360-Degree Review</option>
                    <option value="self" className="bg-[#0d0a1a]">Self-Assessment</option>
                    <option value="manager" className="bg-[#0d0a1a]">Manager Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Max Fields Per Template</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={settings.templates.maxFieldsPerTemplate}
                    onChange={(e) => handleSettingChange('templates', 'maxFieldsPerTemplate', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#8252e9] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'allowCustomFields', label: 'Allow Custom Fields', description: 'Users can create custom field types' },
                  { key: 'requireTemplateApproval', label: 'Require Template Approval', description: 'New templates need admin approval' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">{setting.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.templates[setting.key as keyof typeof settings.templates] as boolean}
                        onChange={(e) => handleSettingChange('templates', setting.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.templates[setting.key as keyof typeof settings.templates] 
                          ? 'bg-[#8252e9]' 
                          : 'bg-white/20'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
                          settings.templates[setting.key as keyof typeof settings.templates] 
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Permissions Settings */}
      {activeSection === 'permissions' && (
        <div className="space-y-6">
          <GlassCard title="Access Permissions">
            <div className="space-y-6 mt-4">
              <div className="space-y-4">
                {[
                  { key: 'hrCanViewAll', label: 'HR Can View All Data', description: 'HR administrators can access all performance data' },
                  { key: 'managersCanViewTeam', label: 'Managers Can View Team Data', description: 'Managers can view their team members\' performance' },
                  { key: 'employeesCanViewOwn', label: 'Employees Can View Own Data', description: 'Employees can view their own performance history' },
                  { key: 'allowDataExport', label: 'Allow Data Export', description: 'Users can export performance data' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">{setting.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.permissions[setting.key as keyof typeof settings.permissions] as boolean}
                        onChange={(e) => handleSettingChange('permissions', setting.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${
                        settings.permissions[setting.key as keyof typeof settings.permissions] 
                          ? 'bg-[#8252e9]' 
                          : 'bg-white/20'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${
                          settings.permissions[setting.key as keyof typeof settings.permissions] 
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;