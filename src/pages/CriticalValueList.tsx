import { useState, useMemo } from 'react';
import {
  Filter,
  AlertTriangle,
  CheckCircle2,
  ArrowUpCircle,
  Clock,
  Search,
  RotateCcw,
  TrendingUp,
  Users,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { CriticalCard, CriticalDetailModal } from '@/components/common/CriticalCard';
import { useAppStore } from '@/stores/useAppStore';
import { sortCriticalValues, getLevelInfo, getStatusInfo } from '@/utils/format';
import { getDeptName } from '@/mock/data';
import type { CriticalValue, CriticalLevel, CriticalStatus } from '@/types';
import clsx from 'clsx';

export default function CriticalValueListPage() {
  const store = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openAckId, setOpenAckId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const allCVs = useMemo(() => sortCriticalValues(store.criticalValues), [store.criticalValues]);

  const filters = store.filters;

  const filtered = useMemo(() => {
    return allCVs.filter(cv => {
      if (filters.level !== 'ALL' && cv.level !== filters.level) return false;
      if (filters.status !== 'ALL' && cv.status !== filters.status) return false;
      if (filters.departmentId && cv.departmentId !== filters.departmentId) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          cv.patientName.toLowerCase().includes(s) ||
          cv.patientId.toLowerCase().includes(s) ||
          cv.testItem.toLowerCase().includes(s) ||
          cv.bedNo.toLowerCase().includes(s) ||
          getDeptName(cv.departmentId).includes(s)
        );
      }
      return true;
    });
  }, [allCVs, filters]);

  const stats = useMemo(() => {
    const total = allCVs.length;
    const pending = allCVs.filter(c => c.status === 'PENDING_PUSH').length;
    const pushed = allCVs.filter(c => c.status === 'PUSHED').length;
    const ack = allCVs.filter(c => c.status === 'ACKNOWLEDGED').length;
    const escalated = allCVs.filter(c => c.status === 'ESCALATED').length;
    const done = allCVs.filter(c => c.status === 'COMPLETED').length;
    const misreport = allCVs.filter(c => c.status === 'MISREPORT').length;
    return { total, pending, pushed, ack, escalated, done, misreport };
  }, [allCVs]);

  const handlePush = (cv: CriticalValue) => {
    const recipients = store.recipients
      .filter(r => r.departmentId === cv.departmentId && r.isOnDuty && !r.isBlacklisted && (r.role === 'DOCTOR' || r.role === 'NURSE'))
      .map(r => r.id);
    const toPush = recipients.length > 0 ? recipients : store.recipients.filter(r => r.departmentId === cv.departmentId).map(r => r.id);
    store.markAsPushed(cv.id, toPush);
  };

  const handleRemind = (cv: CriticalValue) => {
    const recipients = store.recipients
      .filter(r => r.departmentId === cv.departmentId && r.isOnDuty && !r.isBlacklisted)
      .map(r => r.id);
    store.remindCV(cv.id, recipients);
  };

  const handleMisreport = (cv: CriticalValue) => {
    if (confirm(`确认将「${cv.patientName} - ${cv.testItem} ${cv.testResult}」标记为误报？`)) {
      store.markAsMisreport(cv.id, '用户操作');
    }
  };

  const levels: { key: CriticalLevel | 'ALL'; label: string }[] = [
    { key: 'ALL', label: '全部等级' },
    { key: 'RED', label: '红色危急' },
    { key: 'ORANGE', label: '橙色危急' },
    { key: 'YELLOW', label: '黄色危急' },
  ];
  const statuses: { key: CriticalStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: '全部状态' },
    { key: 'PENDING_PUSH', label: '待推送' },
    { key: 'PUSHED', label: '已推送·待确认' },
    { key: 'ACKNOWLEDGED', label: '已确认·处理中' },
    { key: 'ESCALATED', label: '已升级' },
    { key: 'COMPLETED', label: '处理完成' },
    { key: 'MISREPORT', label: '已标记误报' },
  ];

  const selected = selectedId ? allCVs.find(c => c.id === selectedId) : null;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard2 label="总危急值" value={stats.total} icon={<FileText className="w-4 h-4" />} color="primary" />
        <StatCard2 label="待推送" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="gray" />
        <StatCard2 label="已推送·待确认" value={stats.pushed} icon={<AlertTriangle className="w-4 h-4" />} color="orange" pulse={stats.pushed > 0} />
        <StatCard2 label="处理中" value={stats.ack} icon={<Users className="w-4 h-4" />} color="yellow" />
        <StatCard2 label="已升级⚠" value={stats.escalated} icon={<ArrowUpCircle className="w-4 h-4" />} color="red" pulse={stats.escalated > 0} />
        <StatCard2 label="处理完成" value={stats.done} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
      </div>

      {/* 筛选工具栏 */}
      <div className="card">
        <div className="card-header !py-3 !px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline !py-1.5 text-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              筛选条件
              <ChevronDown className={clsx('w-3 h-3 transition-transform', showFilters && 'rotate-180')} />
            </button>
            <button
              onClick={() => { store.setFilter('level', 'ALL'); store.setFilter('status', 'ALL'); store.setFilter('departmentId', ''); store.setFilter('search', ''); }}
              className="btn-ghost !py-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
            <span className="text-xs text-slate-500 ml-2">
              共 <b className="text-primary-800">{filtered.length}</b> 条结果
            </span>
          </div>
          <div className="text-xs text-slate-500 hidden md:flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-critical-success" />
            按优先级自动排序
          </div>
        </div>
        {showFilters && (
          <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50">
            <div>
              <label className="label !text-xs !mb-1">危急等级</label>
              <select
                className="select !py-1.5 text-sm"
                value={filters.level}
                onChange={e => store.setFilter('level', e.target.value)}
              >
                {levels.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label !text-xs !mb-1">处理状态</label>
              <select
                className="select !py-1.5 text-sm"
                value={filters.status}
                onChange={e => store.setFilter('status', e.target.value)}
              >
                {statuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label !text-xs !mb-1">科室</label>
              <select
                className="select !py-1.5 text-sm"
                value={filters.departmentId}
                onChange={e => store.setFilter('departmentId', e.target.value)}
              >
                <option value="">全部科室</option>
                {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label !text-xs !mb-1">搜索</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-8 !py-1.5 text-sm"
                  placeholder="患者、项目、床号..."
                  value={filters.search}
                  onChange={e => store.setFilter('search', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无符合条件的危急值记录</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(cv => (
                <CriticalCard
                  key={cv.id}
                  cv={cv}
                  onOpen={() => setSelectedId(cv.id)}
                  onPush={() => handlePush(cv)}
                  onAcknowledge={() => setOpenAckId(cv.id)}
                  onRemind={() => handleRemind(cv)}
                  onMisreport={() => handleMisreport(cv)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CriticalDetailModal cv={selected} onClose={() => setSelectedId(null)} />
      )}

      {openAckId && (
        <AckInlineModal
          cvId={openAckId}
          onClose={() => setOpenAckId(null)}
          onSubmit={(data) => {
            const cv = store.criticalValues.find(c => c.id === openAckId);
            if (cv?.status === 'PENDING_PUSH') handlePush(cv);
            store.acknowledgeCV(openAckId, data);
            setOpenAckId(null);
          }}
        />
      )}
    </div>
  );
}

function AckInlineModal({ cvId, onClose, onSubmit }: {
  cvId: string;
  onClose: () => void;
  onSubmit: (data: { recipientId: string; actionTaken: string; note?: string }) => void;
}) {
  const store = useAppStore();
  const cv = store.criticalValues.find(c => c.id === cvId)!;
  const level = getLevelInfo(cv.level);
  const deptRecipients = store.recipients.filter(r => r.departmentId === cv.departmentId && !r.isBlacklisted);

  const [recipientId, setRecipientId] = useState(deptRecipients.find(r => r.isOnDuty)?.id || deptRecipients[0]?.id || '');
  const [actionTaken, setActionTaken] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className={clsx('px-6 py-4 border-b flex items-center gap-3', level.bgClass)}>
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white', level.textClass.replace('text-', 'bg-'))}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">确认接收危急值</h3>
            <p className="text-sm text-slate-600">
              {cv.patientName} · {cv.testItem} <span className={clsx('font-bold font-mono', level.textClass)}>{cv.testResult}{cv.unit}</span>
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="label">处理人 <span className="text-critical-red">*</span></label>
            <select className="select" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
              {deptRecipients.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.title} {r.isOnDuty ? '（值班中）' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">处理措施 <span className="text-critical-red">*</span></label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="例如：已予胰岛素10U+葡萄糖静滴，30分钟后复查电解质；密切监测心律..."
              value={actionTaken}
              onChange={e => setActionTaken(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['立即前往查看患者', '已予对症处理', '已通知上级医生', '联系相关科室会诊', '继续观察，复查检验'].map(txt => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => setActionTaken(actionTaken ? actionTaken + '；' + txt : txt)}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-primary-100 hover:text-primary-800 transition-colors"
                >
                  + {txt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">补充说明</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="可选：与家属沟通情况、预估处理完成时间..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            disabled={!recipientId || !actionTaken}
            onClick={() => onSubmit({ recipientId, actionTaken, note: note || undefined })}
            className="btn-success"
          >
            <CheckCircle2 className="w-4 h-4" />
            确认接收并提交
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard2({ label, value, icon, color, pulse = false }: {
  label: string; value: number; icon: React.ReactNode; color: 'primary' | 'red' | 'orange' | 'yellow' | 'green' | 'gray'; pulse?: boolean;
}) {
  const colorMap = {
    primary: { bg: 'bg-primary-800', bgLight: 'bg-primary-50', text: 'text-primary-800', border: 'border-primary-100' },
    red: { bg: 'bg-critical-red', bgLight: 'bg-critical-redLight', text: 'text-critical-red', border: 'border-red-100' },
    orange: { bg: 'bg-critical-orange', bgLight: 'bg-critical-orangeLight', text: 'text-critical-orange', border: 'border-orange-100' },
    yellow: { bg: 'bg-critical-yellow', bgLight: 'bg-critical-yellowLight', text: 'text-critical-yellow', border: 'border-yellow-100' },
    green: { bg: 'bg-critical-success', bgLight: 'bg-critical-successLight', text: 'text-critical-success', border: 'border-green-100' },
    gray: { bg: 'bg-slate-600', bgLight: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  }[color];

  return (
    <div className={clsx(
      'rounded-xl bg-white border shadow-sm p-4 transition-all hover:shadow-md',
      colorMap.border,
      pulse && 'animate-pulse-border'
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white', colorMap.bg)}>
          {icon}
        </span>
        <span className={clsx('text-2xl font-bold font-mono', value > 0 ? colorMap.text : 'text-slate-300')}>
          {value}
        </span>
      </div>
      <p className="text-xs text-slate-600 font-medium leading-tight">{label}</p>
    </div>
  );
}
