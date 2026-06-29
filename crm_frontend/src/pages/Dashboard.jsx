import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await dashboardService.getSummary();
        setData(stats);
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard metrics. Ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Loading workspace dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl">
        <h3 className="font-bold text-base">Dashboard Error</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  const { metrics, trends, campaigns, activities, review_queue } = data || {};

  // Helper to draw SVG Line Chart
  const renderTrendChart = () => {
    if (!trends || trends.length === 0) return null;
    
    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...trends.map(t => Math.max(t.total, 10)));
    
    const points = trends.map((item, index) => {
      const x = paddingLeft + (index / (trends.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (item.total / maxVal) * chartHeight;
      return { x, y, ...item };
    });

    const qualPoints = trends.map((item, index) => {
      const x = paddingLeft + (index / (trends.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (item.qualified / maxVal) * chartHeight;
      return { x, y };
    });

    const generatePathString = (pts) => {
      if (pts.length === 0) return '';
      return pts.reduce((acc, point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const prev = pts[index - 1];
        const cpX1 = prev.x + (point.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (point.x - prev.x) / 2;
        const cpY2 = point.y;
        return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
      }, '');
    };

    const linePath = generatePathString(points);
    const qualPath = generatePathString(qualPoints);
    const areaPath = linePath 
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line 
            key={ratio} 
            x1={paddingLeft} 
            y1={paddingTop + ratio * chartHeight} 
            x2={width - paddingRight} 
            y2={paddingTop + ratio * chartHeight} 
            className="stroke-slate-100 dark:stroke-slate-800" 
            strokeWidth={1}
          />
        ))}

        {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            className="stroke-indigo-600 dark:stroke-indigo-400" 
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
        {qualPath && (
          <path 
            d={qualPath} 
            fill="none" 
            className="stroke-emerald-500 dark:stroke-emerald-400" 
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}

        {points.map((pt, idx) => (
          <g key={idx} className="group">
            <circle 
              cx={pt.x} 
              cy={pt.y} 
              r={4} 
              className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 cursor-pointer" 
              strokeWidth={1.5}
            />
            <title>{`${pt.month}: ${pt.total} Leads`}</title>
          </g>
        ))}

        {points.map((pt, idx) => (
          <text 
            key={idx} 
            x={pt.x} 
            y={height - 8} 
            className="fill-slate-400 dark:fill-slate-500 text-[10px] font-semibold"
            textAnchor="middle"
          >
            {pt.month}
          </text>
        ))}

        {[0, 0.5, 1].map((ratio) => {
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <text 
              key={ratio} 
              x={paddingLeft - 10} 
              y={paddingTop + ratio * chartHeight + 4} 
              className="fill-slate-400 dark:fill-slate-500 text-[9px] font-semibold"
              textAnchor="end"
            >
              {val}
            </text>
          );
        })}
      </svg>
    );
  };

  // Render QA Auditor Dashboard
  if (user?.role === 'qa') {
    return (
      <div className="space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-blue-900/90 to-indigo-900/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-800/40 dark:border-blue-900/30 shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold text-white">QA Quality Assurance Dashboard</h3>
              <p className="mt-1 text-sm text-blue-200 dark:text-blue-300">Auditing pitch standards and confirming qualified client acquisitions.</p>
            </div>
            <span className="px-4 py-2 text-xs font-bold text-blue-200 bg-blue-800/40 rounded-xl border border-blue-700/50 capitalize self-start md:self-auto font-mono">
              QA Auditor: {user?.name}
            </span>
          </div>
        </div>

        {/* QA Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: 'Awaiting Review', value: metrics.pending_reviews, color: 'indigo', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Leads pending evaluation' },
            { label: 'Reviewed by Me Today', value: metrics.today_reviews, color: 'blue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', desc: 'Audited during this shift' },
            { label: 'Total Audits Completed', value: metrics.total_reviewed_by_me, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Lifetime review volume' },
            { label: 'Auditor Quality Score', value: `${metrics.quality_score}%`, color: 'violet', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', desc: 'Qualified ratio of audits' }
          ].map(({ label, value, color, icon, desc }) => (
            <div key={label} className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-${color}-50 dark:bg-${color}-950/40 text-${color}-600 dark:text-${color}-400`}>
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
              </div>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-4">{value}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{desc}</span>
            </div>
          ))}
        </div>

        {/* Content Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Awaiting Review Queue */}
          <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white">Active Audit Backlog</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">Oldest submissions waiting for pitch quality confirmations.</p>
              </div>
              <button 
                onClick={() => navigate('/qa-review')}
                className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 rounded-xl cursor-pointer"
              >
                Go to Review Panel &rarr;
              </button>
            </div>
            
            <div className="space-y-3">
              {!review_queue || review_queue.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-450 dark:text-slate-550 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                  Queue all clear! No pending audits.
                </div>
              ) : (
                review_queue.map((lead) => (
                  <div key={lead.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-100 transition-colors">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{lead.first_name} {lead.last_name}</h5>
                      <p className="text-xs text-slate-450 mt-0.5">{lead.company_name} • {lead.job_title} • <span className="font-mono text-[10px] text-slate-400">{lead.campaign_name}</span></p>
                    </div>
                    <button 
                      onClick={() => navigate('/qa-review')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 cursor-pointer"
                    >
                      Audit Call
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QA Verification Split Chart */}
          <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">Assigned Leads Funnel</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Status breakdown of leads mapped to you</p>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Qualified', count: metrics.approved_leads, color: 'bg-emerald-500' },
                { name: 'Pending Review', count: metrics.pending_reviews, color: 'bg-slate-400' },
                { name: 'Rework Requested', count: metrics.rework_leads, color: 'bg-amber-500' },
                { name: 'Disqualified', count: metrics.rejected_leads, color: 'bg-rose-500' }
              ].map((stage) => (
                <div key={stage.name}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-650 dark:text-slate-450 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                      {stage.name}
                    </span>
                    <span className="text-slate-800 dark:text-white">{stage.count} ({metrics.total_leads > 0 ? Math.round(stage.count / metrics.total_leads * 100) : 0}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`} 
                      style={{ width: `${metrics.total_leads > 0 ? (stage.count / metrics.total_leads * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom charts & logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend graph */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Audit Volume Trend</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Assigned monthly pipeline changes</p>
            <div className="h-[200px] w-full">{renderTrendChart()}</div>
          </div>

          {/* Activity Logs */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Recent Audit Feed</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Latest pitch assessments updated by auditors</p>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center pl-6">No recent updates.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative pl-8">
                    <span className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      act.qa_status === 'qualified' ? 'bg-emerald-500' : 
                      act.qa_status === 'disqualified' ? 'bg-rose-500' : 
                      act.qa_status === 'rework' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.first_name} {act.last_name}</p>
                        <p className="text-xs text-slate-450 dark:text-slate-500">{act.company_name} • <span className="text-[10px] text-slate-400">Auditor: {act.reviewed_by_name}</span></p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-slate-50 border border-slate-200/60 dark:bg-slate-850 dark:border-slate-800`}>
                        {act.qa_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Employee Dashboard (Sales Representative)
  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-indigo-900/90 to-violet-900/90 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-800/40 dark:border-indigo-900/30 shadow-lg">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">Sales Representative Workspace</h3>
            <p className="mt-1 text-sm text-indigo-200 dark:text-indigo-300">Submit qualified client acquisitions and review QA reports.</p>
          </div>
          <button 
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg cursor-pointer"
          >
            Submit New Lead
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: 'Total Submitted Leads', value: metrics.total_assigned, color: 'indigo', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857', desc: 'All leads registered by you' },
          { label: 'Approved by QA', value: metrics.qualified_leads, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: `${metrics.conversion_rate}% approval rate` },
          { label: 'Pending QA Audit', value: metrics.pending_leads, color: 'slate', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Awaiting quality evaluations' },
          { label: 'Active Campaigns', value: metrics.active_campaigns, color: 'violet', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15', desc: `Campaigns assigned to you` }
        ].map(({ label, value, color, icon, desc }) => (
          <div key={label} className="flex flex-col p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-${color}-50 dark:bg-${color}-950/40 text-${color}-600 dark:text-${color}-400`}>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
            </div>
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white mt-4">{value}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{desc}</span>
          </div>
        ))}
      </div>

      {/* Main Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">Leads Submission Trend</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monthly breakdown (Total leads vs Qualified leads)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span className="text-slate-600 dark:text-slate-400">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Qualified</span>
              </div>
            </div>
          </div>
          <div className="h-[200px] w-full">{renderTrendChart()}</div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">Verification Status</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Quality assurance status distribution</p>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Qualified', count: metrics.qualified_leads, color: 'bg-emerald-500' },
              { name: 'Pending Review', count: metrics.pending_leads, color: 'bg-slate-400' },
              { name: 'Rework Requested', count: metrics.rework_leads, color: 'bg-amber-500' },
              { name: 'Disqualified', count: metrics.disqualified_leads, color: 'bg-rose-500' }
            ].map((stage) => (
              <div key={stage.name}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-650 dark:text-slate-450 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.name}
                  </span>
                  <span className="text-slate-800 dark:text-white">{stage.count} ({metrics.total_assigned > 0 ? Math.round(stage.count / metrics.total_assigned * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${metrics.total_assigned > 0 ? (stage.count / metrics.total_assigned * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns and Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">Active Campaigns</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Top campaigns performance and budget</p>
          
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {!campaigns || campaigns.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No campaigns launched yet.</p>
            ) : (
              campaigns.map((camp) => (
                <div key={camp.id} className="pt-4 first:pt-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{camp.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">Budget: ${(camp.budget || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{camp.leads_count || 0} Leads</span>
                      <p className="text-[10px] text-emerald-500 font-bold">{camp.qualified_count || 0} Qualified</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${camp.status === 'active' ? 'bg-indigo-500' : 'bg-slate-400'}`}
                      style={{ width: `${camp.leads_count > 0 ? Math.min(((camp.qualified_count || 0) / camp.leads_count) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">My Lead Submission Activity</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Latest status logs of pitches submitted by you</p>

          <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center pl-6">No recent updates.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative pl-8 group">
                  <span className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 transition-all duration-300 ${
                    act.qa_status === 'qualified' ? 'bg-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 
                    act.qa_status === 'disqualified' ? 'bg-rose-500' : 
                    act.qa_status === 'rework' ? 'bg-amber-500' : 
                    'bg-slate-400'
                  }`} />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{act.first_name} {act.last_name}</p>
                      <p className="text-xs text-slate-450 dark:text-slate-550">{act.company_name} • <span className="text-[10px] text-slate-400">{act.campaign_name}</span></p>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      act.qa_status === 'qualified' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50' : 
                      act.qa_status === 'disqualified' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50' : 
                      act.qa_status === 'rework' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50' : 
                      'bg-slate-100 text-slate-650'
                    }`}>
                      {act.qa_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
