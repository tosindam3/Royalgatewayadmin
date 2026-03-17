
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import { ICONS } from './constants';
import { UserRole, Notification, BrandSettings, UserProfile, mapBackendRoleToUserRole } from './types';
import { authService } from './services/authService';
import { ThemeProvider } from './contexts/ThemeContext';
import { updateBrandColor, initBrandColors } from './utils/brandColors';
import { useBrandSettings } from './hooks/useBrandSettings';

// Layout & UI Components
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileSidebar from './components/layout/MobileSidebar';
import MobileHeader from './components/layout/MobileHeader';
import PageSkeleton from './components/ui/PageSkeleton';
import AppLoadingSkeleton from './components/ui/AppLoadingSkeleton';
import AttendanceClockModal from './components/attendance/AttendanceClockModal';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Performance = lazy(() => import('./pages/Performance'));
const Identity = lazy(() => import('./pages/Identity'));
const Communication = lazy(() => import('./pages/Communication'));
const Employees = lazy(() => import('./pages/Employees/EmployeeManagementPage'));
const Branches = lazy(() => import('./pages/Branches'));
const Leave = lazy(() => import('./pages/Leave'));
const TalentManagement = lazy(() => import('./pages/TalentManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const MemoSystem = lazy(() => import('./pages/Memo'));
// const Analytics = lazy(() => import('./pages/Analytics'));
const AutomationAI = lazy(() => import('./pages/AutomationAI'));
const Integrations = lazy(() => import('./pages/Integrations'));
const EmployeeProfile = lazy(() => import('./pages/Employees/EmployeeProfile'));
const MyApprovals = lazy(() => import('./pages/Approvals/MyApprovals'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const AttendanceWorkspace = lazy(() => import('./pages/Attendance/AttendanceWorkspace'));
const MyAttendance = lazy(() => import('./pages/Attendance/MyAttendance'));
const PerformanceSettings = lazy(() => import('./pages/PerformanceSettings'));
const FormBuilder = lazy(() => import('./components/FormBuilder'));

// Direct imports (not lazy) - used outside Suspense boundary
import Login from './pages/Login';
import Landing from './pages/Landing';

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'PENDING_REVIEW', title: 'Pending Evaluation', message: 'Reminder: Ethan Parker appraisal due in 2 days.', timestamp: '10 min ago', isRead: false, priority: 'HIGH' },
  { id: '2', type: 'CYCLE_EVENT', title: 'New Cycle Initialized', message: 'Q2 Performance Cycle has been provisioned globally.', timestamp: '1h ago', isRead: false, priority: 'MEDIUM' },
  { id: '3', type: 'EVALUATION_COMPLETE', title: 'Review Finalized', message: 'Sarah Mitchell evaluation has been verified by HR.', timestamp: '3h ago', isRead: true, priority: 'LOW' },
];

const SIDEBAR_CONFIG = [
  { label: 'Dashboard', icon: <ICONS.Dashboard />, route: '/', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], permissions: ['dashboard.view', 'dashboard.management'] },
  { label: 'PEOPLE', isHeader: true, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
  { label: 'Employees', icon: <ICONS.People />, route: '/employees', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER], permissions: ['employees.view'] },
  { label: 'Role Management', icon: <ICONS.Administration />, route: '/roles', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], permissions: ['roles.view'] },
  { label: 'Branches', icon: <ICONS.Analytics />, route: '/branches', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], permissions: ['branches.view'] },
  { label: 'OPERATIONS', isHeader: true },
  { label: 'My Profile', icon: <ICONS.People />, route: '/employees/me', roles: [UserRole.EMPLOYEE] },
  { label: 'My Attendance', icon: <ICONS.Leave />, route: '/me/attendance', roles: [UserRole.EMPLOYEE] },
  { label: 'Leave', icon: <ICONS.Leave />, route: '/leave', permissions: ['leave.view'] },
  { label: 'My Approvals', icon: <ICONS.Performance />, route: '/approvals' },
  { label: 'Payroll', icon: <ICONS.Payroll />, route: '/payroll', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], permissions: ['payroll.view'] },
  { label: 'TALENT', isHeader: true },
  { label: 'Performance', icon: <ICONS.Performance />, route: '/performance', permissions: ['performance.view'] },
  { label: 'Talent Management', icon: <ICONS.Talent />, route: '/talent', permissions: ['onboarding.view'] },
  { label: 'COMMUNICATION', isHeader: true },
  { label: 'Team Chat', icon: <ICONS.Chat />, route: '/communication/chat', badge: 12, permissions: ['chat.view'] },
  { label: 'Memo', icon: <ICONS.Memo />, route: '/communication/memo' },
  { label: 'SYSTEM', isHeader: true, roles: [UserRole.SUPER_ADMIN] },
  { label: 'Brand Settings', icon: <ICONS.Administration />, route: '/settings', permissions: ['settings.view'] },
  { label: 'Automation & AI', icon: <ICONS.Automation />, route: '/automation', permissions: ['workflows.view'] },
  { label: 'Integrations', icon: <ICONS.Integrations />, route: '/integrations' },
];

const MainApp: React.FC<{
  onLogout: () => void;
  brand: BrandSettings;
  onUpdateBrand: (b: BrandSettings) => void;
  userProfile: UserProfile;
  currentUserRole: UserRole;
  onUpdateProfile: (p: UserProfile) => void;
  userPermissions: string[];
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}> = ({ onLogout, brand, onUpdateBrand, userProfile, currentUserRole, onUpdateProfile, userPermissions, theme, onToggleTheme }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [selectedBranchScope, setSelectedBranchScope] = useState('All Branches');
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  const filteredMenu = SIDEBAR_CONFIG.filter(item => {
    // 1. Check Role Match
    const roleMatch = !item.roles || item.roles.includes(currentUserRole);
    if (!roleMatch) return false;

    // 2. Check Permission Match (if specified)
    if (item.permissions && item.permissions.length > 0) {
      // User must have at least one of the required permissions for this module
      const hasPermission = item.permissions.some(p => userPermissions.includes(p));
      if (!hasPermission) return false;
    }

    return true;
  });

  // Filter out empty headers (headers with no visible items below them)
  const finalMenu = filteredMenu.filter((item, index) => {
    if (item.isHeader) {
      // Check if there's any visible item between this header and the next header
      const nextItems = filteredMenu.slice(index + 1);
      const nextHeaderIdx = nextItems.findIndex(i => i.isHeader);
      const itemsUnderHeader = nextHeaderIdx === -1 ? nextItems : nextItems.slice(0, nextHeaderIdx);
      return itemsUnderHeader.length > 0;
    }
    return true;
  });

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
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        expand={false}
        duration={4000}
        toastOptions={{
          style: {
            maxWidth: '400px',
          },
        }}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        brand={brand}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        menuItems={finalMenu}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        brand={brand}
        menuItems={finalMenu}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-x-hidden relative">
        {/* Desktop Header */}
        <Header
          userProfile={userProfile}
          userRole={currentUserRole}
          brand={brand}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          selectedBranchScope={selectedBranchScope}
          onBranchScopeChange={setSelectedBranchScope}
          onOpenClockModal={() => setIsClockModalOpen(true)}
        />

        {/* Mobile Header */}
        <MobileHeader
          brand={brand}
          userProfile={userProfile}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenClockModal={() => setIsClockModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto relative p-3 sm:p-4 md:p-10 scroll-smooth no-scrollbar text-slate-900 dark:text-white">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--brand-primary)]/5 blur-[160px] rounded-full pointer-events-none -z-10 animate-pulse" />
          <div className="max-w-[1400px] mx-auto animate-fade-in h-full flex flex-col">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={
                  <Dashboard userRole={currentUserRole} userPermissions={userPermissions} userProfile={userProfile} />
                } />

                {/* My Attendance - Available to all users */}
                <Route path="/me/attendance" element={<MyAttendance />} />

                <Route path="/employees/me" element={
                  userProfile.employee_id ? <Navigate to={`/employees/${userProfile.employee_id}`} replace /> : <Navigate to="/" replace />
                } />

                <Route path="/employees/:id" element={<EmployeeProfile />} />

                {currentUserRole !== UserRole.EMPLOYEE && (
                  <>
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/attendance" element={<AttendanceWorkspace />} />
                  </>
                )}
                {currentUserRole === UserRole.SUPER_ADMIN || currentUserRole === UserRole.ADMIN ? (
                  <>
                    <Route path="/roles" element={<RoleManagement />} />
                    <Route path="/branches" element={<Branches />} />
                    <Route path="/payroll" element={<Payroll />} />
                  </>
                ) : null}
                <Route path="/performance" element={<Performance userRole={currentUserRole} onNotify={(t, m, type) => addNotification(t, m, type)} />} />
                <Route path="/performance/settings" element={<PerformanceSettings userRole={currentUserRole} />} />
                <Route path="/performance/builder/:mode/:id" element={<FormBuilder />} />
                <Route path="/performance/builder/:mode" element={<FormBuilder />} />
                <Route path="/identity" element={<Identity />} />
                <Route path="/communication/chat" element={<Communication />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/talent" element={<TalentManagement />} />

                {currentUserRole === UserRole.SUPER_ADMIN && (
                  <>
                    <Route path="/settings" element={<Settings brand={brand} onUpdate={onUpdateBrand} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />} />
                    <Route path="/automation" element={<AutomationAI />} />
                    <Route path="/integrations" element={<Integrations />} />
                  </>
                )}
                <Route path="/approvals" element={<MyApprovals />} />
                <Route path="/communication/memo" element={
                  <ThemeProvider theme={theme} onToggleTheme={onToggleTheme}>
                    <MemoSystem />
                  </ThemeProvider>
                } />
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    username: '',
    email: '',
    avatar: '',
    employee_id: undefined
  });

  // Use brand settings hook
  const { brandSettings, updateBrandSettings } = useBrandSettings();

  // Convert brand settings to legacy format for compatibility
  const brand: BrandSettings = {
    company_name: brandSettings?.company_name || 'HR360',
    logo_url: brandSettings?.logo_url || '',
    primary_color: brandSettings?.primary_color || '#8252e9'
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Initialize and update brand color globally
  useEffect(() => {
    if (brandSettings?.primary_color) {
      updateBrandColor(brandSettings.primary_color);
    } else {
      initBrandColors('#8252e9');
    }
  }, [brandSettings?.primary_color]);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('royalgateway_auth_token');
      if (token) {
        try {
          const response = await authService.getUser();
          if (response && response.user) {
            const user = response.user;
            setUserProfile({
              name: user.display_name || user.name,
              username: user.email,
              email: user.email,
              avatar: user.employee_profile?.avatar || '',
              employee_id: user.employee_profile?.id
            });
            setCurrentUserRole(mapBackendRoleToUserRole(user.all_roles || user.roles));
            
            // Extract and normalize permissions
            if (response.permissions && Array.isArray(response.permissions)) {
              setUserPermissions(response.permissions.map((p: any) => p.name));
            } else {
              setUserPermissions([]);
            }
            
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

  const handleLoginSuccess = async (response: any) => {
    setIsAuthenticated(true);
    // authService.login now returns the full response (same shape as getUser)
    const user = response?.user ?? response;
    if (user) {
      setUserProfile({
        name: user.display_name || user.name,
        username: user.email,
        email: user.email,
        avatar: user.employee_profile?.avatar || '',
        employee_id: user.employee_profile?.id
      });
      setCurrentUserRole(mapBackendRoleToUserRole(user.all_roles || user.roles));

      // Permissions live at the top-level response, not inside user
      const perms = response?.permissions ?? user.permissions;
      if (perms && Array.isArray(perms)) {
        setUserPermissions(perms.map((p: any) => typeof p === 'string' ? p : p.name));
      } else {
        setUserPermissions([]);
      }
    }
  };

  if (isInitializing) {
    return <AppLoadingSkeleton />;
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
        onUpdateBrand={async (newBrand: BrandSettings) => {
          await updateBrandSettings({
            primary_color: newBrand.primary_color,
            company_name: newBrand.company_name,
            logo_url: newBrand.logo_url
          });
        }}
        userProfile={userProfile}
        currentUserRole={currentUserRole}
        userPermissions={userPermissions}
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
