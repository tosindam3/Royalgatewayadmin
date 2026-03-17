
import React from 'react';
import { BrandSettings } from '../types';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
  brand: BrandSettings;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin, brand }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 96; // Height of the fixed nav
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const Features = () => (
    <section id="features" className="relative z-10 py-32 px-6 bg-slate-50 dark:bg-black/40">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-[10px] font-black text-[#8252e9] uppercase tracking-[0.4em] mb-4">Core Capabilities</p>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Next-Gen HR Governance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'AI-Driven Strategy', desc: 'Predictive talent modeling and retention analysis powered by Gemini 3.', icon: '✨' },
            { title: 'Geofenced Attendance', desc: 'Precise hardware and mobile-bound clocking with GPS verification.', icon: '📍' },
            { title: 'Global Payroll', desc: 'Multi-tenant compensation management with regional compliance filters.', icon: '🏦' },
            { title: 'Identity Nexus', desc: 'Centralized RBAC with automated security audit trailing and risk scoring.', icon: '🛡️' },
            { title: 'OKR Alignment', desc: 'Strategic goal cascading from executive levels to individual nodes.', icon: '🎯' },
            { title: 'Employee Experience', desc: 'Full self-service suite for leaves, claims, and performance reviews.', icon: '📱' },
          ].map((feature, i) => (
            <div key={i} className="glass-morphism p-10 rounded-[32px] border border-slate-200 dark:border-white/5 hover:border-[#8252e9]/20 transition-all group shadow-sm bg-white">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{feature.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const Pricing = () => (
    <section id="pricing" className="relative z-10 py-32 px-6 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-[10px] font-black text-[#8252e9] uppercase tracking-[0.4em] mb-4">Scalable Infrastructure</p>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Subscription Plans</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Startup', price: '$99', features: ['Up to 50 employees', 'Core Attendance', 'Basic Performance', 'Standard Support'] },
            { name: 'Enterprise', price: '$499', features: ['Unlimited employees', 'AI Strategic Engine', 'Geofencing Suite', 'Multi-tenant Payroll'], highlight: true },
            { name: 'Global Nexus', price: 'Custom', features: ['Global Compliance Hub', 'Custom Integrations', 'Dedicated Architect', 'White-labeling'] },
          ].map((tier, i) => (
            <div key={i} className={`p-10 rounded-[40px] border relative overflow-hidden flex flex-col ${tier.highlight ? 'bg-slate-50 dark:bg-gradient-to-br dark:from-[#8252e9]/20 dark:to-purple-900/10 border-[#8252e9]/30 shadow-xl shadow-purple-500/5' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm'}`}>
              {tier.highlight && <div className="absolute top-6 right-6 px-3 py-1 bg-[#8252e9] text-white text-[8px] font-black uppercase rounded-full">Recommended</div>}
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{tier.price}</span>
                {tier.price !== 'Custom' && <span className="text-slate-500 font-bold uppercase text-xs">/mo</span>}
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    <span className="text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tier.highlight ? 'bg-[#8252e9] text-white shadow-xl hover:scale-[1.02]' : 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white hover:bg-slate-200'}`}
              >
                Provision Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const Contact = () => (
    <section id="contact" className="relative z-10 py-32 px-6 bg-slate-50 dark:bg-black/40">
      <div className="max-w-4xl mx-auto glass-morphism p-12 md:p-20 rounded-[48px] border border-slate-200 dark:border-white/5 text-center bg-white shadow-xl">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-6">Connect with our Team</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-12">Ready to deploy HR360 for your global workforce? Schedule a strategy session with our team.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="email"
            placeholder="Enter corporate email"
            className="px-8 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-[#8252e9] flex-1 max-w-sm shadow-inner"
          />
          <button className="px-10 py-4 gradient-bg text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
            Request Demo
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0a1a] text-slate-900 dark:text-white selection:bg-purple-500/30 overflow-x-hidden transition-colors duration-300">
      {/* Global Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[100%] bg-purple-100 dark:bg-purple-900/[0.08] -rotate-12 transform blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-50 dark:bg-fuchsia-500/[0.03] blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[80%] bg-indigo-50 dark:bg-indigo-900/[0.08] rotate-12 transform blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 md:h-24 flex items-center px-4 sm:px-8 md:px-16 glass border-b border-slate-200 dark:border-white/5 bg-white/70 backdrop-blur-3xl shadow-sm animate-in slide-in-from-top duration-700 fill-mode-both">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 cursor-pointer group animate-in fade-in zoom-in duration-500 delay-300 fill-mode-both"
          >
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
              <img src="/HR360_Logo.png" className="w-full h-full object-contain" alt="HR360 Logo" />
            </div>
            <div className="text-xl md:text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
              HR360<span className="text-orange-500 font-normal group-hover:text-orange-400 transition-colors">.</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 animate-in fade-in slide-in-from-top-4 duration-700 delay-500 fill-mode-both">
            {['HOME', 'FEATURES', 'PRICING', 'CONTACT'].map((item, index) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-[10px] font-black text-slate-400 hover:text-slate-900 dark:text-white/50 dark:hover:text-white uppercase tracking-[0.2em] transition-all animate-in fade-in duration-500 fill-mode-both"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-700 fill-mode-both">
            <button
              onClick={onLogin}
              className="text-[10px] font-black text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white uppercase tracking-[0.2em] transition-all"
            >
              LOGIN
            </button>
            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all shadow-purple-500/20"
              style={{ backgroundColor: brand.primary_color }}
            >
              GET STARTED
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 pt-24 md:pt-48 pb-16 md:pb-32 px-4 md:px-6 overflow-hidden min-h-screen flex flex-col items-center justify-center">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/HR360_bg.jpg"
            alt="HR360 Background"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white dark:from-[#0d0a1a]/50 dark:via-[#0d0a1a]/30 dark:to-[#0d0a1a]" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/60 italic">Human Resources Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400 fill-mode-both">
            <span className="block text-slate-900 dark:text-white mb-2">HUMAN CAPITAL</span>
            <span className="gradient-text-live italic">REIMAGINED.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-500 dark:text-slate-400 text-base md:text-lg lg:text-xl font-medium leading-relaxed mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600 fill-mode-both">
            Empower your workforce with HR360's most advanced HR operating system. Provision identities, automate compliance, and unlock predictive intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-800 fill-mode-both">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-5 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-98 transition-all shadow-purple-500/30"
              style={{ backgroundColor: brand.primary_color }}
            >
              Start Company Onboarding
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              Explore Solutions
            </button>
          </div>
        </div>
      </section>

      <Features />
      <Pricing />
      <Contact />

      {/* Footer */}
      <footer className="relative z-10 pt-32 pb-20 px-6 bg-slate-50 dark:bg-black/20">
        <div className="max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                  <img src="/HR360_Logo.png" className="w-full h-full object-contain" alt="HR360 Logo" />
                </div>
                <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                  HR360<span className="text-orange-500 font-normal">.</span>
                </div>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed text-sm mb-8 font-medium">
                The enterprise management suite for companies that demand data integrity and strategic excellence. Part of the HR360 Intelligence Network.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Ecosystem</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Platform</button></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</button></li>
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">Integrations</button></li>
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Intelligence</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">AI Architect</button></li>
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">Data Privacy</button></li>
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">API Docs</button></li>
                <li><button className="hover:text-slate-900 dark:hover:text-white transition-colors">Network Status</button></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-200 dark:border-white/5">
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-[0.3em]">© 2024 HR360 SYSTEMS INTELLIGENCE • ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
