import React, { useState, useEffect } from 'react';
import GlassCard from '../GlassCard';
import { PerformanceDashboardKPIs, TeamPerformanceData } from '../../types/performance';
import performanceService from '../../services/performanceService';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface ReportingTabProps {
  onNotify?: (title: string, message: string, type: string) => void;
}

const ReportingTab: React.FC<ReportingTabProps> = ({ onNotify }) => {
  const [dashboardKPIs, setDashboardKPIs] = useState<PerformanceDashboardKPIs | null>(null);
  const [teamPerformanceData, setTeamPerformanceData] = useState<TeamPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'overview' | 'trends' | 'distribution' | 'export'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock trend data (in real app, this would come from API)
  const trendData = [
    { month: 'Jan', avgScore: 78, participation: 85, completion: 92 },
    { month: 'Feb', avgScore: 82, participation: 88, completion: 94 },
    { month: 'Mar', avgScore: 85, participation: 91, completion: 96 },
    { month: 'Apr', avgScore: 83, participation: 89, completion: 93 },
    { month: 'May', avgScore: 87, participation: 93, completion: 97 },
    { month: 'Jun', avgScore: 89, participation: 95, completion: 98 },
  ];

  const distributionData = [
    { range: '90-100%', count: 42, color: '#10b981' },
    { range: '80-89%', count: 68, color: '#3b82f6' },
    { range: '70-79%', count: 35, color: '#f59e0b' },
    { range: '60-69%', count: 18, color: '#f97316' },
    { range: '<60%', count: 7, color: '#ef4444' },
  ];

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const [kpis, teamData] = await Promise.all([
        performanceService.fetchDashboardKPIs(),
        performanceService.fetchTeamPerformance(),
      ]);
      setDashboardKPIs(kpis);
      setTeamPerformanceData(teamData);
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Mock export functionality
    if (onNotify) {
      onNotify(
        'Export Started',
        `Performance report export to ${format.toUpperCase()} has been initiated. You'll receive an email when ready.`,
        'info'
      );
    }
  };

  const COLORS = ['#8252e9', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-white/10 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-white/10 rounded w-20 animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded mb-1"></div>
              <div className="h-3 bg-white/10 rounded"></div>
            </GlassCard>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="animate-pulse">
            <div className="h-64 bg-white/10 rounded"></div>
          </GlassCard>
          <GlassCard className="animate-pulse">
            <div className="h-64 bg-white/10 rounded"></div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Performance Reporting</h3>
          <p className="text-xs text-slate-400 mt-1">Analytics and insights for performance management</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all"
          >
            <option value="7d" className="bg-[#0d0a1a]">Last 7 days</option>
            <option value="30d" className="bg-[#0d0a1a]">Last 30 days</option>
            <option value="90d" className="bg-[#0d0a1a]">Last 90 days</option>
            <option value="1y" className="bg-[#0d0a1a]">Last year</option>
          </select>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'trends', label: 'Trends', icon: '📈' },
          { key: 'distribution', label: 'Distribution', icon: '🥧' },
          { key: 'export', label: 'Export', icon: '📤' },
        ].map((report) => (
          <button
            key={report.key}
            onClick={() => setActiveReport(report.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeReport === report.key
                ? 'bg-[#8252e9] text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>{report.icon}</span>
            {report.label}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          {dashboardKPIs && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Org Health</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{dashboardKPIs.org_health_score}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Score</p>
                  </div>
                  <span className="text-xl opacity-60">💎</span>
                </div>
              </GlassCard>

              <GlassCard className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Completion</p>
                    <p className="text-2xl font-black text-blue-400 mt-1">{dashboardKPIs.completion_rate}%</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Rate</p>
                  </div>
                  <span className="text-xl opacity-60">🎯</span>
                </div>
              </GlassCard>

              <GlassCard className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Top Performers</p>
                    <p className="text-2xl font-black text-[#8252e9] mt-1">{dashboardKPIs.top_performers}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{dashboardKPIs.top_performers_percentage}% of workforce</p>
                  </div>
                  <span className="text-xl opacity-60">⭐</span>
                </div>
              </GlassCard>

              <GlassCard className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Turnover Risk</p>
                    <p className={`text-2xl font-black mt-1 ${dashboardKPIs.turnover_risk === 'LOW' ? 'text-emerald-500' :
                        dashboardKPIs.turnover_risk === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                      {dashboardKPIs.turnover_risk}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">AI Prediction</p>
                  </div>
                  <span className="text-xl opacity-60">🛡️</span>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Team Performance Chart */}
          <GlassCard title="Department Performance Comparison">
            <div className="h-80 min-h-[320px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="kpi" fill="#8252e9" radius={[4, 4, 0, 0]} name="KPI Score" />
                  <Bar dataKey="behavioral" fill="#10b981" radius={[4, 4, 0, 0]} name="Behavioral" />
                  <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Attendance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Trends Report */}
      {activeReport === 'trends' && (
        <div className="space-y-6">
          <GlassCard title="Performance Trends Over Time">
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgScore" stroke="#8252e9" strokeWidth={3} name="Avg Score" />
                  <Line type="monotone" dataKey="participation" stroke="#10b981" strokeWidth={3} name="Participation %" />
                  <Line type="monotone" dataKey="completion" stroke="#3b82f6" strokeWidth={3} name="Completion %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-black text-emerald-400">+12%</div>
              <div className="text-xs text-slate-400">Avg Score Improvement</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-black text-blue-400">+8%</div>
              <div className="text-xs text-slate-400">Participation Increase</div>
            </GlassCard>
            <GlassCard className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-2xl font-black text-purple-400">+6%</div>
              <div className="text-xs text-slate-400">Completion Rate Growth</div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Distribution Report */}
      {activeReport === 'distribution' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard title="Score Distribution">
              <div className="h-80 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard title="Performance Distribution Details">
              <div className="space-y-4 mt-4">
                {distributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-bold text-white">{item.range}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{item.count}</div>
                      <div className="text-xs text-slate-400">employees</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Export Report */}
      {activeReport === 'export' && (
        <div className="space-y-6">
          <GlassCard className="text-center py-12">
            <div className="text-6xl mb-4">📤</div>
            <h4 className="text-xl font-bold text-white mb-2">Export Performance Reports</h4>
            <p className="text-slate-400 mb-8">Generate comprehensive reports in various formats</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => handleExport('pdf')}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                <div className="text-sm font-bold text-white">PDF Report</div>
                <div className="text-xs text-slate-400 mt-1">Formatted for printing</div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                <div className="text-sm font-bold text-white">Excel Report</div>
                <div className="text-xs text-slate-400 mt-1">Data analysis ready</div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📋</div>
                <div className="text-sm font-bold text-white">CSV Export</div>
                <div className="text-xs text-slate-400 mt-1">Raw data format</div>
              </button>
            </div>
          </GlassCard>

          <GlassCard title="Export Options">
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Date Range</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#8252e9] transition-all">
                  <option value="current" className="bg-[#0d0a1a]">Current period</option>
                  <option value="last_quarter" className="bg-[#0d0a1a]">Last quarter</option>
                  <option value="last_year" className="bg-[#0d0a1a]">Last year</option>
                  <option value="custom" className="bg-[#0d0a1a]">Custom range</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Include Data</label>
                <div className="space-y-2">
                  {[
                    'Individual scores',
                    'Department summaries',
                    'Goal progress',
                    'Evaluation responses',
                    'Trend analysis'
                  ].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only" />
                      <div className="w-4 h-4 rounded border-2 border-[#8252e9] bg-[#8252e9] flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" strokeWidth="3" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ReportingTab;