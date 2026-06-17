import { create } from 'zustand';
import type {
  CriticalValue,
  CriticalStatus,
  Recipient,
  NotificationLog,
  AcknowledgeRecord,
  EscalationRecord,
  CriticalLevel,
  NotificationChannel,
  NotificationPolicy,
  EscalationRule,
} from '@/types';
import {
  CRITICAL_VALUES,
  RECIPIENTS,
  NOTIFICATION_LOGS,
  ACKNOWLEDGE_RECORDS,
  ESCALATION_RECORDS,
  DEPARTMENTS,
  ESCALATION_RULES,
} from '@/mock/data';
import { generateId, isNightTime, getRule, getElapsedMinutes } from '@/utils/format';

type PendingNotification = Omit<NotificationLog, 'sentAt' | 'status'> & {
  delayedUntil: Date;
};

interface AppState {
  criticalValues: CriticalValue[];
  recipients: Recipient[];
  notificationLogs: NotificationLog[];
  acknowledgeRecords: AcknowledgeRecord[];
  escalationRecords: EscalationRecord[];
  departments: typeof DEPARTMENTS;
  escalationRules: EscalationRule[];
  pendingNotifications: PendingNotification[];

  filters: {
    level: CriticalLevel | 'ALL';
    status: CriticalStatus | 'ALL';
    departmentId: string;
    search: string;
  };

  setFilter: (key: keyof AppState['filters'], value: string) => void;

  dispatchNotifications: (
    criticalValueId: string,
    recipientIds: string[],
    channels?: NotificationChannel[],
    opts?: { isReminder?: boolean; isEscalation?: boolean }
  ) => void;

  flushPendingNotifications: () => void;

  markAsPushed: (id: string, recipientIds: string[]) => void;
  acknowledgeCV: (id: string, data: { recipientId: string; actionTaken: string; note?: string; estimatedCompleteAt?: Date }) => void;
  completeCV: (id: string) => void;
  markAsMisreport: (id: string, reason: string) => void;
  resendNotification: (id: string, recipientIds: string[]) => void;
  escalateCV: (id: string, data: { fromId: string; toId: string; reason: string }) => void;
  remindCV: (id: string, recipientIds: string[]) => void;
  processAutoRemindersAndEscalations: () => void;

  toggleRecipientDuty: (id: string) => void;
  addToBlacklist: (id: string, reason: string, until?: Date) => void;
  removeFromBlacklist: (id: string) => void;
  updateRecipientChannels: (id: string, data: { sms?: boolean; inApp?: boolean }) => void;

  addMockCriticalValue: (cv?: Partial<CriticalValue>) => void;

  dateFilters: {
    start: string;
    end: string;
  };
  setDateFilter: (key: 'start' | 'end', value: string) => void;
  clearDateFilters: () => void;
}

function buildNotificationLogs(
  criticalValueId: string,
  recipientIds: string[],
  recipients: Recipient[],
  level: CriticalLevel,
  _channels?: NotificationChannel[],
  opts?: { isReminder?: boolean; isEscalation?: boolean }
): { logs: NotificationLog[]; pending: PendingNotification[] } {
  const now = new Date();
  const night = isNightTime(now);
  const logs: NotificationLog[] = [];
  const pending: PendingNotification[] = [];

  recipientIds.forEach(rid => {
    const recipient = recipients.find(r => r.id === rid);
    if (!recipient || recipient.isBlacklisted) return;

    const baseChannels: NotificationChannel[] = [];
    if (recipient.smsEnabled) baseChannels.push('SMS');
    if (recipient.inAppEnabled) baseChannels.push('IN_APP');
    const channels = _channels ? baseChannels.filter(c => _channels.includes(c)) : baseChannels;

    channels.forEach(channel => {
      let policy: NotificationPolicy = 'NORMAL';
      let status: NotificationLog['status'] = channel === 'IN_APP' ? 'DELIVERED' : 'SENT';
      let delayedUntil: Date | undefined;

      if (night) {
        if (level === 'RED') {
          policy = 'NORMAL';
        } else if (level === 'ORANGE') {
          policy = 'NIGHT_SILENT';
        } else if (level === 'YELLOW') {
          if (channel === 'SMS') {
            policy = 'NIGHT_DELAYED';
            status = 'PENDING_SEND';
            const next = new Date();
            next.setHours(7, 0, 0, 0);
            if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
            delayedUntil = next;
          } else {
            policy = 'NIGHT_SILENT';
          }
        }
      }

      const base = {
        criticalValueId,
        recipientId: rid,
        channel,
        policy,
      };

      if (status === 'PENDING_SEND' && delayedUntil) {
        const id = generateId('n');
        pending.push({ id, ...base, delayedUntil });
        logs.push({
          id,
          sentAt: delayedUntil,
          status,
          delayedUntil,
          ...base,
        });
      } else {
        logs.push({
          id: generateId('n'),
          sentAt: now,
          status,
          ...base,
        });
      }
    });
  });

  return { logs, pending };
}

function getOnDutyRecipientsByDept(recipients: Recipient[], deptId: string): Recipient[] {
  const onDuty = recipients.filter(r => r.departmentId === deptId && r.isOnDuty && !r.isBlacklisted);
  if (onDuty.length > 0) return onDuty;
  return recipients.filter(r => r.departmentId === deptId && !r.isBlacklisted);
}

function getChiefByDept(recipients: Recipient[], departments: typeof DEPARTMENTS, deptId: string): Recipient | undefined {
  const dept = departments.find(d => d.id === deptId);
  if (!dept?.chiefId) return undefined;
  return recipients.find(r => r.id === dept.chiefId && !r.isBlacklisted);
}

export const useAppStore = create<AppState>((set, get) => ({
  criticalValues: CRITICAL_VALUES.map(cv => ({ ...cv })),
  recipients: RECIPIENTS.map(r => ({ ...r })),
  notificationLogs: NOTIFICATION_LOGS.map(n => ({ ...n, policy: 'NORMAL' as NotificationPolicy })),
  acknowledgeRecords: ACKNOWLEDGE_RECORDS.map(a => ({ ...a })),
  escalationRecords: ESCALATION_RECORDS.map(e => ({ ...e })),
  departments: DEPARTMENTS,
  escalationRules: ESCALATION_RULES,
  pendingNotifications: [],

  filters: {
    level: 'ALL',
    status: 'ALL',
    departmentId: '',
    search: '',
  },

  dateFilters: {
    start: '',
    end: '',
  },

  setDateFilter: (key, value) =>
    set(state => ({ dateFilters: { ...state.dateFilters, [key]: value } })),

  clearDateFilters: () =>
    set({ dateFilters: { start: '', end: '' } }),

  setFilter: (key, value) =>
    set(state => ({
      filters: { ...state.filters, [key]: value },
    })),

  dispatchNotifications: (criticalValueId, recipientIds, channels, opts) => {
    const state = get();
    const cv = state.criticalValues.find(c => c.id === criticalValueId);
    if (!cv) return;
    const { logs, pending } = buildNotificationLogs(
      criticalValueId,
      recipientIds,
      state.recipients,
      cv.level,
      channels,
      opts
    );
    set(s => ({
      notificationLogs: [...s.notificationLogs, ...logs],
      pendingNotifications: [...s.pendingNotifications, ...pending],
    }));
  },

  flushPendingNotifications: () => {
    const state = get();
    const now = new Date();
    const due = state.pendingNotifications.filter(p => new Date(p.delayedUntil).getTime() <= now.getTime());
    const remain = state.pendingNotifications.filter(p => new Date(p.delayedUntil).getTime() > now.getTime());
    if (due.length === 0) return;

    const dueIds = new Set(due.map(p => p.id));
    const updatedLogs = state.notificationLogs.map(n => {
      if (dueIds.has(n.id)) {
        return { ...n, status: 'SENT' as const, sentAt: now };
      }
      return n;
    });
    set({ notificationLogs: updatedLogs, pendingNotifications: remain });
  },

  markAsPushed: (id, recipientIds) => {
    const now = new Date();
    set(state => {
      const cv = state.criticalValues.find(c => c.id === id);
      const { logs, pending } = cv
        ? buildNotificationLogs(id, recipientIds, state.recipients, cv.level)
        : { logs: [], pending: [] };
      return {
        criticalValues: state.criticalValues.map(cv =>
          cv.id === id ? { ...cv, status: 'PUSHED' as CriticalStatus, pushedAt: now, lastRemindedAt: now } : cv
        ),
        notificationLogs: [...state.notificationLogs, ...logs],
        pendingNotifications: [...state.pendingNotifications, ...pending],
      };
    });
  },

  acknowledgeCV: (id, data) => {
    const now = new Date();
    set(state => ({
      criticalValues: state.criticalValues.map(cv =>
        cv.id === id
          ? {
              ...cv,
              status: 'ACKNOWLEDGED' as CriticalStatus,
              acknowledgedAt: now,
              handlerId: data.recipientId,
              handlerNote: data.actionTaken,
            }
          : cv
      ),
      acknowledgeRecords: [
        ...state.acknowledgeRecords,
        {
          id: generateId('a'),
          criticalValueId: id,
          recipientId: data.recipientId,
          acknowledgedAt: now,
          actionTaken: data.actionTaken,
          estimatedCompleteAt: data.estimatedCompleteAt,
          note: data.note,
        },
      ],
    }));
  },

  completeCV: id => {
    set(state => ({
      criticalValues: state.criticalValues.map(cv =>
        cv.id === id ? { ...cv, status: 'COMPLETED' as CriticalStatus, completedAt: new Date() } : cv
      ),
    }));
  },

  markAsMisreport: (id, _reason) => {
    set(state => ({
      criticalValues: state.criticalValues.map(cv =>
        cv.id === id ? { ...cv, status: 'MISREPORT' as CriticalStatus } : cv
      ),
    }));
  },

  resendNotification: (id, recipientIds) => {
    const state = get();
    const cv = state.criticalValues.find(c => c.id === id);
    if (!cv) return;
    const { logs, pending } = buildNotificationLogs(id, recipientIds, state.recipients, cv.level);
    set(s => ({
      notificationLogs: [...s.notificationLogs, ...logs],
      pendingNotifications: [...s.pendingNotifications, ...pending],
    }));
  },

  escalateCV: (id, data) => {
    const state = get();
    const cv = state.criticalValues.find(c => c.id === id);
    const now = new Date();
    const { logs, pending } = cv
      ? buildNotificationLogs(id, [data.toId], state.recipients, cv.level, undefined, { isEscalation: true })
      : { logs: [], pending: [] };
    set(s => ({
      criticalValues: s.criticalValues.map(c =>
        c.id === id ? { ...c, status: 'ESCALATED' as CriticalStatus, escalationLevel: c.escalationLevel + 1, lastRemindedAt: now } : c
      ),
      escalationRecords: [
        ...s.escalationRecords,
        {
          id: generateId('e'),
          criticalValueId: id,
          level: (cv?.escalationLevel || 0) + 1,
          fromRecipientId: data.fromId,
          toRecipientId: data.toId,
          escalatedAt: now,
          reason: data.reason,
        },
      ],
      notificationLogs: [...s.notificationLogs, ...logs],
      pendingNotifications: [...s.pendingNotifications, ...pending],
    }));
  },

  remindCV: (id, recipientIds) => {
    const state = get();
    const cv = state.criticalValues.find(c => c.id === id);
    const now = new Date();
    const { logs, pending } = cv
      ? buildNotificationLogs(id, recipientIds, state.recipients, cv.level, undefined, { isReminder: true })
      : { logs: [], pending: [] };
    set(s => ({
      criticalValues: s.criticalValues.map(cv =>
        cv.id === id ? { ...cv, remindCount: cv.remindCount + 1, lastRemindedAt: now } : cv
      ),
      notificationLogs: [...s.notificationLogs, ...logs],
      pendingNotifications: [...s.pendingNotifications, ...pending],
    }));
  },

  processAutoRemindersAndEscalations: () => {
    const state = get();
    const now = new Date();

    state.criticalValues.forEach(cv => {
      if (cv.status !== 'PUSHED' && cv.status !== 'ESCALATED') return;

      const rule = getRule(cv.level);
      const baseTime = cv.pushedAt || cv.reportedAt;
      const elapsed = getElapsedMinutes(baseTime);
      const sinceLast = cv.lastRemindedAt ? getElapsedMinutes(cv.lastRemindedAt) : elapsed;

      if (elapsed >= rule.firstReminderMinutes && sinceLast >= rule.reminderIntervalMinutes && cv.remindCount < rule.maxReminders) {
        const holders = getOnDutyRecipientsByDept(state.recipients, cv.departmentId).map(r => r.id);
        if (holders.length > 0) {
          get().remindCV(cv.id, holders);
        }
        return;
      }

      if (
        cv.remindCount >= rule.maxReminders &&
        cv.escalationLevel < rule.escalationLevels &&
        cv.status !== 'ESCALATED'
      ) {
        const holders = getOnDutyRecipientsByDept(state.recipients, cv.departmentId);
        const fromId = holders[0]?.id || '';
        const chief = getChiefByDept(state.recipients, state.departments, cv.departmentId);
        const toId = chief?.id || holders[0]?.id || '';
        if (fromId && toId) {
          const reason = `催办${cv.remindCount}次后仍未确认，自动升级至${chief ? '科主任' : '上级医生'}`;
          get().escalateCV(cv.id, { fromId, toId, reason });
        }
      }

      if (cv.status === 'ESCALATED' && sinceLast >= rule.reminderIntervalMinutes && cv.remindCount < rule.maxReminders + 2) {
        const last = state.escalationRecords
          .filter(e => e.criticalValueId === cv.id)
          .sort((a, b) => new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime())[0];
        if (last?.toRecipientId) {
          get().remindCV(cv.id, [last.toRecipientId]);
        }
      }
    });

    get().flushPendingNotifications();
  },

  toggleRecipientDuty: id => {
    set(state => ({
      recipients: state.recipients.map(r => (r.id === id ? { ...r, isOnDuty: !r.isOnDuty } : r)),
    }));
  },

  addToBlacklist: (id, reason, until) => {
    set(state => ({
      recipients: state.recipients.map(r =>
        r.id === id ? { ...r, isBlacklisted: true, blacklistReason: reason, blacklistUntil: until } : r
      ),
    }));
  },

  removeFromBlacklist: id => {
    set(state => ({
      recipients: state.recipients.map(r =>
        r.id === id ? { ...r, isBlacklisted: false, blacklistReason: undefined, blacklistUntil: undefined } : r
      ),
    }));
  },

  updateRecipientChannels: (id, data) => {
    set(state => ({
      recipients: state.recipients.map(r => {
        if (r.id !== id) return r;
        const next = { ...r };
        if (typeof data.sms === 'boolean') next.smsEnabled = data.sms;
        if (typeof data.inApp === 'boolean') next.inAppEnabled = data.inApp;
        return next;
      }),
    }));
  },

  addMockCriticalValue: cv => {
    const now = new Date();
    const sample: CriticalValue = {
      id: generateId('cv'),
      patientName: '模拟患者',
      patientId: `P${Date.now()}`.slice(-10),
      gender: '男',
      age: 55,
      ward: '急诊病区',
      bedNo: 'A-01',
      departmentId: 'dept-1',
      testItem: '血糖',
      testResult: '22.5',
      referenceRange: '3.9-6.1',
      unit: 'mmol/L',
      level: 'RED',
      status: 'PENDING_PUSH',
      reportedAt: now,
      remindCount: 0,
      escalationLevel: 0,
      ...cv,
    };
    set(state => ({
      criticalValues: [sample, ...state.criticalValues],
    }));
  },
}));
