
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BrandSettings } from '../types';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: any) => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'register';
  brand: BrandSettings;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBackToLanding, initialMode = 'login', brand }) => {
  const [view, setView] = useState<'login' | 'register'>(initialMode);
  const [regStep, setRegStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Form State
  const [companySize, setCompanySize] = useState('11-50');
  const [workDays, setWorkDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [formData, setFormData] = useState({
    legalName: '',
    tradingName: '',
    industry: 'Software & IT',
    country: '🇺🇸 United States',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    title: '',
    currency: 'USD ($)',
    fiscalStart: 'January',
    language: 'English (US)',
    timeZone: '',
    dateFormat: 'DD/MM/YYYY',
    weekStartDay: 'Monday',
    logo: null as File | null,
    logoPreview: '',
    primaryColor: brand.primary_color,
    subdomain: '',
    emailSender: ''
  });

  useEffect(() => {
    setView(initialMode);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFormData(prev => ({ ...prev, timeZone: tz }));
    } catch (e) {
      console.warn("Could not auto-detect timezone");
    }
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const user = await authService.login({ email: loginUsername, password: loginPassword });
      toast.success('Access Authorized', {
        description: 'Identity verified. Initializing secure session...'
      });
      setTimeout(() => onLogin(user), 500);
    } catch (error: any) {
      // apiClient interceptor handles the 401 toast
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoginUsername('test@example.com');
    setLoginPassword('password');
    setIsAuthenticating(true);

    try {
      const user = await authService.login({ email: 'test@example.com', password: 'password' });
      toast.success('Demo Access Granted');
      setTimeout(() => onLogin(user), 500);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleNavClick = (sectionId: string) => {
    onBackToLanding();
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleWorkDay = (day: string) => {
    setWorkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'legalName' && !prev.subdomain) {
        newState.subdomain = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      if (field === 'legalName' && !prev.emailSender) {
        newState.emailSender = `${value} HR Intelligence`;
      }
      return newState;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      updateFormData('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData('logoPreview', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const Logo = () => (
    <div
      onClick={() => handleNavClick('home')}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
        <img src="/HR360_Logo.png" className="w-full h-full object-contain" alt="HR360 Logo" />
      </div>
      <div className={`text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white`}>
        HR360<span className="text-orange-500 font-normal">.</span>
      </div>
    </div>
  );

  const AuthNav = () => (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-6 md:px-12 border-b border-slate-200 dark:border-white/5 backdrop-blur-xl bg-white/80 dark:bg-[#0d0a1a]/80">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        <Logo />
        <nav className="hidden md:flex gap-8 items-center">
          {['HOME', 'FEATURES', 'PRICING', 'CONTACT'].map((item) => (
            <button
              key={item}
              onClick={() => handleNavClick(item.toLowerCase())}
              className="text-[10px] font-black tracking-[0.2em] transition-colors uppercase text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => setView(view === 'register' ? 'login' : 'register')}
            className="px-6 py-2 border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all"
          >
            {view === 'register' ? 'LOG IN' : 'REGISTER'}
          </button>
        </nav>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0a1a] relative overflow-hidden font-['Plus_Jakarta_Sans'] flex flex-col text-slate-900 dark:text-white transition-colors duration-300">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[120%] bg-purple-50 dark:bg-purple-900/10 -rotate-12 transform origin-top-left" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-50 dark:bg-[#d630ff15] blur-[120px] rounded-full" />
      </div>

      <AuthNav />

      <main className="flex-1 flex items-center justify-center relative z-10 p-6 pt-28">
        <div className="w-full max-w-[480px] animate-in fade-in zoom-in duration-700 fill-mode-both" style={{ '--tw-scale-x': '0.95', '--tw-scale-y': '0.95' } as any}>
          <div className={`glass-morphism rounded-[40px] p-10 md:p-14 shadow-2xl bg-white/80 dark:bg-[#120e24]/80 backdrop-blur-3xl border border-slate-100 dark:border-white/5 relative overflow-hidden transition-all duration-500`}>

            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                <img src="/HR360_Logo.png" className="w-full h-full object-contain" alt="HR360 Logo" />
              </div>
              <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white italic">
                Welcome to HR360 Admin
              </h2>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic">Authorized Access Only</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/30 text-lg group-focus-within:text-[var(--brand-primary)] transition-colors">👤</span>
                <input
                  type="email"
                  placeholder="Employee Email"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-[#1c1633] border border-slate-100 dark:border-white/5 rounded-full py-4 pl-14 pr-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all shadow-inner`}
                  style={{ '--tw-ring-color': `${brand.primary_color}33` } as any}
                  required
                />
              </div>

              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/30 text-lg group-focus-within:text-[var(--brand-primary)] transition-colors">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Security Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-[#1c1633] border border-slate-100 dark:border-white/5 rounded-full py-4 pl-14 pr-14 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all shadow-inner`}
                  style={{ '--tw-ring-color': `${brand.primary_color}33` } as any}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/50 transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>


              <Button
                type="submit"
                isLoading={isAuthenticating}
                loadingText="Authenticating..."
                className="w-full mt-10 py-5 rounded-full"
                style={{ backgroundColor: brand.primary_color, boxShadow: `0 12px 32px -8px ${brand.primary_color}80` }}
              >
                AUTHORIZE ACCESS
              </Button>

              <div className="flex flex-col items-center gap-4 pt-6">
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('register')}
                    className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest italic hover:text-[#8252e9] transition-all"
                  >
                    or Provision New Workspace
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-8 py-6 text-center opacity-30">
        <p className="text-[9px] font-black text-slate-400 dark:text-white uppercase tracking-[0.4em]">© 2024 HR360 SYSTEMS INTELLIGENCE</p>
      </footer>
    </div>
  );
};

export default Login;
