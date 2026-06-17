import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  User,
  Send,
  XCircle,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Phone,
  MessageSquare,
  Timer,
  TrendingUp,
  RefreshCw,
  Flag,
} from 'lucide-react';
import type { CriticalValue, TimelineEvent, NotificationLog, AcknowledgeRecord, EscalationRecord } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import {
  formatTime,
  formatDateTime,
  getLevelInfo,
  getStatusInfo,
  getElapsedMinutes,
  formatDuration,
  getRemainingMinutes,
  isOverdue,
  getRule,
} from '@/utils/format';
import { getDeptName, getRecipientName, getRecipient } from '@/mock/data';
import clsx from 'clsx';

interface CriticalCardProps {
  cv: CriticalValue;
  onOpen: () => void;
  onPush?: () => void;
  onAcknowledge?: () => void;
  onRemind?: () => void;
  onMisreport?: () => void;
}

export function CriticalCard({ cv, onOpen, onPush, onAcknowledge, onRemind, onMisreport }: CriticalCardProps) {
  const level = getLevelInfo(cv.level);
  const status = getStatusInfo(cv.status);
  const elapsed = getElapsedMinutes(cv.reportedAt);
  const remaining = getRemainingMinutes(cv);
  const overdue = isOverdue(cv);
  const rule = getRule(cv.level);
  const handler = cv.handlerId ? getRecipient(cv.handlerId) : undefined;

  return (
    <div
      className={clsx(
        'card overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-slide-in-left',
        level.cardClass
      )}
      onClick={onOpen}
    >
      <div className={clsx('px-4 py-2.5 flex items-center justify-between border-b border-black/5', level.bgClass)}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={clsx('w-4 h-4', level.textClass)} />
          <span className={clsx('font-semibold text-xs uppercase tracking-wide', level.textClass)}>
            {level.label}
          </span>
          <span className="text-xs text-slate-500">· {getDeptName(cv.departmentId)}</span>
        </div>
        <span className={status.className}>{status.label}</span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{cv.patientName}</span>
              <span className="text-xs text-slate-500">{cv.gender} · {cv.age}岁</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono">{cv.patientId}</span>
              {cv.ward} · {cv.bedNo}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{formatTime(cv.reportedAt)}</p>
            <p className={clsx(
              'text-xs font-bold flex items-center justify-end gap-1 mt-0.5',
              elapsed > rule.firstReminderMinutes && cv.status !== 'COMPLETED' && cv.status !== 'ACKNOWLEDGED' && cv.status !== 'MISREPORT'
                ? 'text-critical-red animate-bounce-number'
                : 'text-slate-600'
            )}>
              <Timer className="w-3 h-3" />
              已过 {formatDuration(elapsed)}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">{cv.testItem}</p>
              <div className="flex items-baseline gap-2">
                <span className={clsx(
                  'text-2xl font-bold font-mono',
                  level.textClass
                )}>
                  {cv.testResult}
                </span>
                <span className="text-xs text-slate-500">{cv.unit}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">参考 {cv.referenceRange}</p>
            </div>
            <div className="text-right">
              {cv.status === 'PUSHED' || cv.status === 'ESCALATED' ? (
                <div>
                  <p className="text-xs text-slate-500">距催办</p>
                  <p className={clsx(
                    'text-lg font-bold font-mono',
                    remaining <= 1 ? 'text-critical-red animate-bounce-number' : remaining <= 3 ? 'text-critical-orange' : 'text-slate-700'
                  )}>
                    {remaining > 0 ? `${remaining}分钟` : '已超时'}
                  </p>
                  {overdue && <p className="text-[10px] text-critical-red font-bold mt-0.5">⚠ 需立即处理</p>}
                </div>
              ) : handler ? (
                <div>
                  <p className="text-xs text-slate-500 mb-1">处理人</p>
                  <p className="text-sm font-semibold text-slate-800">{handler.name}</p>
                  <p className="text-[10px] text-slate-500">{handler.title}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {cv.remindCount > 0 && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <RefreshCw className="w-3 h-3 text-critical-orange" />
            <span className="text-critical-orange font-medium">已催办 {cv.remindCount} 次</span>
            {cv.escalationLevel > 0 && (
              <span className="flex items-center gap-1 text-critical-red font-medium">
                <ArrowUpRight className="w-3 h-3" /> 已升级 L{cv.escalationLevel}
              </span>
            )}
          </div>
        )}

        <div
          className="flex items-center gap-2"
          onClick={e => e.stopPropagation()}
        >
          {cv.status === 'PENDING_PUSH' && (
            <button onClick={onPush} className="btn-primary !py-1.5 flex-1 text-xs">
              <Send className="w-3.5 h-3.5" />
              立即推送
            </button>
          )}
          {cv.status === 'PUSHED' && (
            <>
              <button onClick={onAcknowledge} className="btn-success !py-1.5 flex-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                确认回执
              </button>
              <button onClick={onRemind} className="btn-outline !py-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
                催办
              </button>
            </>
          )}
          {cv.status === 'ESCALATED' && (
            <>
              <button onClick={onAcknowledge} className="btn-danger !py-1.5 flex-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                紧急确认
              </button>
              <button onClick={onRemind} className="btn-outline !py-1.5 text-xs">
                <Flag className="w-3.5 h-3.5" />
                再次升级
              </button>
            </>
          )}
          {cv.status === 'ACKNOWLEDGED' && (
            <button onClick={onAcknowledge} className="btn-primary !py-1.5 flex-1 text-xs">
              <ChevronRight className="w-3.5 h-3.5" />
              查看处理进展
            </button>
          )}
          {cv.status === 'COMPLETED' && (
            <button onClick={onOpen} className="btn-outline !py-1.5 flex-1 text-xs">
              <ChevronRight className="w-3.5 h-3.5" />
              查看处理详情
            </button>
          )}
          <button onClick={onMisreport} className="btn-ghost !p-1.5" title="标记误报">
            <XCircle className="w-4 h-4 text-slate-400 hover:text-critical-red" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface CriticalDetailModalProps {
  cv: CriticalValue;
  onClose: () => void;
}

export function CriticalDetailModal({ cv, onClose }: CriticalDetailModalProps) {
  const store = useAppStore();
  const level = getLevelInfo(cv.level);
  const status = getStatusInfo(cv.status);

  const notifications = store.notificationLogs.filter(n => n.criticalValueId === cv.id);
  const acknowledges = store.acknowledgeRecords.filter(a => a.criticalValueId === cv.id);
  const escalations = store.escalationRecords.filter(e => e.criticalValueId === cv.id);
  const handler = cv.handlerId ? getRecipient(cv.handlerId) : undefined;

  const events: TimelineEvent[] = [];
  events.push({ time: cv.reportedAt, type: 'REPORT', title: '检验科报告危急值', operatorName: '系统自动拉取' });
  if (cv.pushedAt) {
    events.push({
      time: cv.pushedAt,
      type: 'PUSH',
      title: `推送至责任人`,
      description: `短信 + 站内消息双渠道 ${notifications.length} 条`,
    });
  }
  escalations.forEach(e => {
    events.push({
      time: e.escalatedAt,
      type: 'ESCALATE',
      title: `升级 L${e.level}`,
      description: `${getRecipientName(e.fromRecipientId)} → ${getRecipientName(e.toRecipientId)}：${e.reason}`,
    });
  });
  if (cv.acknowledgedAt && acknowledges[0]) {
    events.push({
      time: cv.acknowledgedAt,
      type: 'ACKNOWLEDGE',
      title: `${acknowledges[0].actionTaken}`,
      description: acknowledges[0].note,
      operatorName: getRecipientName(acknowledges[0].recipientId),
    });
  }
  if (cv.completedAt) {
    events.push({ time: cv.completedAt, type: 'COMPLETE', title: '处理完成归档' });
  }

  const getEventStyle = (type: TimelineEvent['type']) => {
    const map: Record<TimelineEvent['type'], { color: string; icon: typeof Clock; label: string }> = {
      REPORT: { color: 'bg-primary-800', icon: AlertTriangle, label: '报告' },
      PUSH: { color: 'bg-blue-500', icon: Send, label: '推送' },
      ACKNOWLEDGE: { color: 'bg-critical-success', icon: CheckCircle2, label: '确认' },
      ESCALATE: { color: 'bg-critical-red', icon: ArrowUpRight, label: '升级' },
      COMPLETE: { color: 'bg-slate-500', icon: CheckCircle2, label: '完成' },
      REMIND: { color: 'bg-critical-orange', icon: RefreshCw, label: '催办' },
    };
    return map[type];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className={clsx('px-6 py-4 border-b flex items-center justify-between', level.bgClass)}>
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white', level.textClass.replace('text-', 'bg-'))}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {cv.patientName}
                <span className={status.className}>{status.label}</span>
              </h3>
              <p className="text-sm text-slate-600">{getDeptName(cv.departmentId)} · {cv.ward} {cv.bedNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/60 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="性别/年龄" value={`${cv.gender} · ${cv.age}岁`} icon={<User className="w-4 h-4" />} />
            <StatCard label="住院号" value={cv.patientId} icon={<TrendingUp className="w-4 h-4" />} mono />
            <StatCard label="危急等级" value={level.label} className={level.textClass} icon={<AlertTriangle className="w-4 h-4" />} />
            <StatCard label="报告时间" value={formatDateTime(cv.reportedAt)} icon={<Clock className="w-4 h-4" />} />
          </div>

          <div className={clsx('rounded-xl p-5 border-2', level.bgClass, level.cardClass)}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">检验项目</p>
                <h4 className="text-3xl font-bold text-slate-900">{cv.testItem}</h4>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className={clsx('text-4xl font-black font-mono', level.textClass)}>
                    {cv.testResult}
                  </span>
                  <span className="text-sm text-slate-500">{cv.unit}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 font-mono">
                  参考范围：<span className="text-slate-700">{cv.referenceRange}</span>
                </p>
              </div>
              <div className="text-right space-y-2">
                <div className="px-3 py-2 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-slate-500">推送次数</p>
                  <p className="text-xl font-bold text-slate-900">{notifications.length}</p>
                </div>
                <div className="px-3 py-2 bg-white rounded-lg shadow-sm">
                  <p className="text-xs text-slate-500">催办次数</p>
                  <p className="text-xl font-bold text-critical-orange">{cv.remindCount}</p>
                </div>
              </div>
            </div>
          </div>

          {handler && (
            <div className="card p-4">
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> 处理责任人
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white flex items-center justify-center text-lg font-bold">
                  {handler.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{handler.name}</p>
                  <p className="text-sm text-slate-500">{handler.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-primary-800" />
                  <span className="font-mono">{handler.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  {handler.smsEnabled && <span className="badge-green"><MessageSquare className="w-3 h-3" />短信</span>}
                  {handler.inAppEnabled && <span className="badge-blue badge bg-blue-50 text-blue-700"><MessageSquare className="w-3 h-3" />站内</span>}
                </div>
              </div>
              {cv.handlerNote && (
                <div className="mt-3 p-3 rounded-lg bg-critical-successLight border-l-4 border-critical-success">
                  <p className="text-xs text-slate-500 mb-1">处理措施</p>
                  <p className="text-sm text-slate-800">{cv.handlerNote}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-4">📋 处理时间线</h4>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-5">
              {events.map((ev, idx) => {
                const style = getEventStyle(ev.type);
                const Icon = style.icon;
                return (
                  <div key={idx} className="relative">
                    <div className={clsx(
                      'absolute -left-[33px] w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md',
                      style.color
                    )}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-800">{ev.title}</p>
                        <span className="text-xs text-slate-500 font-mono">{formatTime(ev.time)}</span>
                      </div>
                      {ev.description && <p className="text-xs text-slate-600">{ev.description}</p>}
                      {ev.operatorName && <p className="text-xs text-primary-700 mt-1">操作用户：{ev.operatorName}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {notifications.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3">📨 通知发送记录 ({notifications.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notifications.map(n => {
                  const pending = n.status === 'PENDING_SEND';
                  const isSilent = n.policy === 'NIGHT_SILENT';
                  const isDelayed = n.policy === 'NIGHT_DELAYED';
                  return (
                    <div key={n.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 text-xs">
                      <span className={clsx(
                        'w-7 h-7 rounded-full flex items-center justify-center',
                        n.channel === 'SMS' ? 'bg-green-100 text-critical-success' : 'bg-blue-100 text-blue-700'
                      )}>
                        {n.channel === 'SMS' ? <Phone className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 flex items-center gap-1 flex-wrap">
                          {getRecipientName(n.recipientId)}
                          {isSilent && <span className="badge bg-indigo-50 text-indigo-600 text-[10px]">🌙 夜间静默</span>}
                          {isDelayed && <span className="badge bg-amber-50 text-amber-700 text-[10px]">⏰ 延迟补发</span>}
                          {pending && n.delayedUntil && (
                            <span className="text-[10px] text-slate-500">预计 {formatTime(n.delayedUntil)}</span>
                          )}
                        </p>
                        <p className="text-slate-500 truncate">{n.channel === 'SMS' ? '短信渠道' : '站内消息'} · {pending && n.delayedUntil ? '等待发送' : formatTime(n.sentAt)}</p>
                      </div>
                      <span className={clsx(
                        'badge shrink-0',
                        pending ? 'badge bg-slate-100 text-slate-600' :
                        n.status === 'SENT' ? 'badge-green' :
                        n.status === 'DELIVERED' ? 'badge-green' : 'badge-red'
                      )}>
                        {pending ? '待发送' : n.status === 'SENT' ? '已发送' : n.status === 'DELIVERED' ? '已送达' : '失败'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, className = 'text-slate-900', mono = false }: {
  label: string; value: string; icon: React.ReactNode; className?: string; mono?: boolean;
}) {
  return (
    <div className="px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
        <span className="text-primary-700">{icon}</span>
        {label}
      </p>
      <p className={clsx('text-base font-bold truncate', className, mono && 'font-mono')}>{value}</p>
    </div>
  );
}

export function LevelBadge({ level }: { level: CriticalValue['level'] }) {
  const info = getLevelInfo(level);
  return <span className={info.className}>{info.label}</span>;
}

export function StatusBadge({ status }: { status: CriticalValue['status'] }) {
  const info = getStatusInfo(status);
  return <span className={info.className}>{info.label}</span>;
}

export type { NotificationLog, AcknowledgeRecord, EscalationRecord };
