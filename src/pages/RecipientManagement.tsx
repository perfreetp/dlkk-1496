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
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { getDeptName } from '@/mock/data';
import type { Recipient, ShiftType } from '@/types';
import clsx from 'clsx';

export default function RecipientManagementPage() {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState<'list' | 'schedule' | 'blacklist'>('list');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistUntil, setBlacklistUntil] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

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
