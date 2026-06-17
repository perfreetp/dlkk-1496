import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  Users,
  CheckCircle2,
  ArrowUpCircle,
  FileSearch,
  Activity,
  Stethoscope,
} from 'lucide-react';

const navItems = [
  { to: '/', label: '危急值列表', icon: AlertTriangle, badgeKey: 'pending' },
  { to: '/recipients', label: '接收人管理', icon: Users },
  { to: '/acknowledge', label: '确认回执中心', icon: CheckCircle2 },
  { to: '/escalation', label: '升级提醒看板', icon: ArrowUpCircle },
  { to: '/records', label: '处理记录统计', icon: FileSearch },
];

interface SidebarProps {
  pendingCount: number;
  escalatedCount: number;
}

export default function Sidebar({ pendingCount, escalatedCount }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-primary-800 text-white flex items-center justify-center shadow-md">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">危急值推送助手</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Activity className="w-3 h-3 text-critical-success" />
            实时监控中
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const showPending = item.to === '/' && pendingCount > 0;
          const showEscalated = item.to === '/escalation' && escalatedCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-item-active' : 'nav-item'
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {showPending && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-critical-red text-white text-xs font-bold flex items-center justify-center animate-bounce-number">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
              {showEscalated && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-critical-orange text-white text-xs font-bold flex items-center justify-center">
                  {escalatedCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white flex items-center justify-center text-sm font-bold">
              检
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-critical-success border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">许敏主任</p>
            <p className="text-xs text-slate-500 truncate">检验科 · 值班中</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
