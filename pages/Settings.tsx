
import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { BrandSettings, UserProfile } from '../types';
import { updateBrandColor } from '../utils/brandColors';
import CurrencySettings from '../components/CurrencySettings';

interface SettingsProps {
  brand: BrandSettings;
  onUpdate: (b: BrandSettings) => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ brand, onUpdate, userProfile, onUpdateProfile }) => {
  const [localBrand, setLocalBrand] = useState<BrandSettings>(brand);
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [activeTab, setActiveTab] = useState<'brand' | 'profile' | 'currency'>('profile');

  const handleSaveBrand = () => {
    onUpdate(localBrand);
  };

  const handleSaveProfile = () => {
    onUpdateProfile(localProfile);
  };

  // Update CSS variables when brand color changes
  useEffect(() => {
    updateBrandColor(localBrand.primary_color);
  }, [localBrand.primary_color]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile({ ...localProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalBrand({ ...localBrand, logo_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Platform Governance</h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Configure Identity and Systemic Parameters</p>
      </header>

      <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 pb-0">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${
            activeTab === 'profile' 
              ? 'text-slate-900 dark:text-white' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Profile
          {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: localBrand.primary_color }} />}
        </button>
        <button 
          onClick={() => setActiveTab('brand')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${
            activeTab === 'brand' 
              ? 'text-slate-900 dark:text-white' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Company Branding
          {activeTab === 'brand' && <div className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: localBrand.primary_color }} />}
        </button>
        <button 
          onClick={() => setActiveTab('currency')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${
            activeTab === 'currency' 
              ? 'text-slate-900 dark:text-white' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Currency Settings
          {activeTab === 'currency' && <div className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: localBrand.primary_color }} />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'profile' ? (
            <GlassCard title="Personal Identity" className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  {/* Avatar Upload Area */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block">Profile Picture</label>
                    <div className="relative group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <div className="w-32 h-32 rounded-[40px] border-2 border-dashed border-slate-300 dark:border-white/10 transition-all flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-white/5 relative shadow-xl group-hover:border-opacity-100"
                        style={{ borderColor: `${localBrand.primary_color}50` }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = `${localBrand.primary_color}80`}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = `${localBrand.primary_color}50`}
                      >
                        {localProfile.avatar ? (
                          <img src={localProfile.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Avatar Preview" />
                        ) : (
                          <span className="text-3xl grayscale group-hover:grayscale-0">👤</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] font-black text-white uppercase">Upload</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-600 font-bold uppercase tracking-tighter">Recommended: 400x400 JPG/PNG</p>
                  </div>

                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-2">Full Display Name</label>
                      <input 
                        type="text" 
                        value={localProfile.name}
                        onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none transition-all placeholder:text-slate-400"
                        placeholder="e.g. Emily Johnson" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-2">Preferred Username</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500 text-xs">@</span>
                        <input 
                          type="text" 
                          value={localProfile.username}
                          onChange={(e) => setLocalProfile({...localProfile, username: e.target.value.toLowerCase().replace(/\s+/g, '')})}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl px-10 py-3.5 text-sm text-slate-900 dark:text-white focus:border-[#8252e9] outline-none transition-all placeholder:text-slate-400"
                          placeholder="username" 
                        />
                      </div>
                      <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-2 font-bold uppercase">This is how you will be identified in team mentions and chat.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/5">
                   <button 
                    onClick={handleSaveProfile}
                    className="px-10 py-4 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    style={{ 
                      backgroundColor: localBrand.primary_color,
                      boxShadow: `0 20px 25px -5px ${localBrand.primary_color}20, 0 8px 10px -6px ${localBrand.primary_color}20`
                    }}
                   >
                     Update Profile Identity
                   </button>
                </div>
              </div>
            </GlassCard>
          ) : activeTab === 'currency' ? (
            <div className="animate-in slide-in-from-bottom-2 duration-500">
              <CurrencySettings />
            </div>
          ) : (
            <GlassCard title="Brand Identity" className="animate-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-2">Company Trading Name</label>
                      <input 
                        type="text" 
                        value={localBrand.company_name}
                        onChange={(e) => setLocalBrand({...localBrand, company_name: e.target.value})}
                        placeholder="e.g. Acme Corp" 
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 focus:border-opacity-100"
                        style={{ borderColor: 'inherit' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = localBrand.primary_color}
                        onBlur={(e) => e.currentTarget.style.borderColor = ''}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-2">Company Logo</label>
                      <div className="relative group cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        />
                        <div className="w-full bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl px-6 py-8 flex flex-col items-center justify-center transition-all group-hover:border-opacity-100"
                          style={{ borderColor: `${localBrand.primary_color}50` }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = `${localBrand.primary_color}80`}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = `${localBrand.primary_color}50`}
                        >
                          {localBrand.logo_url ? (
                            <div className="flex flex-col items-center gap-3">
                              <img src={localBrand.logo_url} className="w-16 h-16 object-contain rounded-lg" alt="Logo Preview" />
                              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Click to change logo</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                <span className="text-3xl">🖼️</span>
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Click to upload logo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-600 dark:text-slate-600 mt-2 font-bold uppercase">Recommended: 400x400 PNG with transparent background</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-[32px] gap-4">
                     <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-2">Live Logo Preview</div>
                     <div 
                      className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
                      style={{ backgroundColor: localBrand.primary_color }}
                     >
                       {localBrand.logo_url ? (
                         <img src={localBrand.logo_url} className="w-full h-full object-cover" alt="Preview" />
                       ) : (
                         <span className="text-white text-4xl font-black italic">{localBrand.company_name.charAt(0)}</span>
                       )}
                     </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-white/5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-4">Primary Brand Color</label>
                  <div className="flex items-center gap-6">
                    <input 
                      type="color" 
                      value={localBrand.primary_color}
                      onChange={(e) => setLocalBrand({...localBrand, primary_color: e.target.value})}
                      className="w-16 h-16 rounded-2xl bg-transparent border-0 p-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{localBrand.primary_color}</p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">This color will be applied to buttons, active navigation states, and systemic highlights across the entire workspace.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                   <button 
                    onClick={handleSaveBrand}
                    className="px-10 py-4 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    style={{ 
                      backgroundColor: localBrand.primary_color,
                      boxShadow: `0 20px 25px -5px ${localBrand.primary_color}20, 0 8px 10px -6px ${localBrand.primary_color}20`
                    }}
                   >
                     Apply Corporate Branding
                   </button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <GlassCard title="Live Identity Preview" className="dark:!bg-[#120e24]/50 dark:border-white/5 overflow-hidden">
            <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/5">
                  <div className="w-12 h-12 rounded-xl border-2 border-orange-500 overflow-hidden bg-orange-500/10 flex items-center justify-center">
                    {localProfile.avatar ? (
                      <img src={localProfile.avatar} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-orange-500 font-black italic">{localProfile.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{localProfile.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest">@{localProfile.username}</p>
                  </div>
               </div>

               <div className="space-y-3 opacity-40 pointer-events-none grayscale">
                  <div className="flex gap-2">
                    <div className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase text-white" style={{ backgroundColor: localBrand.primary_color }}>Active Tab</div>
                    <div className="px-4 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-white/5">Normal Tab</div>
                  </div>
                  <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: '65%', backgroundColor: localBrand.primary_color }} />
                  </div>
                  <button className="w-full py-3 rounded-xl text-white font-black text-[9px] uppercase tracking-widest shadow-lg" style={{ backgroundColor: localBrand.primary_color }}>
                    Branded Action Button
                  </button>
               </div>
            </div>
          </GlassCard>

          <GlassCard title="Privacy & Security">
             <p className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed font-bold uppercase tracking-widest mb-4">Account Metadata</p>
             <ul className="space-y-3">
                <li className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <span>Last Login</span>
                  <span className="text-slate-900 dark:text-white">Just Now</span>
                </li>
                <li className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <span>Device Linked</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Authorized</span>
                </li>
                <li className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-3 mt-3">
                  <span>Access Level</span>
                  <span className="text-[#8252e9] font-black uppercase text-[9px]">Root Admin</span>
                </li>
             </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;
