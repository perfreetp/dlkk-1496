import type { CriticalLevel, CriticalStatus, CriticalValue, EscalationRule } from '@/types';
import { ESCALATION_RULES } from '@/mock/data';

export function formatTime(date: Date | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateTime(date: Date | undefined): string {
  if (!date) return '--';
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function getElapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}小时` : `${h}h ${m}min`;
}

export function getLevelInfo(level: CriticalLevel) {
  const map = {
    RED: { label: '红色危急', className: 'badge-red', cardClass: 'critical-card-red', textClass: 'text-critical-red', bgClass: 'bg-critical-redLight', order: 1 },
    ORANGE: { label: '橙色危急', className: 'badge-orange', cardClass: 'critical-card-orange', textClass: 'text-critical-orange', bgClass: 'bg-critical-orangeLight', order: 2 },
    YELLOW: { label: '黄色危急', className: 'badge-yellow', cardClass: 'critical-card-yellow', textClass: 'text-critical-yellow', bgClass: 'bg-critical-yellowLight', order: 3 },
  };
  return map[level];
}

export function getStatusInfo(status: CriticalStatus) {
  const map: Record<CriticalStatus, { label: string; className: string }> = {
    PENDING_PUSH: { label: '待推送', className: 'badge-gray' },
    PUSHED: { label: '已推送·待确认', className: 'badge-orange' },
    ACKNOWLEDGED: { label: '已确认·处理中', className: 'badge-yellow' },
    ESCALATED: { label: '已升级', className: 'badge-red' },
    COMPLETED: { label: '处理完成', className: 'badge-green' },
    MISREPORT: { label: '标记误报', className: 'badge-gray' },
  };
  return map[status];
}

export function getRule(level: CriticalLevel): EscalationRule {
  return ESCALATION_RULES.find(r => r.level === level) || ESCALATION_RULES[0];
}

export function getRemainingMinutes(cv: CriticalValue): number {
  const rule = getRule(cv.level);
  const elapsed = getElapsedMinutes(cv.pushedAt || cv.reportedAt);
  return rule.firstReminderMinutes - elapsed;
}

export function isOverdue(cv: CriticalValue): boolean {
  if (cv.status === 'ACKNOWLEDGED' || cv.status === 'COMPLETED' || cv.status === 'MISREPORT') return false;
  return getRemainingMinutes(cv) <= 0;
}

export function isNightTime(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 22 || hour < 7;
}

export function sortCriticalValues(list: CriticalValue[]): CriticalValue[] {
  return [...list].sort((a, b) => {
    const la = getLevelInfo(a.level).order;
    const lb = getLevelInfo(b.level).order;
    if (la !== lb) return la - lb;
    return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
  });
}

export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
