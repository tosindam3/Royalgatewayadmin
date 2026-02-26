
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { HashRouter, Link } from 'react-router-dom';
import { Routes, Route, useLocation, Navigate } from 'react-router';
import { Toaster, toast } from 'sonner';
import { ICONS } from './constants';
import { UserRole, Notification, BrandSettings, UserProfile, Branch, mapBackendRoleToUserRole } from './types';
import { authService } from './services/authService';

// Layout & UI Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import NotificationCenter from './components/layout/NotificationCenter';
import ThemeToggle from './components/layout/ThemeToggle';
import PageSkeleton from './components/ui/PageSkeleton';
import AttendanceClockModal from './components/attendance/AttendanceClockModal';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Performance = lazy(() => import('./pages/Performance'));
const Identity = lazy(() => import('./pages/Identity'));
const Communication = lazy(() => import('./pages/Communication'));
const Employees = lazy(() => import('./pages/Employees/EmployeeManagementPage'));
const Branches = lazy(() => import('./pages/Branches'));
const Departments = lazy(() => import('./pages/Departments'));
const Designations = lazy(() => import('./pages/Designations'));
const Leave = lazy(() => import('./pages/Leave'));
const Goals = lazy(() => import('./pages/Goals'));
const TalentManagement = lazy(() => import('./pages/TalentManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const MemoSystem = lazy(() => import('./pages/Memo'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AutomationAI = lazy(() => import('./pages/AutomationAI'));
const Integrations = lazy(() => import('./pages/Integrations'));
const EmployeeProfile = lazy(() => import('./pages/Employees/EmployeeProfile'));
const MyApprovals = lazy(() => import('./pages/Approvals/MyApprovals'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const AttendanceWorkspace = lazy(() => import('./pages/Attendance/AttendanceWorkspace'));
const MyAttendance = lazy(() => import('./pages/Attendance/MyAttendance'));
const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'PENDING_REVIEW', title: 'Pending Evaluation', message: 'Reminder: Ethan Parker appraisal due in 2 days.', timestamp: '10 min ago', isRead: false, priority: 'HIGH' },
  { id: '2', type: 'CYCLE_EVENT', title: 'New Cycle Initialized', message: 'Q2 Performance Cycle has been provisioned globally.', timestamp: '1h ago', isRead: false, priority: 'MEDIUM' },
  { id: '3', type: 'EVALUATION_COMPLETE', title: 'Review Finalized', message: 'Sarah Mitchell evaluation has been verified by HR.', timestamp: '3h ago', isRead: true, priority: 'LOW' },
];

const SIDEBAR_CONFIG = [
  { label: 'Dashboard', icon: <ICONS.Dashboard />, route: '/', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
  { label: 'PEOPLE', isHeader: true, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
  { label: 'Employees', icon: <ICONS.People />, route: '/employees', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
  { label: 'Role Management', icon: <ICONS.Administration />, route: '/roles', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Branches', icon: <ICONS.Analytics />, route: '/branches', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Departments', icon: <ICONS.Goals />, route: '/departments', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'Designations', icon: <ICONS.TalentManagement />, route: '/designations', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'OPERATIONS', isHeader: true },
  { label: 'Attendance', icon: <ICONS.Attendance />, route: '/attendance', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] },
  { label: 'Leave', icon: <ICONS.Leave />, route: '/leave' },
  { label: 'My Approvals', icon: <ICONS.Performance />, route: '/approvals' },
  { label: 'Payroll', icon: <ICONS.Payroll />, route: '/payroll', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  { label: 'TALENT', isHeader: true },
  { label: 'Performance', icon: <ICONS.Performance />, route: '/performance' },
  { label: 'Goals & OKRs', icon: <ICONS.Automation />, route: '/goals' },
  { label: 'Talent Management', icon: <ICONS.Talent />, route: '/talent' },
  { label: 'COMMUNICATION', isHeader: true },
  { label: 'Team Chat', icon: <ICONS.Chat />, route: '/communication/chat', badge: 12 },
  { label: 'Memo', icon: <ICONS.Memo />, route: '/communication/memo' },
  { label: 'SYSTEM', isHeader: true, roles: [UserRole.SUPER_ADMIN] },
  { label: 'Brand Settings', icon: <ICONS.Administration />, route: '/settings' },
  { label: 'Analytics', icon: <ICONS.Analytics />, route: '/analytics' },
  { label: 'Automation & AI', icon: <ICONS.Automation />, route: '/automation' },
  { label: 'Integrations', icon: <ICONS.Integrations />, route: '/integrations' },
];

const MainApp: React.FC<{
  onLogout: () => void;
  brand: BrandSettings;
  onUpdateBrand: (b: BrandSettings) => void;
  userProfile: UserProfile;
  currentUserRole: UserRole;
  onUpdateProfile: (p: UserProfile) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}> = ({ onLogout, brand, onUpdateBrand, userProfile, currentUserRole, onUpdateProfile, theme, onToggleTheme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [selectedBranchScope, setSelectedBranchScope] = useState('All Branches');
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  const filteredMenu = SIDEBAR_CONFIG.filter(item => !item.roles || item.roles.includes(currentUserRole));

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const addNotification = (title: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: 'Just now',
      isRead: false,
      priority: 'MEDIUM'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0d0a1a] selection:bg-purple-500/30">
      <Toaster position="top-right" richColors closeButton />

      <Sidebar
        brand={brand}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        menuItems={filteredMenu}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header
          userProfile={userProfile}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          selectedBranchScope={selectedBranchScope}
          onBranchScopeChange={setSelectedBranchScope}
          onOpenClockModal={() => setIsClockModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto relative p-4 md:p-10 scroll-smooth no-scrollbar text-slate-900 dark:text-white">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--brand-primary)]/5 blur-[160px] rounded-full pointer-events-none -z-10 animate-pulse" />
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {currentUserRole !== UserRole.EMPLOYEE && (
                  <>
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/employees/:id" element={<EmployeeProfile />} />
                  </>
                )}
                {currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN ? (
                  <>
                    <Route path="/roles" element={<RoleManagement />} />
                    <Route path="/branches" element={<Branches />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/designations" element={<Designations />} />
                    <Route path="/me/attendance" element={<MyAttendance />} />
                    <Route path="/payroll" element={<Payroll />} />
                  </>
                ) : null}
                <Route path="/performance" element={<Performance onNotify={(t, m, type) => addNotification(t, m, type)} />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/identity" element={<Identity />} />
                <Route path="/communication/chat" element={<Communication />} />
                <Route path="/attendance" element={<AttendanceWorkspace />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/talent" element={<TalentManagement />} />

                {currentUserRole === UserRole.SUPER_ADMIN && (
                  <>
                    <Route path="/settings" element={<Settings brand={brand} onUpdate={onUpdateBrand} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/automation" element={<AutomationAI />} />
                    <Route path="/integrations" element={<Integrations />} />
                  </>
                )}
                <Route path="/approvals" element={<MyApprovals />} />
                <Route path="/communication/memo" element={<MemoSystem />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      <AttendanceClockModal
        isOpen={isClockModalOpen}
        onClose={() => setIsClockModalOpen(false)}
      />
    </div>
  );
};

// Fixed: Added the App component with default export to fix the "no default export" error in App.tsx
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [brand, setBrand] = useState<BrandSettings>({
    companyName: 'HR360',
    logoUrl: '',
    primaryColor: '#4c49d8'
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    username: '',
    avatar: ''
  });

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('royalgateway_auth_token');
      if (token) {
        try {
          const response = await authService.getUser();
          if (response && response.user) {
            const user = response.user;
            setUserProfile({
              name: user.name,
              username: user.email,
              avatar: user.employee_profile?.avatar || ''
            });
            setCurrentUserRole(mapBackendRoleToUserRole(user.roles));
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('royalgateway_auth_token');
          }
        } catch (error) {
          localStorage.removeItem('royalgateway_auth_token');
        }
      }
      setIsInitializing(false);
    };
    initSession();
  }, []);

  const handleLoginSuccess = async (user: any) => {
    setIsAuthenticated(true);
    if (user) {
      setUserProfile({
        name: user.name,
        username: user.email,
        avatar: user.employee_profile?.avatar || ''
      });
      setCurrentUserRole(mapBackendRoleToUserRole(user.roles));
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0d0a1a]">
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <Login
          brand={brand}
          onLogin={(user) => handleLoginSuccess(user)}
          onBackToLanding={() => setShowLogin(false)}
        />
      );
    }
    return (
      <Landing
        brand={brand}
        onLogin={() => setShowLogin(true)}
        onGetStarted={() => setShowLogin(true)}
      />
    );
  }

  return (
    <HashRouter>
      <MainApp
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        brand={brand}
        onUpdateBrand={setBrand}
        userProfile={userProfile}
        currentUserRole={currentUserRole}
        onUpdateProfile={setUserProfile}
        onLogout={() => {
          setIsAuthenticated(false);
          authService.logout();
        }}
      />
    </HashRouter>
  );
};

export default App;
