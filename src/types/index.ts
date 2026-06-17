export type CriticalLevel = 'RED' | 'ORANGE' | 'YELLOW';
export type CriticalStatus = 'PENDING_PUSH' | 'PUSHED' | 'ACKNOWLEDGED' | 'ESCALATED' | 'COMPLETED' | 'MISREPORT';
export type RecipientRole = 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'ADMIN';
export type NotificationChannel = 'SMS' | 'IN_APP';
export type NotificationStatus = 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING_SEND' | 'SKIPPED';
export type ShiftType = 'DAY' | 'NIGHT' | 'HOLIDAY';
export type NotificationPolicy = 'NORMAL' | 'NIGHT_SILENT' | 'NIGHT_DELAYED';
export type NotificationType = 'PUSH' | 'REMIND' | 'ESCALATE' | 'RESEND';
export type HandoverStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface Department {
  id: string;
  name: string;
  chiefId: string | null;
}

export interface Recipient {
  id: string;
  name: string;
  departmentId: string;
  title: string;
  phone: string;
  role: RecipientRole;
  isOnDuty: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistUntil?: Date;
}

export interface DutySchedule {
  id: string;
  recipientId: string;
  date: string;
  shift: ShiftType;
}

export interface CriticalValue {
  id: string;
  patientName: string;
  patientId: string;
  gender: '男' | '女';
  age: number;
  ward: string;
  bedNo: string;
  departmentId: string;
  testItem: string;
  testResult: string;
  referenceRange: string;
  unit: string;
  level: CriticalLevel;
  status: CriticalStatus;
  reportedAt: Date;
  pushedAt?: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  handlerId?: string;
  handlerNote?: string;
  remindCount: number;
  escalationLevel: number;
  lastRemindedAt?: Date;
}

export interface NotificationLog {
  id: string;
  criticalValueId: string;
  recipientId: string;
  channel: NotificationChannel;
  sentAt: Date;
  status: NotificationStatus;
  failureReason?: string;
  skippedReason?: string;
  policy?: NotificationPolicy;
  delayedUntil?: Date;
  notificationType?: NotificationType;
}

export interface AcknowledgeRecord {
  id: string;
  criticalValueId: string;
  recipientId: string;
  acknowledgedAt: Date;
  actionTaken: string;
  estimatedCompleteAt?: Date;
  note?: string;
}

export interface EscalationRecord {
  id: string;
  criticalValueId: string;
  level: number;
  fromRecipientId: string;
  toRecipientId: string;
  escalatedAt: Date;
  reason: string;
}

export interface EscalationRule {
  level: CriticalLevel;
  firstReminderMinutes: number;
  reminderIntervalMinutes: number;
  maxReminders: number;
  escalationLevels: number;
  nightStartHour: number;
  nightEndHour: number;
}

export interface TimelineEvent {
  time: Date;
  type: 'REPORT' | 'PUSH' | 'ACKNOWLEDGE' | 'ESCALATE' | 'COMPLETE' | 'REMIND';
  title: string;
  description?: string;
  operatorName?: string;
}

export interface StatByItem {
  item: string;
  avgMinutes: number;
  count: number;
  overdueRate: number;
}

export interface StatByDept {
  dept: string;
  total: number;
  overdue: number;
  rate: number;
}

export interface DutyHandover {
  id: string;
  departmentId: string;
  fromRecipientId: string;
  toRecipientId: string;
  startTime: Date;
  endTime: Date;
  status: HandoverStatus;
  reason?: string;
  createdAt: Date;
}
