import { api } from '@/app/lib/axios';
import { WorkItemAssignee } from '@/app/lib/api/work-items';

export type ReminderRecurrence = {
  frequency: 'none' | 'yearly';
  dstBehavior?: 'next-valid-time';
};

export type ReminderChannel = 'email' | 'whatsapp';

export type ReminderTrigger = {
  id: string;
  entityType: string;
  entityId: string;
  scheduledAt: string;
  timezone: string;
  recurrence: ReminderRecurrence;
  channels: ReminderChannel[];
  status: 'pending' | 'queued' | 'delivered' | 'failed' | 'suppressed';
  recipients: WorkItemAssignee[];
  deliveryAttempts: Array<{
    status: 'queued' | 'delivered' | 'failed' | 'suppressed';
    queuedAt: string;
    deliveredAt?: string;
    error?: string;
  }>;
};

export type CreateReminderTriggerInput = {
  entityType: string;
  entityId: string;
  scheduledAt: string;
  timezone: string;
  recurrence: ReminderRecurrence;
  channels: ReminderChannel[];
  recipients: WorkItemAssignee[];
};

export async function getReminderTriggers(
  entityType: string,
  entityId: string
) {
  const { data } = await api.get<{ results: ReminderTrigger[] }>(
    '/reminder-triggers',
    { params: { entityType, entityId } }
  );
  return data.results;
}

export async function createReminderTrigger(
  trigger: CreateReminderTriggerInput
) {
  const { data } = await api.post<ReminderTrigger>('/reminder-triggers', {
    ...trigger,
    recipients: trigger.recipients.map((recipient) => {
      if (recipient.kind === 'all') {
        return {
          kind: 'all',
          name: recipient.name || '@all (All Users)',
        };
      }
      if (recipient.kind === 'role') {
        return {
          kind: 'role',
          roleId: recipient.roleId,
          name: recipient.name,
        };
      }
      if (recipient.kind === 'form_submissions') {
        return {
          kind: 'form_submissions',
          projectId: recipient.projectId,
          formId: recipient.formId,
          name: recipient.name,
        };
      }
      if (recipient.kind === 'contact') {
        return {
          kind: 'contact',
          name: recipient.name,
          email: recipient.email,
          phone: recipient.phone,
        };
      }
      return { kind: 'user', userId: recipient.userId };
    }),
  });
  return data;
}

export async function deleteReminderTrigger(id: string) {
  await api.delete(`/reminder-triggers/${id}`);
}
