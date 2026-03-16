import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import StaffPortal from '../components/performance/staff/StaffPortal';
import { BranchAnalytics } from '../components/performance/analytics/BranchAnalytics';
import { PersonalAnalytics } from '../components/performance/analytics/PersonalAnalytics';
import performanceService from '../services/performanceService';
import Skeleton from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, LayoutDashboard, Users, BarChart3, Search, Filter, Download } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { UserRole } from '../types';

interface PerformanceProps {
  onNotify?: (title: string, message: string, type: any) => void;
  userRole?: UserRole;
}

const Performance: React.FC<PerformanceProps> = ({ onNotify, userRole: initialUserRole }) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole | string>(initialUserRole || '');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'analytics' | 'branch'>('overview');
  const [loadedPeriods, setLoadedPeriods] = useState<Record<string, string>>({});

  // Data states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [departmentSummaries, setDepartmentSummaries] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [branchAnalytics, setBranchAnalytics] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    filterType: 'period' | 'quarter' | 'year' | 'custom_date';
    period?: string;
    quarter?: string;
    year?: string;
    start_date?: string;
    end_date?: string;
  }>({ filterType: 'period', period: 'this_month' });

  const [availablePeriods, setAvailablePeriods] = useState<{ periods: string[], years: string[] }>({ periods: [], years: [] });
  const [roleResolved, setRoleResolved] = useState(!!initialUserRole);

  useEffect(() => {
    performanceService.getAvailablePeriods().then(setAvailablePeriods);
  }, []);

  useEffect(() => {
    if (!initialUserRole) {
      const user = JSON.parse(localStorage.getItem('royalgateway_user') || '{}');
      const roles = user.roles || [];

      if (Array.isArray(roles) && typeof roles[0] === 'object') {
        const roleNames = roles.map((r: any) => r.name.toLowerCase().replace(/\s+/g, '_'));
        if (roleNames.includes('super_admin')) setUserRole(UserRole.SUPER_ADMIN);
        else if (roleNames.includes('admin') || roleNames.includes('hr_admin')) setUserRole(UserRole.ADMIN);
        else if (roleNames.includes('manager')) setUserRole(UserRole.MANAGER);
        else setUserRole(UserRole.EMPLOYEE);
      } else {
        setUserRole(UserRole.EMPLOYEE);
      }
    } else {
      setUserRole(initialUserRole);
    }
    setRoleResolved(true);
  }, [initialUserRole]);

  // Helper to get backend expected period format
  const getPeriodFormat = (p: string) => {
    if (p === 'This Month') {
      // Return current week for testing/demo purposes, as the seeder uses weeks
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      return `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    }
    return p;
  };

  const loadData = async () => {
    if (!localStorage.getItem('royalgateway_auth_token')) return;

    const filterHash = JSON.stringify(filters);
    if (loadedPeriods[activeTab] === filterHash) {
      return; // already loaded — no re-fetch, no loading flash
    }

    const apiFilters: any = {};
    if (filters.filterType === 'period' && filters.period) {
      apiFilters.period = filters.period === 'this_month' ? getPeriodFormat('This Month') : filters.period;
    } else if (filters.filterType === 'year' && filters.year) {
      apiFilters.year = filters.year;
    } else if (filters.filterType === 'quarter' && filters.quarter && filters.year) {
      apiFilters.quarter = filters.quarter;
      apiFilters.year = filters.year;
    } else if (filters.filterType === 'custom_date' && filters.start_date && filters.end_date) {
      apiFilters.start_date = filters.start_date;
      apiFilters.end_date = filters.end_date;
    }

    try {
      setIsLoading(true);
      if (activeTab === 'overview') {
        const promises: Promise<any>[] = [
          performanceService.getLeaderboard(10, apiFilters)
        ];
        // Only fetch department summaries if user has sufficient scope
        if (userRole !== UserRole.EMPLOYEE) {
          promises.push(performanceService.getDepartmentSummaries(apiFilters));
        }
        const [leaderboardData, summariesData] = await Promise.all(promises);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
        setDepartmentSummaries(Array.isArray(summariesData) ? summariesData : []);
      } else if (activeTab === 'staff') {
        const staffData = await performanceService.getSubmissions(apiFilters);
        const list = Array.isArray(staffData) ? staffData : (staffData?.data || []);

        // Map backend relation data to frontend table expectations
        const formattedList = list.map((sub: any) => ({
          ...sub,
          name: sub.employee?.full_name || sub.employee?.first_name + ' ' + sub.employee?.last_name || 'Unknown',
          employee_code: sub.employee?.employee_code || sub.employee_id,
          department: sub.department?.name || 'Unknown',
          submissions: 1 // Basic count for this period
        }));

        // Sort by score and assign ranks/medals
        formattedList.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
        formattedList.forEach((sub: any, i: number) => {
          sub.rank = i + 1;
          if (i === 0) sub.medal = 'gold';
          else if (i === 1) sub.medal = 'silver';
          else if (i === 2) sub.medal = 'bronze';
        });

        setSubmissions(formattedList);
      } else if (activeTab === 'analytics') {
        if (userRole === UserRole.EMPLOYEE) {
          const personalData = await performanceService.getPersonalAnalytics();
          setAnalytics(personalData);
        } else {
          const analyticsData = await performanceService.getAnalytics(apiFilters);
          setAnalytics(analyticsData);
        }
      } else if (activeTab === 'branch') {
        const branchData = await performanceService.getBranchAnalytics(apiFilters);
        setBranchAnalytics(branchData);
      }

      setLoadedPeriods(prev => ({ ...prev, [activeTab]: filterHash }));
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to load performance data:', error);
        if (onNotify) onNotify('Error', 'Failed to load performance data', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (roleResolved) {
      // Employees only have the 'staff' and 'analytics' tabs — skip overview/branch fetches
      if (userRole === UserRole.EMPLOYEE && (activeTab === 'overview' || activeTab === 'branch')) {
        setIsLoading(false);
        return;
      }
      loadData();
    }
  }, [activeTab, filters, roleResolved]);

  // Show spinner while role loads
  if (!roleResolved) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Employee view — with tabs for Evaluation and Analytics
  if (userRole === UserRole.EMPLOYEE) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              Performance HQ
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-bold tracking-widest text-[10px] uppercase ml-14">Personal Strategy & Growth Track</p>
          </div>
        </div>

        <GlassCard className="p-1 max-w-fit">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'staff' || activeTab === 'overview' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Evaluation Desk
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
              Intelligence Hub
            </button>
          </nav>
        </GlassCard>

        <div className={activeTab === 'staff' || activeTab === 'overview' ? 'block' : 'hidden'}>
          <StaffPortal onNotify={onNotify} />
        </div>

        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          <PersonalAnalytics data={analytics} />
        </div>
      </div>
    );
  }

  // Column definitions for Staff Performance table
  const staffColumns = [
    {
      key: 'rank',
      header: 'Rank',
      render: (item: any) => (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${item.medal === 'gold' ? 'bg-yellow-500/20 text-yellow-500' :
          item.medal === 'silver' ? 'bg-slate-300/20 text-slate-400' :
            item.medal === 'bronze' ? 'bg-orange-900/20 text-orange-700' :
              'bg-slate-500/10 text-slate-500'
          }`}>
          {item.rank}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Staff Member',
      render: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.employee_code}</span>
        </div>
      )
    },
    { key: 'department', header: 'Department' },
    {
      key: 'score',
      header: 'Avg Score',
      render: (item: any) => (
        <span className="font-black text-purple-500">{item.score}%</span>
      ),
      align: 'right' as const
    },
    {
      key: 'submissions',
      header: 'Submissions',
      render: (item: any) => (
        <Badge variant="secondary">{item.submissions} cycles</Badge>
      ),
      align: 'center' as const
    },
    {
      key: 'actions',
      header: 'Operations',
      render: (item: any) => (
        <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
          Intelligence
        </button>
      ),
      align: 'right' as const
    }
  ];

  // Manager/Admin view - show dashboard
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-purple-500" />
            Performance Intel
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 ml-11">
            Global Strategy & Team Evaluation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <select
              className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
              value={filters.filterType}
              onChange={(e: any) => setFilters({ filterType: e.target.value, period: '', quarter: '', year: '', start_date: '', end_date: '' })}
            >
              <option value="period">By Period</option>
              <option value="quarter">By Quarter</option>
              <option value="year">By Year</option>
              <option value="custom_date">Custom Date</option>
            </select>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>

            {filters.filterType === 'period' && (
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                value={filters.period || ''}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              >
                <option value="">Select Period...</option>
                <option value="this_month">This Month</option>
                {availablePeriods.periods?.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            )}

            {filters.filterType === 'quarter' && (
              <div className="flex gap-2">
                <select
                  className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                  value={filters.quarter || ''}
                  onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
                >
                  <option value="">Select Qtr...</option>
                  <option value="Q1">Q1 (Jan-Mar)</option>
                  <option value="Q2">Q2 (Apr-Jun)</option>
                  <option value="Q3">Q3 (Jul-Sep)</option>
                  <option value="Q4">Q4 (Oct-Dec)</option>
                </select>
                <select
                  className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                  value={filters.year || ''}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                >
                  <option value="">Select Year...</option>
                  {availablePeriods.years?.map((y: string) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {filters.filterType === 'year' && (
              <select
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer"
                value={filters.year || ''}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              >
                <option value="">Select Year...</option>
                {availablePeriods.years?.map((y: string) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filters.filterType === 'custom_date' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 w-[110px]"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 w-[110px]"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                />
              </div>
            )}
          </div>

          {(userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) && (
            <button
              onClick={() => navigate('/performance/settings')}
              className="px-4 py-3 bg-white/5 hover:bg-purple-500 text-slate-400 hover:text-white rounded-xl transition-all group border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-purple-500/20"
              title="Performance Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'staff', label: 'Staff Performance', icon: Users },
          { id: 'analytics', label: 'Advanced Analytics', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === tab.id
              ? 'border-purple-500 text-purple-500'
              : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Leaderboard */}
            <GlassCard title="Elite Performers">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="circle" width={40} height={40} />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="60%" height={12} />
                        <Skeleton variant="text" width="40%" height={10} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <span className="text-4xl">🏆</span>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">Zero Data Points Found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((item) => (
                    <div
                      key={item.employee_id}
                      className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
                    >
                      <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-xl font-black shadow-lg ${item.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                        item.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                          item.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-red-600 text-white' :
                            'bg-white/5 text-slate-500'
                        }`}>
                        {item.rank}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest">{item.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-purple-500">{item.score}%</p>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.submissions} cycles</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Department Summaries */}
            <GlassCard title="Department Synthesis">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton variant="text" width="40%" height={12} />
                      <Skeleton variant="rectangle" width="100%" height={10} />
                    </div>
                  ))}
                </div>
              ) : departmentSummaries.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                  <span className="text-4xl">📊</span>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">Strategic Mapping Empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {departmentSummaries.map((dept, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{dept.department}</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Top Performer: <span className="text-purple-500 uppercase">{dept.top_performer}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 dark:text-white italic">{dept.average_score}%</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{dept.staff_count} Active Staff</p>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          style={{ width: `${dept.average_score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="SEARCH PERSONNEL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-purple-500/50 transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button
                  onClick={() => performanceService.exportSubmissions({ period })}
                  className="flex items-center gap-2 px-6 py-4 bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" /> Export intelligence
                </button>
              </div>
            </div>

            <DataTable
              data={submissions.filter(s =>
                (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.department || '').toLowerCase().includes(searchQuery.toLowerCase())
              )}
              columns={staffColumns}
              isLoading={isLoading}
              emptyMessage="No personnel data available for this cycle"
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <GlassCard title="Growth Trajectory">
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics?.trajectory || []}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8252e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8252e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                      />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="score" stroke="#8252e9" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-6">
                <GlassCard title="Competency Matrix">
                  <div className="h-[250px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analytics?.competency_matrix?.map((b: any) => ({
                        subject: b.subject,
                        A: b.score,
                        fullMark: 100,
                      })) || [
                          { subject: 'Technical', A: 90, fullMark: 150 },
                          { subject: 'Velocity', A: 85, fullMark: 150 },
                          { subject: 'Reliability', A: 95, fullMark: 150 },
                          { subject: 'Innovation', A: 80, fullMark: 150 },
                          { subject: 'Collaboration', A: 88, fullMark: 150 },
                          { subject: 'Strategy', A: 75, fullMark: 150 },
                        ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                        <Radar
                          name="Team Competency"
                          dataKey="A"
                          stroke="#8252e9"
                          fill="#8252e9"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
                <GlassCard title="AI Strategic Insights">
                  <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 h-full">
                    <p className="text-[10px] font-black text-purple-500 uppercase mb-2">Neural Optimization Suggestion:</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Based on recent department synthesis, the Engineering team shows a 15% increase in technical synthesis but a 5% drop in cross-functional velocity.
                    </p>
                    <button className="mt-4 w-full py-3 bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 hover:bg-purple-600 transition-all">
                      Optimize Protocol
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <GlassCard title="Score Distribution">
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.distribution || [
                      { category: '90-100', count: 0 },
                      { category: '80-89', count: 0 },
                      { category: '70-79', count: 0 },
                      { category: '60-69', count: 0 },
                      { category: '<60', count: 0 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900 }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {(analytics?.distribution || [0, 0, 0, 0, 0]).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#8252e9' : '#475569'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] text-white shadow-2xl shadow-purple-500/20">
                <h4 className="text-xl font-black uppercase italic mb-1 tracking-tighter">Strategic Efficiency</h4>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-6">Aggregate Platform Rating</p>

                <div className="text-6xl font-black mb-2 italic">A+</div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-1 flex-1 bg-white/20 rounded-full">
                    <div className="h-full w-[94%] bg-white rounded-full shadow-[0_0_15px_white]" />
                  </div>
                  <span className="text-xs font-black">94%</span>
                </div>

                <p className="text-[10px] font-bold text-white/80 leading-loose uppercase tracking-widest">
                  Currently performing above the 5th percentile of global industry benchmarks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Performance;
