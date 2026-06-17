import { useState, useMemo } from 'react';
import {
  FileSearch,
  Search,
  BarChart3,
  TrendingDown,
  Timer,
  Clock,
  Users,
  Send,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  X,
  AlertTriangle,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import { useAppStore } from '@/stores/useAppStore';
import { getLevelInfo, formatDuration, formatDateTime, getElapsedMinutes } from '@/utils/format';
import { getDeptName, getRecipientName, getRecipient } from '@/mock/data';
import { LevelBadge, StatusBadge, CriticalDetailModal } from '@/components/common/CriticalCard';
import type { CriticalValue, CriticalLevel, CriticalStatus } from '@/types';
import clsx from 'clsx';

export default function ProcessingRecordsPage() {
  const store = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<CriticalLevel | 'ALL'>('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('stats');
  const [resendCv, setResendCv] = useState<CriticalValue | null>(null);

  const records = useMemo(() => {
    return store.criticalValues
      .filter(c => c.status === 'COMPLETED' || c.status === 'MISREPORT' || c.status === 'ACKNOWLEDGED')
      .filter(c => {
        if (deptFilter && c.departmentId !== deptFilter) return false;
        if (levelFilter !== 'ALL' && c.level !== levelFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          return (
            c.patientName.toLowerCase().includes(s) ||
            c.testItem.toLowerCase().includes(s) ||
            c.patientId.toLowerCase().includes(s) ||
            c.handlerNote?.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [store.criticalValues, deptFilter, levelFilter, search]);

  const statsByItem = useMemo(() => {
    const map = new Map<string, { total: number; respTotal: number; overdue: number }>();
    store.criticalValues.filter(c => c.status === 'COMPLETED' || c.status === 'ACKNOWLEDGED').forEach(c => {
      const resp = c.acknowledgedAt ? getElapsedMinutes(c.acknowledgedAt) - getElapsedMinutes(c.reportedAt) : 0;
      const respMin = c.acknowledgedAt ? (new Date(c.acknowledgedAt).getTime() - new Date(c.reportedAt).getTime()) / 60000 : 0;
      const rule = c.level === 'RED' ? 5 : c.level === 'ORANGE' ? 10 : 15;
      const prev = map.get(c.testItem) || { total: 0, respTotal: 0, overdue: 0 };
      map.set(c.testItem, {
        total: prev.total + 1,
        respTotal: prev.respTotal + Math.max(0, respMin),
        overdue: prev.overdue + (respMin > rule ? 1 : 0),
      });
    });
    return Array.from(map.entries()).map(([item, v]) => ({
      item,
      count: v.total,
      avgMinutes: v.total > 0 ? Math.round(v.respTotal / v.total) : 0,
      overdueRate: v.total > 0 ? Math.round((v.overdue / v.total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [store.criticalValues]);

  const statsByDept = useMemo(() => {
    const map = new Map<string, { total: number; overdue: number }>();
    store.criticalValues.filter(c => c.status === 'COMPLETED' || c.status === 'ACKNOWLEDGED' || c.status === 'ESCALATED').forEach(c => {
      const respMin = c.acknowledgedAt ? (new Date(c.acknowledgedAt).getTime() - new Date(c.reportedAt).getTime()) / 60000 : c.status === 'ESCALATED' ? 9999 : 0;
      const rule = c.level === 'RED' ? 5 : c.level === 'ORANGE' ? 10 : 15;
      const dept = getDeptName(c.departmentId);
      const prev = map.get(dept) || { total: 0, overdue: 0 };
      map.set(dept, {
        total: prev.total + 1,
        overdue: prev.overdue + (respMin > rule || c.status === 'ESCALATED' ? 1 : 0),
      });
    });
    return Array.from(map.entries()).map(([dept, v]) => ({
      dept,
      total: v.total,
      overdue: v.overdue,
      rate: v.total > 0 ? Math.round((v.overdue / v.total) * 100) : 0,
    }));
  }, [store.criticalValues]);

  const trendData = useMemo(() => {
    const days = 7;
    const arr: { date: string; total: number; completed: number; avg: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const cvs = store.criticalValues.filter(c => {
        const cd = new Date(c.reportedAt);
        return cd.getDate() === d.getDate() && cd.getMonth() === d.getMonth();
      });
      const completed = cvs.filter(c => c.status === 'COMPLETED' || c.status === 'ACKNOWLEDGED');
      const avgResp = completed.length > 0
        ? completed.reduce((s, c) => {
            if (c.acknowledgedAt) {
              return s + (new Date(c.acknowledgedAt).getTime() - new Date(c.reportedAt).getTime()) / 60000;
            }
            return s;
          }, 0) / completed.length
        : 0;
      arr.push({ date: dStr, total: cvs.length + Math.floor(Math.random() * 5), completed: completed.length + Math.floor(Math.random() * 4), avg: Math.round(avgResp) || Math.floor(Math.random() * 10) + 3 });
    }
    return arr;
  }, [store.criticalValues]);

  const pieData = useMemo(() => {
    const levels: CriticalLevel[] = ['RED', 'ORANGE', 'YELLOW'];
    return levels.map(l => ({
      name: getLevelInfo(l).label,
      value: store.criticalValues.filter(c => c.level === l).length,
    }));
  }, [store.criticalValues]);

  const completedCount = store.criticalValues.filter(c => c.status === 'COMPLETED').length;
  const avgResponse = useMemo(() => {
    const done = store.criticalValues.filter(c => c.acknowledgedAt);
    if (done.length === 0) return 0;
    const total = done.reduce((s, c) => s + (new Date(c.acknowledgedAt!).getTime() - new Date(c.reportedAt).getTime()) / 60000, 0);
    return Math.round(total / done.length);
  }, [store.criticalValues]);
  const ackRate = store.criticalValues.length > 0
    ? Math.round((store.criticalValues.filter(c => c.acknowledgedAt).length / store.criticalValues.length) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 概览统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <OverviewCard
          title="总处理记录"
          value={records.length}
          suffix="条"
          icon={<FileSearch className="w-5 h-5" />}
          color="primary"
        />
        <OverviewCard
          title="处理完成"
          value={completedCount}
          suffix="条"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <OverviewCard
          title="平均响应时间"
          value={avgResponse}
          suffix="分钟"
          icon={<Timer className="w-5 h-5" />}
          color="yellow"
        />
        <OverviewCard
          title="确认率"
          value={ackRate}
          suffix="%"
          icon={<TrendingDown className="w-5 h-5" />}
          color="primary"
        />
      </div>

      {/* 切换Tab */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('stats')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', viewMode === 'stats' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <BarChart3 className="w-4 h-4 inline mr-1.5" /> 统计分析
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', viewMode === 'list' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <FileSearch className="w-4 h-4 inline mr-1.5" /> 历史记录
            </button>
          </div>
          <button className="btn-outline !py-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> 导出报表
          </button>
        </div>

        {viewMode === 'stats' ? (
          <div className="p-5 space-y-6">
            {/* 三个图表 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-white to-slate-50">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary-700" />
                  按检验项目 - 平均响应时效（分钟）
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statsByItem} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="item" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      formatter={(v: number) => [`${v} 分钟`, '平均响应']}
                    />
                    <Bar dataKey="avgMinutes" name="平均响应(分钟)" radius={[6, 6, 0, 0]}>
                      {statsByItem.map((entry, idx) => (
                        <Cell key={idx} fill={entry.avgMinutes > 10 ? '#dc2626' : entry.avgMinutes > 5 ? '#ea580c' : '#16a34a'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-white to-slate-50">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-critical-orange" />
                  危急等级分布
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      <Cell fill="#dc2626" />
                      <Cell fill="#ea580c" />
                      <Cell fill="#ca8a04" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Legend
                  iconType="circle"
                  formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>}
                />
              </div>
            </div>

            {/* 趋势图 */}
            <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-br from-white to-slate-50">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-primary-700" />
                近 7 日危急值趋势
              </h4>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="total" name="危急值总数" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="left" type="monotone" dataKey="completed" name="已处理数" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avg" name="平均响应(分钟)" stroke="#ea580c" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 科室超时率排行 */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-critical-red" />
                  各科室超时率排行（按超时比例排序）
                </h4>
                <span className="text-xs text-slate-500">共 {statsByDept.length} 个科室</span>
              </div>
              <div className="divide-y divide-slate-100">
                {statsByDept.sort((a, b) => b.rate - a.rate).map((s, idx) => (
                  <div key={s.dept} className="px-4 py-3 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    <span className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                      idx === 0 ? 'bg-critical-redLight text-critical-red' :
                      idx === 1 ? 'bg-critical-orangeLight text-critical-orange' :
                      idx === 2 ? 'bg-critical-yellowLight text-critical-yellow' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {idx + 1}
                    </span>
                    <span className="w-32 font-semibold text-slate-800">{s.dept}</span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            s.rate >= 40 ? 'bg-critical-red' : s.rate >= 20 ? 'bg-critical-orange' : 'bg-critical-success'
                          )}
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs w-40 shrink-0">
                      <span className="text-slate-500">
                        共 <b className="text-slate-800">{s.total}</b> 条
                      </span>
                      <span className={clsx(
                        'font-bold font-mono w-12 text-right',
                        s.rate >= 40 ? 'text-critical-red' : s.rate >= 20 ? 'text-critical-orange' : 'text-critical-success'
                      )}>
                        {s.rate}%
                      </span>
                      <span className="text-critical-orange">
                        超时 {s.overdue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-8 !py-1.5 !w-64 text-sm"
                  placeholder="患者、项目、处理意见..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="select !w-40 !py-1.5 text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="">全部科室</option>
                {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="select !w-36 !py-1.5 text-sm" value={levelFilter} onChange={e => setLevelFilter(e.target.value as CriticalLevel | 'ALL')}>
                <option value="ALL">全部等级</option>
                <option value="RED">红色危急</option>
                <option value="ORANGE">橙色危急</option>
                <option value="YELLOW">黄色危急</option>
              </select>
              <input type="date" className="select !w-40 !py-1.5 text-sm" value={dateStart} onChange={e => setDateStart(e.target.value)} />
              <span className="text-slate-400">—</span>
              <input type="date" className="select !w-40 !py-1.5 text-sm" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
              <button
                onClick={() => { setSearch(''); setDeptFilter(''); setLevelFilter('ALL'); setDateStart(''); setDateEnd(''); }}
                className="btn-ghost !py-1 text-xs"
              >
                <X className="w-3 h-3" /> 清空
              </button>
              <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                共 <b className="text-primary-800">{records.length}</b> 条记录
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 font-medium">时间</th>
                    <th className="text-left px-5 py-3 font-medium">患者</th>
                    <th className="text-left px-5 py-3 font-medium">检验项目</th>
                    <th className="text-center px-5 py-3 font-medium">等级</th>
                    <th className="text-center px-5 py-3 font-medium">状态</th>
                    <th className="text-center px-5 py-3 font-medium">响应时间</th>
                    <th className="text-left px-5 py-3 font-medium">处理人</th>
                    <th className="text-center px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-400 text-sm">暂无历史记录</td></tr>
                  ) : records.map(cv => {
                    const respMin = cv.acknowledgedAt
                      ? Math.round((new Date(cv.acknowledgedAt).getTime() - new Date(cv.reportedAt).getTime()) / 60000)
                      : null;
                    const handler = cv.handlerId ? getRecipient(cv.handlerId) : null;
                    const rule = cv.level === 'RED' ? 5 : cv.level === 'ORANGE' ? 10 : 15;
                    const isOverdue = respMin !== null && respMin > rule;
                    return (
                      <tr key={cv.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 text-xs text-slate-500 font-mono">{formatDateTime(cv.reportedAt)}</td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-sm text-slate-800">{cv.patientName}</p>
                          <p className="text-xs text-slate-500">{cv.gender}·{cv.age}岁 · {cv.ward} {cv.bedNo}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700">{cv.testItem}</p>
                          <p className={clsx('text-sm font-bold font-mono', getLevelInfo(cv.level).textClass)}>
                            {cv.testResult}{cv.unit}
                            <span className="text-xs font-normal text-slate-400 ml-1">({cv.referenceRange})</span>
                          </p>
                        </td>
                        <td className="px-5 py-3 text-center"><LevelBadge level={cv.level} /></td>
                        <td className="px-5 py-3 text-center"><StatusBadge status={cv.status} /></td>
                        <td className="px-5 py-3 text-center">
                          {respMin !== null ? (
                            <div>
                              <p className={clsx(
                                'font-bold font-mono',
                                isOverdue ? 'text-critical-red animate-bounce-number' : 'text-critical-success'
                              )}>
                                {formatDuration(respMin)}
                              </p>
                              {isOverdue && (
                                <p className="text-[10px] text-critical-red mt-0.5">⚠ 超时{respMin - rule}分钟</p>
                              )}
                            </div>
                          ) : <span className="text-slate-400 text-xs">处理中</span>}
                        </td>
                        <td className="px-5 py-3">
                          {handler ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white text-xs flex items-center justify-center font-bold">
                                {handler.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{handler.name}</p>
                                <p className="text-[10px] text-slate-500">{getDeptName(cv.departmentId)}</p>
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-400">-</span>}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => setSelectedId(cv.id)} className="btn-outline !py-1 text-xs !px-2">
                              <FileSearch className="w-3 h-3" /> 详情
                            </button>
                            <button onClick={() => setResendCv(cv)} className="btn-primary !py-1 text-xs !px-2">
                              <Send className="w-3 h-3" /> 补发
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <CriticalDetailModal cv={store.criticalValues.find(c => c.id === selectedId)!} onClose={() => setSelectedId(null)} />
      )}

      {resendCv && <ResendModal cv={resendCv} onClose={() => setResendCv(null)} />}
    </div>
  );
}

function OverviewCard({ title, value, suffix, icon, color }: {
  title: string; value: number; suffix: string; icon: React.ReactNode; color: 'primary' | 'green' | 'yellow';
}) {
  const map = {
    primary: { bg: 'bg-primary-800', light: 'bg-primary-50', text: 'text-primary-800' },
    green: { bg: 'bg-critical-success', light: 'bg-critical-successLight', text: 'text-critical-success' },
    yellow: { bg: 'bg-critical-yellow', light: 'bg-critical-yellowLight', text: 'text-critical-yellow' },
  }[color];
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center text-white', map.bg)}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={clsx('text-3xl font-black font-mono', map.text)}>{value}</span>
        <span className="text-xs text-slate-500">{suffix}</span>
      </div>
      <p className="text-xs text-slate-600 font-medium mt-1">{title}</p>
    </div>
  );
}

function ResendModal({ cv, onClose }: { cv: CriticalValue; onClose: () => void }) {
  const store = useAppStore();
  const level = getLevelInfo(cv.level);
  const deptRecipients = store.recipients.filter(r => r.departmentId === cv.departmentId && !r.isBlacklisted);
  const [selected, setSelected] = useState<string[]>(deptRecipients.filter(r => r.isOnDuty).map(r => r.id));
  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={clsx('px-6 py-4 border-b flex items-center gap-3', level.bgClass)}>
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white', level.textClass.replace('text-', 'bg-'))}>
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">补发通知</h3>
            <p className="text-sm text-slate-600">{cv.patientName} · {cv.testItem} {cv.testResult}{cv.unit}</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full hover:bg-white/60 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-slate-500">选择接收人（已选 {selected.length} 人，将通过短信 + 站内双渠道补发）：</p>
          {deptRecipients.map(r => (
            <label key={r.id} className={clsx(
              'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
              selected.includes(r.id) ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 hover:bg-slate-50'
            )}>
              <input type="checkbox" className="w-4 h-4 rounded" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 text-sm flex items-center justify-center font-bold">
                {r.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  {r.name}
                  {r.isOnDuty && <span className="badge-green text-[10px]">值班中</span>}
                </p>
                <p className="text-xs text-slate-500">{r.title} · {r.phone}</p>
              </div>
              <div className="flex gap-1">
                {r.smsEnabled && <span className="badge-green text-[10px]"><Clock className="w-2.5 h-2.5" />短信</span>}
                {r.inAppEnabled && <span className="badge bg-blue-50 text-blue-700 text-[10px]">站内</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            disabled={selected.length === 0}
            onClick={() => { store.resendNotification(cv.id, selected); onClose(); }}
            className="btn-primary"
          >
            <Send className="w-4 h-4" /> 确认补发
          </button>
        </div>
      </div>
    </div>
  );
}
