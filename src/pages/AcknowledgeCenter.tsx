import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  User,
  FileText,
  Send,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { sortCriticalValues, getLevelInfo, getStatusInfo, formatDuration, getElapsedMinutes, formatDateTime } from '@/utils/format';
import { getDeptName, getRecipient } from '@/mock/data';
import { LevelBadge, StatusBadge, CriticalDetailModal } from '@/components/common/CriticalCard';
import type { CriticalValue } from '@/types';
import clsx from 'clsx';

export default function AcknowledgeCenterPage() {
  const store = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const actionable = useMemo(() =>
    sortCriticalValues(store.criticalValues.filter(c =>
      c.status === 'PENDING_PUSH' || c.status === 'PUSHED' || c.status === 'ESCALATED'
    )), [store.criticalValues]);

  const acknowledged = useMemo(() =>
    sortCriticalValues(store.criticalValues.filter(c => c.status === 'ACKNOWLEDGED')),
    [store.criticalValues]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card p-5 bg-gradient-to-r from-primary-800 to-primary-600 text-white border-primary-700 shadow-lg">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">医生回执工作台</h2>
              <p className="text-primary-100 text-sm mt-0.5">
                当前需要您关注的危急值共 <b className="text-white">{actionable.length}</b> 条，请及时确认
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-3xl font-black font-mono">{actionable.filter(c => c.status === 'PENDING_PUSH').length}</p>
              <p className="text-xs text-primary-100">待推送</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-3xl font-black font-mono animate-bounce-number">{actionable.filter(c => c.status !== 'PENDING_PUSH').length}</p>
              <p className="text-xs text-primary-100">待确认</p>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <p className="text-3xl font-black font-mono text-green-200">{acknowledged.length}</p>
              <p className="text-xs text-primary-100">处理中</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header border-b-2 border-b-critical-orange/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-critical-orange" />
              <h3 className="font-bold text-slate-800">待接收·待确认</h3>
              <span className="badge-orange">{actionable.length} 条</span>
            </div>
            <button className="btn-ghost !py-1 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> 刷新
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {actionable.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                太棒了！当前没有需要确认的危急值
              </div>
            ) : (
              actionable.map(cv => (
                <AckRow
                  key={cv.id}
                  cv={cv}
                  onView={() => setSelectedId(cv.id)}
                  onAck={() => setAcknowledgingId(cv.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b-2 border-b-critical-success/30">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-critical-success" />
              <h3 className="font-bold text-slate-800">已接收·处理中</h3>
              <span className="badge-green">{acknowledged.length} 条</span>
            </div>
            <button className="btn-primary !py-1 text-xs">
              <Send className="w-3.5 h-3.5" /> 批量通知
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {acknowledged.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                当前没有正在处理的危急值
              </div>
            ) : (
              acknowledged.map(cv => (
                <ProcessingRow key={cv.id} cv={cv} onView={() => setSelectedId(cv.id)} />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedId && (
        <CriticalDetailModal
          cv={store.criticalValues.find(c => c.id === selectedId)!}
          onClose={() => setSelectedId(null)}
        />
      )}

      {acknowledgingId && (
        <AckForm
          cv={store.criticalValues.find(c => c.id === acknowledgingId)!}
          onClose={() => setAcknowledgingId(null)}
          onComplete={() => setAcknowledgingId(null)}
        />
      )}
    </div>
  );
}

function AckRow({ cv, onView, onAck }: { cv: CriticalValue; onView: () => void; onAck: () => void }) {
  const store = useAppStore();
  const level = getLevelInfo(cv.level);
  const elapsed = getElapsedMinutes(cv.pushedAt || cv.reportedAt);
  const rule = cv.status === 'PENDING_PUSH' ? null : store.recipients
    .filter(r => r.departmentId === cv.departmentId && r.isOnDuty && !r.isBlacklisted);

  return (
    <div className={clsx('p-4 hover:bg-slate-50/60 transition-colors', level.bgClass, 'bg-opacity-30')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <LevelBadge level={cv.level} />
            <StatusBadge status={cv.status} />
            <span className="text-xs text-slate-500">{getDeptName(cv.departmentId)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-slate-900">
                {cv.patientName} <span className="text-xs font-normal text-slate-500">{cv.gender} · {cv.age}岁</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{cv.ward} · {cv.bedNo} · {cv.patientId}</p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white shadow-sm border border-slate-100">
              <p className="text-[10px] text-slate-500 mb-0.5">{cv.testItem}</p>
              <p className={clsx('text-lg font-bold font-mono leading-none', level.textClass)}>
                {cv.testResult}<span className="text-xs font-normal text-slate-400 ml-0.5">{cv.unit}</span>
              </p>
            </div>
          </div>
          {rule && rule.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500">推送：</span>
              {rule.slice(0, 3).map(r => (
                <span key={r.id} className="text-xs px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  {r.name}
                </span>
              ))}
              {rule.length > 3 && <span className="text-xs text-slate-400">+{rule.length - 3}</span>}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className={clsx(
            'text-sm font-bold font-mono',
            elapsed > (cv.level === 'RED' ? 5 : cv.level === 'ORANGE' ? 10 : 15) && cv.status !== 'PENDING_PUSH'
              ? 'text-critical-red animate-bounce-number'
              : 'text-slate-600'
          )}>
            {formatDuration(elapsed)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(cv.reportedAt)}</p>
          <div className="mt-3 flex gap-1.5">
            <button onClick={onView} className="btn-outline !py-1 text-xs !px-2">详情</button>
            <button onClick={onAck} className={clsx('!py-1 text-xs !px-3', cv.status === 'ESCALATED' ? 'btn-danger' : 'btn-success')}>
              <CheckCircle2 className="w-3 h-3" />确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessingRow({ cv, onView }: { cv: CriticalValue; onView: () => void }) {
  const level = getLevelInfo(cv.level);
  const handler = cv.handlerId ? getRecipient(cv.handlerId) : null;
  const elapsed = getElapsedMinutes(cv.acknowledgedAt || cv.reportedAt);

  return (
    <div className="p-4 hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <LevelBadge level={cv.level} />
            <StatusBadge status={cv.status} />
          </div>
          <p className="font-bold text-slate-900 text-sm">
            {cv.patientName} · <span className={clsx(level.textClass, 'font-mono')}>{cv.testItem} {cv.testResult}{cv.unit}</span>
          </p>
          {cv.handlerNote && (
            <p className="text-xs text-slate-600 mt-1.5 p-2 rounded bg-slate-50 border-l-2 border-critical-success">
              💡 {cv.handlerNote}
            </p>
          )}
          {handler && (
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              处理人：<b className="text-slate-700">{handler.name}</b>（{handler.title}）· 已处理 {formatDuration(elapsed)}
            </p>
          )}
        </div>
        <button onClick={onView} className="btn-outline !py-1 text-xs !px-2 shrink-0">
          查看 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function AckForm({ cv, onClose, onComplete }: {
  cv: CriticalValue; onClose: () => void; onComplete: () => void;
}) {
  const store = useAppStore();
  const level = getLevelInfo(cv.level);
  const deptRecipients = store.recipients.filter(r => r.departmentId === cv.departmentId && !r.isBlacklisted);
  const [recipientId, setRecipientId] = useState(deptRecipients.find(r => r.isOnDuty)?.id || deptRecipients[0]?.id || '');
  const [actionTaken, setActionTaken] = useState('');
  const [note, setNote] = useState('');
  const [estimated, setEstimated] = useState('60');
  const [markComplete, setMarkComplete] = useState(false);

  const submit = () => {
    if (cv.status === 'PENDING_PUSH') {
      const ids = deptRecipients.filter(r => r.isOnDuty).map(r => r.id);
      if (ids.length > 0) store.markAsPushed(cv.id, ids);
    }
    const data = {
      recipientId,
      actionTaken,
      note: note || undefined,
      estimatedCompleteAt: new Date(Date.now() + Number(estimated) * 60000),
    };
    store.acknowledgeCV(cv.id, data);
    if (markComplete) store.completeCV(cv.id);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={clsx('px-6 py-5 border-b', level.bgClass)}>
          <div className="flex items-start gap-4">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0', level.textClass.replace('text-', 'bg-'))}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">确认接收并填写处理回执</h3>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <InfoChip label="患者" value={cv.patientName} />
                <InfoChip label="病区/床号" value={`${cv.ward} ${cv.bedNo}`} />
                <InfoChip label="检验项目" value={cv.testItem} />
                <InfoChip label="危急结果" value={`${cv.testResult} ${cv.unit}`} highlight className={level.textClass} />
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/60 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">确认处理人 <span className="text-critical-red">*</span></label>
              <select className="select" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                {deptRecipients.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.title} {r.isOnDuty ? '（值班中）' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">预估完成时间（分钟）</label>
              <select className="select" value={estimated} onChange={e => setEstimated(e.target.value)}>
                {['15', '30', '45', '60', '90', '120', '240'].map(m => (
                  <option key={m} value={m}>{m} 分钟</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">处理措施 <span className="text-critical-red">*</span></label>
            <textarea className="textarea" rows={3} placeholder="详细描述已采取的处理措施..." value={actionTaken} onChange={e => setActionTaken(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                '立即床旁查看患者，评估生命体征',
                '已予急救药物处理',
                '组织多学科会诊',
                '向家属告知病情并签署知情同意',
                '安排相关辅助检查',
                '联系上级医生指导处理',
              ].map(txt => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => setActionTaken(actionTaken ? actionTaken + '；' + txt : txt)}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-primary-100 hover:text-primary-800 transition-colors"
                >+ {txt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">处理备注 / 其他说明</label>
            <textarea className="textarea" rows={2} placeholder="填写病情观察要点、后续随访计划等..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 p-3 rounded-lg bg-critical-successLight border border-green-200 cursor-pointer">
            <input type="checkbox" checked={markComplete} onChange={e => setMarkComplete(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-700">
              <b className="text-critical-success">处理已完成</b>，确认后标记为处理完成并归档
            </span>
          </label>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            onClick={submit}
            disabled={!recipientId || !actionTaken}
            className="btn-success"
          >
            <CheckCircle2 className="w-4 h-4" /> 确认接收并提交
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value, className = '', highlight = false }: { label: string; value: string; className?: string; highlight?: boolean }) {
  return (
    <div className={clsx('px-2.5 py-1.5 rounded-lg', highlight ? 'bg-white' : 'bg-white/70')}>
      <p className="text-slate-500 text-[10px]">{label}</p>
      <p className={clsx('font-bold text-sm', highlight ? 'font-mono ' + className : 'text-slate-800')}>{value}</p>
    </div>
  );
}
