import { Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/stores/useAppStore';

const titles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '危急值列表', subtitle: '实时监控所有必须立刻处理的检验结果，确保发出去、有人接、有人回、有人追到底' },
  '/recipients': { title: '接收人管理', subtitle: '配置科室责任人、值班表、黑名单与通知渠道偏好' },
  '/acknowledge': { title: '确认回执中心', subtitle: '接收危急值推送，填写处理措施，追踪处理进度' },
  '/escalation': { title: '升级提醒看板', subtitle: '超时未确认的危急值自动升级，追踪每一条到底' },
  '/records': { title: '处理记录统计', subtitle: '历史记录查询、补发通知、按项目维度分析响应时效' },
};

export default function Layout() {
  const location = useLocation();
  const cvs = useAppStore(s => s.criticalValues);

  const pageInfo = useMemo(() => {
    for (const key of Object.keys(titles)) {
      if (location.pathname === key || (key !== '/' && location.pathname.startsWith(key))) {
        return titles[key];
      }
    }
    return titles['/'];
  }, [location.pathname]);

  const pendingCount = useMemo(() =>
    cvs.filter(c => c.status === 'PUSHED' || c.status === 'PENDING_PUSH').length,
    [cvs]
  );
  const escalatedCount = useMemo(() =>
    cvs.filter(c => c.status === 'ESCALATED').length,
    [cvs]
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar pendingCount={pendingCount} escalatedCount={escalatedCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
