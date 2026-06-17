import { Bell, Moon, Sun, Search, Plus, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { isNightTime } from '@/utils/format';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [now, setNow] = useState(new Date());
  const addMock = useAppStore(s => s.addMockCriticalValue);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const weekStr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
  const night = isNightTime(now);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAddDemo = () => {
    const items = [
      { testItem: '血清钾', testResult: '7.8', referenceRange: '3.5-5.3', unit: 'mmol/L', level: 'RED' as const },
      { testItem: '动脉血pH', testResult: '7.12', referenceRange: '7.35-7.45', unit: '', level: 'RED' as const },
      { testItem: '血小板计数', testResult: '18', referenceRange: '100-300', unit: '×10^9/L', level: 'ORANGE' as const },
      { testItem: 'D-二聚体', testResult: '12.5', referenceRange: '<0.5', unit: 'mg/L', level: 'YELLOW' as const },
    ];
    const pick = items[Math.floor(Math.random() * items.length)];
    const names = ['李志强', '王秀华', '赵富贵', '刘淑珍', '陈建华'];
    addMock({
      ...pick,
      patientName: names[Math.floor(Math.random() * names.length)],
      patientId: `P${Date.now()}`.slice(-10),
      age: Math.floor(Math.random() * 50) + 30,
      gender: Math.random() > 0.5 ? '男' : '女',
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-30 backdrop-blur-sm">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          {title}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
            <Clock className="w-3 h-3" />
            {timeStr}
          </span>
        </h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 ml-4">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-xs text-slate-500">
          {night ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          {dateStr} {weekStr}
          {night && <span className="ml-1 text-indigo-500 font-medium">夜间模式生效</span>}
        </div>

        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 w-64 py-1.5 text-sm"
            placeholder="搜索患者、项目、科室..."
          />
        </div>

        <button onClick={handleRefresh} className="btn-ghost !p-2" title="刷新">
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button onClick={handleAddDemo} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          模拟拉取
        </button>

        <button className="btn-ghost !p-2 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-critical-red rounded-full animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
