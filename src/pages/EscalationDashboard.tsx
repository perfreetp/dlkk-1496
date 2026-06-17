import { useMemo, useState } from 'react';
import {
  ArrowUpCircle,
  ArrowUpRight,
  Clock,
  User,
  Phone,
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  Users,
  Timer,
  CheckCircle2,
  Send,
  Settings,
  Plus,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { sortCriticalValues, getLevelInfo, getRule, formatDuration, getElapsedMinutes, formatDateTime, formatTime } from '@/utils/format';
import { getDeptName, getRecipientName, getRecipient } from '@/mock/data';
import { LevelBadge, StatusBadge, CriticalDetailModal } from '@/components/common/CriticalCard';
import type { CriticalLevel, EscalationRule } from '@/types';
import clsx from 'clsx';
import { ESCALATION_RULES as _DEFAULT_RULES } from '@/mock/data';

export default function EscalationDashboardPage() {
  const store = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState<EscalationRule[]>(_DEFAULT_RULES);

  const escalated = useMemo(() =>
    sortCriticalValues(store.criticalValues.filter(c => c.status === 'ESCALATED')),
    [store.criticalValues]);

  const atRisk = useMemo(() =>
    sortCriticalValues(store.criticalValues.filter(c => {
      if (c.status !== 'PUSHED') return false;
      const rule = getRule(c.level);
      const elapsed = getElapsedMinutes(c.pushedAt || c.reportedAt);
      return elapsed >= rule.firstReminderMinutes * 0.7;
    })), [store.criticalValues]);

  const totalOverdue = escalated.length + atRisk.filter(c => {
    const rule = getRule(c.level);
    return getElapsedMinutes(c.pushedAt || c.reportedAt) >= rule.firstReminderMinutes;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 顶部概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AlertCard
          title="已触发升级"
          value={escalated.length}
          subtitle="条危急值"
          icon={<ArrowUpCircle className="w-5 h-5" />}
          color="red"
          pulse={escalated.length > 0}
        />
        <AlertCard
          title="高风险待确认"
          value={atRisk.length}
          subtitle="临近催办阈值"
          icon={<AlertOctagon className="w-5 h-5" />}
          color="orange"
        />
        <AlertCard
          title="超时未处理"
          value={totalOverdue}
          subtitle="需立即介入"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />
        <AlertCard
          title="升级规则配置"
          value={rules.length}
          subtitle="条分级策略"
          icon={<Settings className="w-5 h-5" />}
          color="primary"
          onClick={() => setShowRules(true)}
        />
      </div>

      {/* 已升级列表 */}
      <div className="card">
        <div className="card-header border-b-2 border-b-critical-red/30 bg-critical-redLight/20">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-critical-red" />
            <h3 className="font-bold text-slate-800">已触发升级的危急值</h3>
            <span className="badge-red">{escalated.length} 条</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline !py-1 text-xs">
              <Users className="w-3.5 h-3.5" /> 通知科主任
            </button>
            <button className="btn-danger !py-1 text-xs">
              <Send className="w-3.5 h-3.5" /> 全部紧急催办
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3 font-medium">患者/项目</th>
                <th className="text-left px-5 py-3 font-medium">危急等级</th>
                <th className="text-left px-5 py-3 font-medium">升级链路</th>
                <th className="text-left px-5 py-3 font-medium">催办次数</th>
                <th className="text-left px-5 py-3 font-medium">已过时间</th>
                <th className="text-left px-5 py-3 font-medium">当前责任人</th>
                <th className="text-center px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {escalated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  当前没有触发升级的危急值，一切尽在掌握！
                </td></tr>
              ) : escalated.map(cv => {
                const records = store.escalationRecords.filter(e => e.criticalValueId === cv.id);
                const last = records[records.length - 1];
                const currentHolder = last ? getRecipient(last.toRecipientId) : null;
                const elapsed = getElapsedMinutes(cv.reportedAt);
                return (
                  <tr key={cv.id} className="border-b border-slate-50 hover:bg-critical-redLight/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-critical-redLight text-critical-red flex items-center justify-center">
                          <AlertOctagon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{cv.patientName} <span className="text-xs font-normal text-slate-500">({cv.gender}·{cv.age}岁)</span></p>
                          <p className="text-xs text-slate-500">{cv.ward}·{cv.bedNo} · {cv.testItem}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><LevelBadge level={cv.level} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {records.map((r, idx) => (
                          <div key={r.id} className="flex items-center gap-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{getRecipientName(r.fromRecipientId)}</span>
                            <ArrowUpRight className="w-3 h-3 text-critical-red" />
                            <span className="text-xs px-2 py-0.5 rounded bg-critical-redLight text-critical-red font-medium">
                              {getRecipientName(r.toRecipientId)}
                              {idx === records.length - 1 && <span className="ml-1 text-[10px]">(当前)</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">升级 L{cv.escalationLevel} · {records[records.length - 1]?.reason}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xl font-black font-mono text-critical-orange">{cv.remindCount}</span>
                      <span className="text-xs text-slate-400 ml-1">次</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-mono font-bold text-critical-red text-sm animate-bounce-number">{formatDuration(elapsed)}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(cv.reportedAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {currentHolder ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-critical-orange to-critical-red text-white text-xs flex items-center justify-center font-bold">
                            {currentHolder.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{currentHolder.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />{currentHolder.phone}
                            </p>
                          </div>
                        </div>
                      ) : <span className="text-slate-400 text-sm">-</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelectedId(cv.id)} className="btn-outline !py-1 text-xs !px-2">详情</button>
                        <button className="btn-danger !py-1 text-xs !px-2">
                          <CheckCircle2 className="w-3 h-3" /> 强制确认
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

      {/* 高风险预警 */}
      {atRisk.length > 0 && (
        <div className="card">
          <div className="card-header border-b-2 border-b-critical-orange/30 bg-critical-orangeLight/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-critical-orange" />
              <h3 className="font-bold text-slate-800">高风险预警 · 即将催办/升级</h3>
              <span className="badge-orange">{atRisk.length} 条</span>
            </div>
            <p className="text-xs text-slate-500">建议提前介入，避免触发自动升级</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {atRisk.map(cv => {
              const rule = getRule(cv.level);
              const elapsed = getElapsedMinutes(cv.pushedAt || cv.reportedAt);
              const remaining = rule.firstReminderMinutes - elapsed;
              const pct = Math.min(100, (elapsed / rule.firstReminderMinutes) * 100);
              const holders = store.recipients.filter(r => r.departmentId === cv.departmentId && r.isOnDuty && !r.isBlacklisted);
              return (
                <div key={cv.id} className={clsx('p-4 rounded-xl border-2 bg-white hover:shadow-md transition-all cursor-pointer', pct >= 90 ? 'border-critical-red animate-pulse-border' : 'border-critical-orange/30')} onClick={() => setSelectedId(cv.id)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={cv.level} />
                      <StatusBadge status={cv.status} />
                    </div>
                    <span className={clsx('text-sm font-bold font-mono flex items-center gap-1', remaining <= 1 ? 'text-critical-red animate-bounce-number' : 'text-critical-orange')}>
                      <Timer className="w-3 h-3" />
                      {remaining > 0 ? `${remaining}min 后催办` : `已超时${Math.abs(remaining)}min`}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900">{cv.patientName} · {cv.testItem}</p>
                  <p className={clsx('text-lg font-black font-mono mt-0.5', getLevelInfo(cv.level).textClass)}>
                    {cv.testResult} <span className="text-xs font-normal">{cv.unit}</span>
                  </p>
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', pct >= 90 ? 'bg-critical-red' : 'bg-critical-orange')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                      <span>已过 {elapsed}min</span>
                      <span>阈值 {rule.firstReminderMinutes}min</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {holders.slice(0, 3).map(h => (
                        <div key={h.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white" title={h.name}>
                          {h.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-primary-700 flex items-center gap-0.5">
                      催办/详情 <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedId && (
        <CriticalDetailModal cv={store.criticalValues.find(c => c.id === selectedId)!} onClose={() => setSelectedId(null)} />
      )}

      {showRules && (
        <RulesModal rules={rules} setRules={setRules} onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}

function AlertCard({ title, value, subtitle, icon, color, pulse = false, onClick }: {
  title: string; value: number; subtitle: string; icon: React.ReactNode; color: 'red' | 'orange' | 'yellow' | 'primary'; pulse?: boolean; onClick?: () => void;
}) {
  const map = {
    red: { bg: 'bg-critical-redLight', text: 'text-critical-red', num: 'text-critical-red' },
    orange: { bg: 'bg-critical-orangeLight', text: 'text-critical-orange', num: 'text-critical-orange' },
    yellow: { bg: 'bg-critical-yellowLight', text: 'text-critical-yellow', num: 'text-critical-yellow' },
    primary: { bg: 'bg-primary-50', text: 'text-primary-800', num: 'text-primary-800' },
  }[color];
  return (
    <div onClick={onClick} className={clsx(
      'rounded-xl p-4 border border-slate-200 bg-white hover:shadow-md transition-all',
      pulse && 'animate-pulse-border',
      onClick && 'cursor-pointer'
    )}>
      <div className="flex items-start justify-between mb-3">
        <span className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', map.bg, map.text)}>{icon}</span>
        <span className={clsx('text-3xl font-black font-mono', map.num)}>{value}</span>
      </div>
      <p className="font-bold text-slate-800 text-sm">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function RulesModal({ rules, setRules, onClose }: {
  rules: EscalationRule[];
  setRules: (r: EscalationRule[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<EscalationRule[]>(rules);
  const levelMap: Record<CriticalLevel, { label: string; color: string }> = {
    RED: { label: '红色危急', color: 'text-critical-red bg-critical-redLight' },
    ORANGE: { label: '橙色危急', color: 'text-critical-orange bg-critical-orangeLight' },
    YELLOW: { label: '黄色危急', color: 'text-critical-yellow bg-critical-yellowLight' },
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-800" />
            <h3 className="text-xl font-bold text-slate-900">升级催办规则配置</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="rounded-xl p-4 bg-primary-50/60 border border-primary-100 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-primary-800 mb-1">规则说明</p>
            危急值推送后，如在「首次催办时间」内未确认，将自动发送催办通知；达到「最大催办次数」仍未确认，则自动升级至上级责任人。
          </div>
          {local.map((rule, idx) => (
            <div key={rule.level} className="rounded-xl border-2 border-slate-200 overflow-hidden">
              <div className={clsx('px-4 py-2.5 flex items-center justify-between', levelMap[rule.level].color)}>
                <span className="font-bold text-sm flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${rule.level === 'RED' ? 'bg-critical-red' : rule.level === 'ORANGE' ? 'bg-critical-orange' : 'bg-critical-yellow'}`}></span>
                  {levelMap[rule.level].label}
                </span>
                <button className="text-xs opacity-70 hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <RuleInput
                  label="首次催办 (分钟)"
                  value={rule.firstReminderMinutes}
                  onChange={v => {
                    const n = [...local]; n[idx] = { ...n[idx], firstReminderMinutes: v }; setLocal(n);
                  }}
                />
                <RuleInput
                  label="催办间隔 (分钟)"
                  value={rule.reminderIntervalMinutes}
                  onChange={v => {
                    const n = [...local]; n[idx] = { ...n[idx], reminderIntervalMinutes: v }; setLocal(n);
                  }}
                />
                <RuleInput
                  label="最大催办次数"
                  value={rule.maxReminders}
                  onChange={v => {
                    const n = [...local]; n[idx] = { ...n[idx], maxReminders: v }; setLocal(n);
                  }}
                />
                <RuleInput
                  label="升级层级数"
                  value={rule.escalationLevels}
                  onChange={v => {
                    const n = [...local]; n[idx] = { ...n[idx], escalationLevels: v }; setLocal(n);
                  }}
                />
              </div>
            </div>
          ))}
          <button className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm hover:border-primary-500 hover:text-primary-700 transition-colors flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> 添加自定义规则
          </button>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              夜间策略时段 <span className="text-indigo-600">22:00 — 次日 07:00</span>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {[
                { level: '红色危急', policy: '强制推送（短信响铃 + 站内消息），不因夜间而静默', color: 'text-critical-red', icon: '🔴' },
                { level: '橙色危急', policy: '推送短信 + 站内消息（不响铃，震动）', color: 'text-critical-orange', icon: '🟠' },
                { level: '黄色危急', policy: '仅站内消息，次日 07:00 补发短信提醒', color: 'text-critical-yellow', icon: '🟡' },
              ].map(r => (
                <div key={r.level} className="px-4 py-3 flex items-start gap-3">
                  <span>{r.icon}</span>
                  <div>
                    <p className={clsx('font-medium', r.color)}>{r.level}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{r.policy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            onClick={() => { setRules(local); onClose(); }}
            className="btn-primary"
          >
            <Save className="w-4 h-4" /> 保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <input
        type="number"
        className="input !py-1.5"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}
