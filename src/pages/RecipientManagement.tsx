import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  MessageSquare,
  ShieldBan,
  ShieldCheck,
  CalendarClock,
  Search,
  Sun,
  Moon,
  Calendar,
  ChevronDown,
  Crown,
  Stethoscope,
  FlaskConical,
  User,
  ArrowRightLeft,
  X,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getDeptName } from '@/mock/data';
import { getLevelInfo, formatDateTime } from '@/utils/format';
import type { Recipient, ShiftType } from '@/types';
import clsx from 'clsx';

export default function RecipientManagementPage() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'list' | 'schedule' | 'blacklist' | 'handover'>('list');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistUntil, setBlacklistUntil] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverDept, setHandoverDept] = useState('');
  const [handoverFrom, setHandoverFrom] = useState('');
  const [handoverTo, setHandoverTo] = useState('');
  const [handoverStart, setHandoverStart] = useState('');
  const [handoverEnd, setHandoverEnd] = useState('');
  const [handoverReason, setHandoverReason] = useState('');

  const filtered = useMemo(() => {
    return store.recipients.filter(r => {
      if (deptFilter && r.departmentId !== deptFilter) return false;
      if (activeTab === 'blacklist' && !r.isBlacklisted) return false;
      if (activeTab === 'list' && search) {
        const s = search.toLowerCase();
        return r.name.toLowerCase().includes(s) || r.phone.includes(s) || r.title.includes(s);
      }
      return true;
    });
  }, [store.recipients, deptFilter, search, activeTab]);

  const onDutyCount = store.recipients.filter(r => r.isOnDuty).length;
  const blacklistCount = store.recipients.filter(r => r.isBlacklisted).length;
  const smsEnabledCount = store.recipients.filter(r => r.smsEnabled).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard label="接收人总数" value={store.recipients.length} icon={<Users className="w-4 h-4" />} color="primary" />
        <InfoCard label="当前值班中" value={onDutyCount} icon={<Sun className="w-4 h-4" />} color="green" />
        <InfoCard label="临时屏蔽" value={blacklistCount} icon={<ShieldBan className="w-4 h-4" />} color="orange" />
        <InfoCard label="短信已开启" value={smsEnabledCount} icon={<Phone className="w-4 h-4" />} color="yellow" />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'list' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <Users className="w-4 h-4 inline mr-1.5" /> 接收人列表
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'schedule' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <CalendarClock className="w-4 h-4 inline mr-1.5" /> 值班表配置
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center', activeTab === 'blacklist' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <ShieldBan className="w-4 h-4 mr-1.5" /> 黑名单管理
              {blacklistCount > 0 && <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-critical-orangeLight text-critical-orange text-xs font-bold flex items-center justify-center">{blacklistCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('handover')}
              className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center', activeTab === 'handover' ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" /> 值班交接
            </button>
          </div>
          <button className="btn-primary !py-1.5 text-sm">
            <UserPlus className="w-4 h-4" /> 添加接收人
          </button>
        </div>

        {activeTab === 'list' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-slate-50/50">
              <select
                className="select !w-48 !py-1.5 text-sm"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="">全部科室</option>
                {store.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="relative flex-1 md:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-8 !py-1.5 text-sm"
                  placeholder="搜索姓名、电话、职务..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <span className="text-xs text-slate-500">共 <b className="text-primary-800">{filtered.length}</b> 人</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-5 py-3 font-medium">人员信息</th>
                    <th className="text-left px-5 py-3 font-medium">科室</th>
                    <th className="text-left px-5 py-3 font-medium">联系电话</th>
                    <th className="text-center px-5 py-3 font-medium">值班状态</th>
                    <th className="text-center px-5 py-3 font-medium">通知渠道</th>
                    <th className="text-center px-5 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <RecipientRow key={r.id} r={r} onBlock={() => { setBlacklistReason(''); setBlacklistUntil(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)); setEditingId(r.id); }} />
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-sm">暂无数据</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && <SchedulePanel selectedDate={selectedDate} setSelectedDate={setSelectedDate} />}

        {activeTab === 'blacklist' && (
          <div className="p-5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                当前无临时屏蔽人员，所有接收人均可接收通知
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(r => (
                  <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl bg-critical-orangeLight/40 border border-orange-100">
                    <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-lg font-bold relative">
                      {r.name.charAt(0)}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-critical-orange flex items-center justify-center border-2 border-white">
                        <ShieldBan className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{r.name}</p>
                        <span className="badge-gray">{r.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{getDeptName(r.departmentId)} · {r.phone}</p>
                      <p className="text-xs text-critical-orange mt-1">
                        ⚠ 屏蔽原因：{r.blacklistReason || '未填写'} · 有效期至 {r.blacklistUntil ? new Date(r.blacklistUntil).toLocaleDateString() : '永久'}
                      </p>
                    </div>
                    <button
                      onClick={() => store.removeFromBlacklist(r.id)}
                      className="btn-success !py-1.5 text-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      解除屏蔽
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'handover' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">值班交接管理</h3>
                <p className="text-xs text-slate-500 mt-1">临时将值班责任转给同科室其他人员，交接期间危急值推送、自动催办都发给接收人</p>
              </div>
              <button
                onClick={() => {
                  setHandoverDept(store.departments[0]?.id || '');
                  setHandoverFrom('');
                  setHandoverTo('');
                  setHandoverStart(new Date(Date.now() + 60000).toISOString().slice(0, 16));
                  setHandoverEnd(new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16));
                  setHandoverReason('');
                  setShowHandoverModal(true);
                }}
                className="btn-primary !py-1.5 text-sm"
              >
                <ArrowRightLeft className="w-4 h-4" /> 新增交接
              </button>
            </div>

            {store.dutyHandovers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
                当前没有值班交接记录
              </div>
            ) : (
              <div className="space-y-3">
                {[...store.dutyHandovers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(h => {
                  const now = new Date();
                  const isActive = h.status === 'ACTIVE' && new Date(h.startTime).getTime() <= now.getTime() && new Date(h.endTime).getTime() >= now.getTime();
                  const isUpcoming = h.status === 'ACTIVE' && new Date(h.startTime).getTime() > now.getTime();
                  const from = store.recipients.find(r => r.id === h.fromRecipientId);
                  const to = store.recipients.find(r => r.id === h.toRecipientId);
                  const dept = store.departments.find(d => d.id === h.departmentId);
                  const relatedCVs = store.criticalValues.filter(cv =>
                    cv.departmentId === h.departmentId &&
                    new Date(cv.reportedAt).getTime() >= new Date(h.startTime).getTime() &&
                    new Date(cv.reportedAt).getTime() <= new Date(h.endTime).getTime()
                  );
                  const statusText = isActive ? '进行中' : isUpcoming ? '即将开始' : h.status === 'ENDED' ? '已结束' : '已取消';
                  const endType = h.status === 'ENDED' ? '正常到期' : h.status === 'CANCELLED' ? '提前取消' : '进行中';

                  const copySummary = () => {
                    const lines = [
                      '【值班交接摘要】',
                      `交接科室：${dept?.name || '-'}`,
                      `原责任人：${from?.name || '-'}（${from?.title || '-'}）`,
                      `接收人：${to?.name || '-'}（${to?.title || '-'}）`,
                      `生效时间：${new Date(h.startTime).toLocaleString()}`,
                      `结束时间：${new Date(h.endTime).toLocaleString()}`,
                      `交接状态：${statusText}`,
                      `结束方式：${endType}`,
                      `交接原因：${h.reason || '未填写'}`,
                      `期间关联危急值：${relatedCVs.length} 条`,
                      ...relatedCVs.slice(0, 10).map(cv => `  · ${getLevelInfo(cv.level).label} · ${cv.patientName} · ${cv.testItem} ${cv.testResult}${cv.unit}`),
                      relatedCVs.length > 10 ? `  ... 还有 ${relatedCVs.length - 10} 条` : '',
                    ].filter(Boolean).join('\n');
                    navigator.clipboard?.writeText(lines);
                  };

                  return (
                    <div key={h.id} className={clsx(
                      'rounded-xl border overflow-hidden',
                      isActive ? 'bg-primary-50/50 border-primary-200' :
                      isUpcoming ? 'bg-amber-50/50 border-amber-200' :
                      'bg-slate-50 border-slate-200'
                    )}>
                      <div className="flex items-start gap-4 p-4">
                        <div className={clsx(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                          isActive ? 'bg-primary-600 text-white' :
                          isUpcoming ? 'bg-amber-500 text-white' :
                          'bg-slate-300 text-slate-600'
                        )}>
                          <ArrowRightLeft className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{dept?.name}</span>
                            <span className={clsx(
                              'badge text-[10px]',
                              isActive ? 'badge-primary' :
                              isUpcoming ? 'badge bg-amber-100 text-amber-700' :
                              'badge-gray'
                            )}>
                              {statusText}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-sm">
                            <span className={clsx('font-medium', from?.isBlacklisted ? 'text-slate-400 line-through' : 'text-slate-700')}>
                              {from?.name || '未知'}
                            </span>
                            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-medium text-primary-700">{to?.name || '未知'}</span>
                            <span className="text-slate-400">· {endType}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(h.startTime).toLocaleString()} → {new Date(h.endTime).toLocaleString()}
                          </p>
                          {h.reason && <p className="text-xs text-slate-500 mt-0.5">原因：{h.reason}</p>}
                          <p className="text-xs text-slate-500 mt-1">
                            📋 期间关联危急值：<b className="text-slate-700">{relatedCVs.length}</b> 条
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end shrink-0">
                          {isActive && (
                            <button
                              onClick={() => store.endHandover(h.id)}
                              className="btn-outline !py-1 text-xs"
                            >
                              <X className="w-3 h-3" /> 提前结束
                            </button>
                          )}
                          <button
                            onClick={copySummary}
                            className="btn-outline !py-1 text-xs"
                          >
                            📋 复制摘要
                          </button>
                        </div>
                      </div>
                      {relatedCVs.length > 0 && (
                        <div className="border-t border-slate-200/70 bg-white/50 px-4 py-2 max-h-40 overflow-y-auto">
                          <p className="text-xs font-medium text-slate-600 mb-1.5">期间危急值列表：</p>
                          <div className="space-y-1">
                            {relatedCVs.map(cv => (
                              <div key={cv.id} className="flex items-center gap-2 text-xs py-0.5">
                                <span className={clsx(
                                  'w-1.5 h-1.5 rounded-full',
                                  cv.level === 'RED' ? 'bg-critical-red' :
                                  cv.level === 'ORANGE' ? 'bg-critical-orange' : 'bg-critical-yellow'
                                )} />
                                <span className="text-slate-700 font-medium">{cv.patientName}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500">{cv.testItem} {cv.testResult}{cv.unit}</span>
                                <span className="text-slate-400 text-[10px] ml-auto">{formatDateTime(cv.reportedAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {editingId && (
        <BlacklistModal
          recipient={store.recipients.find(r => r.id === editingId)!}
          onClose={() => setEditingId(null)}
          reason={blacklistReason}
          setReason={setBlacklistReason}
          until={blacklistUntil}
          setUntil={setBlacklistUntil}
        />
      )}

      <HandoverModal
        open={showHandoverModal}
        onClose={() => setShowHandoverModal(false)}
        dept={handoverDept}
        setDept={setHandoverDept}
        from={handoverFrom}
        setFrom={setHandoverFrom}
        to={handoverTo}
        setTo={setHandoverTo}
        startTime={handoverStart}
        setStartTime={setHandoverStart}
        endTime={handoverEnd}
        setEndTime={setHandoverEnd}
        reason={handoverReason}
        setReason={setHandoverReason}
      />
    </div>
  );
}

function RecipientRow({ r, onBlock }: { r: Recipient; onBlock: () => void }) {
  const store = useAppStore();
  const roleIconMap = { DOCTOR: <Stethoscope className="w-3.5 h-3.5" />, NURSE: <User className="w-3.5 h-3.5" />, TECHNICIAN: <FlaskConical className="w-3.5 h-3.5" />, ADMIN: <Crown className="w-3.5 h-3.5" /> };
  const roleText = { DOCTOR: '医生', NURSE: '护理', TECHNICIAN: '医技', ADMIN: '管理' } as const;
  const chief = store.departments.find(d => d.chiefId === r.id);
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 flex items-center justify-center font-bold">
              {r.name.charAt(0)}
            </div>
            {r.isOnDuty && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-critical-success border-2 border-white"></span>}
          </div>
          <div>
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              {r.name}
              {chief && <span className="badge bg-amber-50 text-amber-700 text-[10px]"><Crown className="w-2.5 h-2.5" />主任</span>}
              {r.isBlacklisted && <span className="badge-red text-[10px]"><ShieldBan className="w-2.5 h-2.5" />屏蔽</span>}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className={clsx(r.role === 'DOCTOR' ? 'text-primary-700' : r.role === 'NURSE' ? 'text-pink-600' : 'text-emerald-600')}>
                {roleIconMap[r.role]}
              </span>
              {r.title} · {roleText[r.role]}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-slate-700">{getDeptName(r.departmentId)}</td>
      <td className="px-5 py-3">
        <span className="font-mono text-sm text-slate-700">{r.phone}</span>
      </td>
      <td className="px-5 py-3 text-center">
        <button
          onClick={() => store.toggleRecipientDuty(r.id)}
          className={clsx('switch', r.isOnDuty ? 'switch-on' : 'switch-off')}
          disabled={r.isBlacklisted}
        >
          <span className={clsx('switch-dot', r.isOnDuty ? 'translate-x-4' : 'translate-x-0.5')}></span>
        </button>
        <p className={clsx('text-[10px] mt-1', r.isOnDuty ? 'text-critical-success' : 'text-slate-400')}>
          {r.isOnDuty ? '值班中' : '休息中'}
        </p>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center">
            <button
              onClick={() => store.updateRecipientChannels(r.id, { sms: !r.smsEnabled })}
              className={clsx('switch !w-8 !h-4', r.smsEnabled ? 'switch-on' : 'switch-off')}
              title="短信渠道"
            >
              <span className={clsx('!h-3 !w-3 switch-dot', r.smsEnabled ? 'translate-x-4' : 'translate-x-0.5')}></span>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <Phone className="w-3 h-3" /> 短信
            </div>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={() => store.updateRecipientChannels(r.id, { inApp: !r.inAppEnabled })}
              className={clsx('switch !w-8 !h-4', r.inAppEnabled ? 'switch-on' : 'switch-off')}
              title="站内消息"
            >
              <span className={clsx('!h-3 !w-3 switch-dot', r.inAppEnabled ? 'translate-x-4' : 'translate-x-0.5')}></span>
            </button>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
              <MessageSquare className="w-3 h-3" /> 站内
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-3 text-center">
        <button
          onClick={() => {
            if (r.isBlacklisted) {
              store.removeFromBlacklist(r.id);
            } else {
              onBlock();
            }
          }}
          className={clsx(r.isBlacklisted ? 'btn-success !py-1 text-xs' : 'btn-outline !py-1 text-xs')}
        >
          {r.isBlacklisted ? <><ShieldCheck className="w-3 h-3" /> 解除</> : <><ShieldBan className="w-3 h-3" /> 屏蔽</>}
        </button>
      </td>
    </tr>
  );
}

function SchedulePanel({ selectedDate, setSelectedDate }: { selectedDate: string; setSelectedDate: (s: string) => void }) {
  const store = useAppStore();
  const shifts: { key: ShiftType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'DAY', label: '日班 (08:00-20:00)', icon: <Sun className="w-4 h-4" />, color: 'bg-amber-100 text-amber-700' },
    { key: 'NIGHT', label: '夜班 (20:00-08:00)', icon: <Moon className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-700' },
    { key: 'HOLIDAY', label: '节假日值班', icon: <Calendar className="w-4 h-4" />, color: 'bg-rose-100 text-rose-700' },
  ];
  return (
    <div className="p-5 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="label !m-0 flex items-center gap-1.5 text-sm"><CalendarClock className="w-4 h-4 text-primary-700" />值班日期：</label>
        <input type="date" className="select !w-48 !py-1.5 text-sm" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        <button className="btn-outline !py-1.5 text-xs"><ChevronDown className="w-3.5 h-3.5" /> 按周排班</button>
        <div className="ml-auto text-xs text-slate-500">
          💡 提示：值班人员将自动成为危急值第一责任人
        </div>
      </div>

      {shifts.map(shift => (
        <div key={shift.key} className="rounded-xl border border-slate-200 overflow-hidden">
          <div className={clsx('px-4 py-2.5 flex items-center justify-between', shift.color)}>
            <div className="flex items-center gap-2 font-semibold">
              {shift.icon} {shift.label}
            </div>
            <span className="text-xs opacity-75">
              {store.recipients.filter(r => r.isOnDuty).length} 人在岗
            </span>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {store.recipients.filter(r => r.isOnDuty).map(r => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white text-xs flex items-center justify-center font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <span className="font-medium text-slate-700">{r.name}</span>
                  <span className="text-xs text-slate-400">{getDeptName(r.departmentId)}</span>
                </div>
              ))}
              <button className="px-3 py-1.5 rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-primary-500 hover:text-primary-700 transition-colors text-sm">
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />添加值班人员
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-xl p-4 bg-primary-50/50 border border-primary-100 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-primary-800 mb-1">🌙 夜间静默策略</p>
        <p>默认夜间时段：<b>22:00 — 次日 07:00</b></p>
        <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
          <li><span className="text-critical-red font-medium">红色危急</span>：强制推送（短信 + 响铃 + 站内）</li>
          <li><span className="text-critical-orange font-medium">橙色危急</span>：短信 + 站内消息（不响铃，震动）</li>
          <li><span className="text-critical-yellow font-medium">黄色危急</span>：仅站内消息，次日 07:00 补发短信提醒</li>
        </ul>
      </div>
    </div>
  );
}

function BlacklistModal({ recipient, onClose, reason, setReason, until, setUntil }: {
  recipient: Recipient; onClose: () => void; reason: string; setReason: (s: string) => void; until: string; setUntil: (s: string) => void;
}) {
  const store = useAppStore();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center gap-3 bg-critical-orangeLight">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-critical-orange">
            <ShieldBan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">临时屏蔽 - {recipient.name}</h3>
            <p className="text-sm text-slate-600">屏蔽期间将不接收任何危急值推送（短信、站内消息均不发送）</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">屏蔽原因 <span className="text-critical-red">*</span></label>
            <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">请选择原因...</option>
              <option value="休假">休假</option>
              <option value="外出学习">外出学习/会议</option>
              <option value="调休">调休/轮休</option>
              <option value="调离岗位">临时调离岗位</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div>
            <label className="label">屏蔽期限 <span className="text-critical-red">*</span></label>
            <input type="date" className="input" value={until} onChange={e => setUntil(e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">到期后系统将自动解除屏蔽，恢复接收通知</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            disabled={!reason}
            onClick={() => {
              const untilDate = until ? new Date(until) : undefined;
              store.addToBlacklist(recipient.id, reason || '未填写原因', untilDate);
              onClose();
            }}
            className="btn-danger"
          >
            <ShieldBan className="w-4 h-4" /> 确认屏蔽
          </button>
        </div>
      </div>
    </div>
  );
}

function HandoverModal({
  open, onClose, dept, setDept, from, setFrom, to, setTo,
  startTime, setStartTime, endTime, setEndTime, reason, setReason,
}: {
  open: boolean; onClose: () => void;
  dept: string; setDept: (v: string) => void;
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  startTime: string; setStartTime: (v: string) => void;
  endTime: string; setEndTime: (v: string) => void;
  reason: string; setReason: (v: string) => void;
}) {
  const store = useAppStore();
  const deptRecipients = store.recipients.filter(r => r.departmentId === dept && !r.isBlacklisted);

  const submit = () => {
    if (!dept || !from || !to || !startTime || !endTime) return;
    if (from === to) return;
    store.handoverDuty({
      departmentId: dept,
      fromId: from,
      toId: to,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason: reason || undefined,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center gap-3 bg-primary-50">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-primary-700">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">新增值班交接</h3>
            <p className="text-sm text-slate-600">将指定时间段的第一责任人临时转给同科室其他人员</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full hover:bg-white/60 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">交接科室 <span className="text-critical-red">*</span></label>
            <select className="select" value={dept} onChange={e => { setDept(e.target.value); setFrom(''); setTo(''); }}>
              <option value="">请选择科室...</option>
              {store.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">原值班人 <span className="text-critical-red">*</span></label>
              <select className="select" value={from} onChange={e => setFrom(e.target.value)} disabled={!dept}>
                <option value="">请选择...</option>
                {deptRecipients.map(r => (
                  <option key={r.id} value={r.id}>{r.name} · {r.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">接收人 <span className="text-critical-red">*</span></label>
              <select className="select" value={to} onChange={e => setTo(e.target.value)} disabled={!dept}>
                <option value="">请选择...</option>
                {deptRecipients.filter(r => r.id !== from).map(r => (
                  <option key={r.id} value={r.id}>{r.name} · {r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">开始时间 <span className="text-critical-red">*</span></label>
              <input type="datetime-local" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label">结束时间 <span className="text-critical-red">*</span></label>
              <input type="datetime-local" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">交接原因</label>
            <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">请选择或输入...</option>
              <option value="休假">休假</option>
              <option value="外出学习">外出学习/会议</option>
              <option value="调休">调休/轮休</option>
              <option value="临时有事">临时有事</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="btn-outline">取消</button>
          <button
            onClick={submit}
            disabled={!dept || !from || !to || !startTime || !endTime || from === to}
            className="btn-primary"
          >
            <ArrowRightLeft className="w-4 h-4" /> 确认交接
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'primary' | 'green' | 'orange' | 'yellow' }) {
  const map = {
    primary: { bg: 'bg-primary-800', light: 'bg-primary-50', text: 'text-primary-800' },
    green: { bg: 'bg-critical-success', light: 'bg-critical-successLight', text: 'text-critical-success' },
    orange: { bg: 'bg-critical-orange', light: 'bg-critical-orangeLight', text: 'text-critical-orange' },
    yellow: { bg: 'bg-critical-yellow', light: 'bg-critical-yellowLight', text: 'text-critical-yellow' },
  }[color];
  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white', map.bg)}>{icon}</span>
        <span className={clsx('text-2xl font-bold font-mono', map.text)}>{value}</span>
      </div>
      <p className="text-xs text-slate-600 font-medium">{label}</p>
    </div>
  );
}
