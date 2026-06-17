import { create } from 'zustand';
import type {
  CriticalValue,
  CriticalStatus,
  Recipient,
  NotificationLog,
  AcknowledgeRecord,
  EscalationRecord,
  CriticalLevel,
} from '@/types';
import {
  CRITICAL_VALUES,
  RECIPIENTS,
  NOTIFICATION_LOGS,
  ACKNOWLEDGE_RECORDS,
  ESCALATION_RECORDS,
  DEPARTMENTS,
} from '@/mock/data';
import { generateId } from '@/utils/format';

interface AppState {
  criticalValues: CriticalValue[];
  recipients: Recipient[];
  notificationLogs: NotificationLog[];
  acknowledgeRecords: AcknowledgeRecord[];
  escalationRecords: EscalationRecord[];
  departments: typeof DEPARTMENTS;

  filters: {
    level: CriticalLevel | 'ALL';
    status: CriticalStatus | 'ALL';
    departmentId: string;
    search: string;
  };

  setFilter: (key: keyof AppState['filters'], value: string) => void;

  markAsPushed: (id: string, recipientIds: string[]) => void;
  acknowledgeCV: (id: string, data: { recipientId: string; actionTaken: string; note?: string; estimatedCompleteAt?: Date }) => void;
  completeCV: (id: string) => void;
  markAsMisreport: (id: string, reason: string) => void;
  resendNotification: (id: string, recipientIds: string[]) => void;
  escalateCV: (id: string, data: { fromId: string; toId: string; reason: string }) => void;
  remindCV: (id: string, recipientIds: string[]) => void;

  toggleRecipientDuty: (id: string) => void;
  toggleBlacklist: (id: string, reason?: string, until?: Date) => void;
  updateRecipientChannels: (id: string, data: { sms?: boolean; inApp?: boolean }) => void;

  addMockCriticalValue: (cv?: Partial<CriticalValue>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  criticalValues: CRITICAL_VALUES.map(cv => ({ ...cv })),
  recipients: RECIPIENTS.map(r => ({ ...r })),
  notificationLogs: NOTIFICATION_LOGS.map(n => ({ ...n })),
  acknowledgeRecords: ACKNOWLEDGE_RECORDS.map(a => ({ ...a })),
  escalationRecords: ESCALATION_RECORDS.map(e => ({ ...e })),
  departments: DEPARTMENTS,

  filters: {
    level: 'ALL',
    status: 'ALL',
    departmentId: '',
    search: '',
  },

  setFilter: (key, value) =>
    set(state => ({
      filters: { ...state.filters, [key]: value },
    })),

  markAsPushed: (id, recipientIds) => {
    const now = new Date();
    set(state => ({
      criticalValues: state.criticalValues.map(cv =>
        cv.id === id ? { ...cv, status: 'PUSHED' as CriticalStatus, pushedAt: now } : cv
      ),
      notificationLogs: [
        ...state.notificationLogs,
        ...recipientIds.flatMap(rid => [
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'SMS' as const, sentAt: now, status: 'SENT' as const },
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'IN_APP' as const, sentAt: now, status: 'DELIVERED' as const },
        ]),
      ],
    }));
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
    const now = new Date();
    set(state => ({
      notificationLogs: [
        ...state.notificationLogs,
        ...recipientIds.flatMap(rid => [
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'SMS' as const, sentAt: now, status: 'SENT' as const },
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'IN_APP' as const, sentAt: now, status: 'DELIVERED' as const },
        ]),
      ],
    }));
  },

  escalateCV: (id, data) => {
    const cv = get().criticalValues.find(c => c.id === id);
    const now = new Date();
    set(state => ({
      criticalValues: state.criticalValues.map(c =>
        c.id === id ? { ...c, status: 'ESCALATED' as CriticalStatus, escalationLevel: c.escalationLevel + 1 } : c
      ),
      escalationRecords: [
        ...state.escalationRecords,
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
      notificationLogs: [
        ...state.notificationLogs,
        { id: generateId('n'), criticalValueId: id, recipientId: data.toId, channel: 'SMS' as const, sentAt: now, status: 'SENT' as const },
        { id: generateId('n'), criticalValueId: id, recipientId: data.toId, channel: 'IN_APP' as const, sentAt: now, status: 'DELIVERED' as const },
      ],
    }));
  },

  remindCV: (id, recipientIds) => {
    const now = new Date();
    set(state => ({
      criticalValues: state.criticalValues.map(cv =>
        cv.id === id ? { ...cv, remindCount: cv.remindCount + 1 } : cv
      ),
      notificationLogs: [
        ...state.notificationLogs,
        ...recipientIds.flatMap(rid => [
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'SMS' as const, sentAt: now, status: 'SENT' as const },
          { id: generateId('n'), criticalValueId: id, recipientId: rid, channel: 'IN_APP' as const, sentAt: now, status: 'DELIVERED' as const },
        ]),
      ],
    }));
  },

  toggleRecipientDuty: id => {
    set(state => ({
      recipients: state.recipients.map(r => (r.id === id ? { ...r, isOnDuty: !r.isOnDuty } : r)),
    }));
  },

  toggleBlacklist: (id, reason, until) => {
    set(state => ({
      recipients: state.recipients.map(r =>
        r.id === id
          ? { ...r, isBlacklisted: !r.isBlacklisted, blacklistReason: r.isBlacklisted ? undefined : reason, blacklistUntil: r.isBlacklisted ? undefined : until }
          : r
      ),
    }));
  },

  updateRecipientChannels: (id, data) => {
    set(state => ({
      recipients: state.recipients.map(r => (r.id === id ? { ...r, ...data } : r)),
    }));
  },

  addMockCriticalValue: cv => {
    const now = new Date();
    const sample: CriticalValue = {
      id: generateId('cv'),
      patientName: '模拟患者',
      patientId: `P${Date.now()}`,
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
