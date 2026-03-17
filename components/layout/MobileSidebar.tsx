import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandSettings } from '../../types';
import { ICONS } from '../../constants';

interface MobileSidebarProps {
  brand: BrandSettings;
  menuItems: any[];
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  brand, 
  menuItems, 
  isOpen, 
  onClose 
}) => {
  const location = useLocation();

  const handleItemClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-80 max-w-[85vw]
        bg-white dark:bg-[#0d0a1a] 
        border-r border-slate-200 dark:border-white/5
        transform transition-transform duration-300 ease-in-out z-50
        md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            {brand.logo_url ? (
              <img 
                src={brand.logo_url} 
                className="w-10 h-10 rounded-xl object-cover shadow-lg" 
                alt="Logo" 
              />
            ) : (
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-2xl shadow-orange-500/40">
                <span className="font-black text-xl text-white italic">
                  {(brand.company_name || 'H').charAt(0)}
                </span>
              </div>
            )}
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
              {brand.company_name || 'HR360'}
            </h1>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item, idx) => {
            if (item.isHeader) {
              return (
                <p key={idx} className="px-6 mt-6 mb-3 text-xs font-extrabold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                  {item.label}
                </p>
              );
            }

            const isActive = location.pathname === item.route;

            return (
              <Link
                key={idx}
                to={item.route || '#'}
                onClick={handleItemClick}
                className={`
                  flex items-center gap-4 px-6 py-4 transition-all duration-200
                  ${isActive 
                    ? 'bg-brand-primary-10 text-brand-primary border-r-4 border-brand-primary' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-brand-primary' : ''}`}>
                  {item.icon}
                </div>
                <span className="font-semibold text-sm flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-brand-primary text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default MobileSidebar;