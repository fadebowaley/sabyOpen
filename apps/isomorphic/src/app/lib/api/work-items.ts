import { api } from '@/app/lib/axios';
import {
  CalendarItem,
  CalendarItemPriority,
  CalendarItemStatus,
  MeetingDetail,
} from '@/app/shared/event-calendar/calendar-item';

export interface FormAttachment {
  enabled: boolean;
  projectId?: string;
  formId?: string;
  title?: string;
  publicRef?: string;
  shareRef?: string;
  url?: string;
  includeBarcode?: boolean;
}

export type WorkItemAssignee =
  | {
      kind: 'user';
      userId: string;
      name?: string;
      email?: string;
      phone?: string;
    }
  | {
      kind: 'contact';
      name: string;
      email?: string;
      phone?: string;
    }
  | {
      kind: 'all';
      name?: string;
    }
  | {
      kind: 'role';
      roleId: string;
      name: string;
    }
  | {
      kind: 'form_submissions';
      projectId: string;
      formId?: string;
      name: string;
    };

type ApiWorkItemAssignee = {
  kind?: WorkItemAssignee['kind'];
  userId?: string;
  roleId?: string;
  projectId?: string;
  formId?: string;
  name?: string;
  email?: string;
  phone?: string;
};

type ApiWorkItem = {
  id: string;
  type: CalendarItem['kind'];
  title: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  status: CalendarItem['status'];
  priority?: CalendarItem['priority'];
  description?: string;
  assignees?: ApiWorkItemAssignee[];
  formAttachment?: FormAttachment;
  meeting?: MeetingDetail;
  aiAgenda?: import('@/app/shared/event-calendar/calendar-item').AiAgendaDetail;
};

export interface WorkItemResource {
  id?: string;
  _id?: string;
  title: string;
  url: string;
  type?: 'storage' | 'url' | 'form' | 'meeting' | 'doc' | 'kanban' | 'design';
  storageFileId?: string;
  description?: string;
}

export type WorkItemDetail = Omit<CalendarItem, 'assigneeNames'> & {
  description: string;
  assignees: WorkItemAssignee[];
  resources?: WorkItemResource[];
  formAttachment?: FormAttachment;
  meeting?: MeetingDetail;
  aiAgenda?: import('@/app/shared/event-calendar/calendar-item').AiAgendaDetail & {
    topics?: string[];
    nextSteps?: string[];
  };
};

export type UpdateWorkItemInput = {
  description: string;
  status: CalendarItemStatus;
  priority?: CalendarItemPriority;
  assignees: WorkItemAssignee[];
  resources?: WorkItemResource[];
  formAttachment?: FormAttachment;
  meeting?: MeetingDetail;
  aiAgenda?: any;
};

export type CreateWorkItemInput = Omit<CalendarItem, 'id'> & {
  description?: string;
  assignees?: WorkItemAssignee[];
  formAttachment?: FormAttachment;
  meeting?: MeetingDetail;
  reminder?: {
    scheduledAt: string;
    timezone: string;
    recurrence: { frequency: 'none' | 'yearly' };
    channels?: Array<'email' | 'whatsapp'>;
  };
};

export type WorkItemImportInput = {
  type: CalendarItem['kind'];
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  status?: CalendarItemStatus;
  priority?: CalendarItemPriority;
  assigneeEmails?: string[];
  notificationContacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  projectFormId?: string;
  attachForm?: boolean;
  includeBarcode?: boolean;
  enableVideoConference?: boolean;
  meetingProvider?: 'google_meet' | 'jitsi' | 'custom';
  meetingUrl?: string;
  agendaTopics?: string[] | string;
  targetedOutcomes?: string[] | string;
  reminderMinutes?: number;
};

export const toCalendarItem = (item: ApiWorkItem): CalendarItem => ({
  id: item.id,
  title: item.title,
  start: new Date(item.startAt),
  end: new Date(item.endAt),
  allDay: item.allDay,
  kind: item.type,
  status: item.status,
  priority: item.priority,
  meeting: item.meeting,
  aiAgenda: item.aiAgenda,
  assigneeNames: item.assignees?.flatMap((assignee) =>
    assignee.name ? [assignee.name] : []
  ),
  draggable: true,
  resizable: true,
});

const toWorkItemDetail = (item: any): WorkItemDetail => ({
  ...toCalendarItem(item),
  description: item.description ?? '',
  formAttachment: item.formAttachment,
  meeting: item.meeting,
  aiAgenda: item.aiAgenda,
  resources: (item.resources ?? []).map((r: any) => ({
    id: r.id || String(r._id || ''),
    title: r.title,
    url: r.url,
    type: r.type || 'url',
    storageFileId: r.storageFileId,
    description: r.description,
  })),
  assignees: (item.assignees ?? []).map((assignee: any) => {
    if (assignee.kind === 'all') {
      return { kind: 'all' as const, name: assignee.name || '@all (All Users)' };
    }
    if (assignee.kind === 'role' && assignee.roleId) {
      return {
        kind: 'role' as const,
        roleId: assignee.roleId,
        name: assignee.name || 'Role',
      };
    }
    if (assignee.kind === 'form_submissions' && assignee.projectId) {
      return {
        kind: 'form_submissions' as const,
        projectId: assignee.projectId,
        formId: assignee.formId,
        name: assignee.name || 'Form Submissions',
      };
    }
    return assignee.kind === 'contact' || !assignee.userId
      ? { ...assignee, kind: 'contact' as const, name: assignee.name || '' }
      : { ...assignee, kind: 'user' as const, userId: assignee.userId };
  }),
});

export async function getWorkItems(from: Date, to: Date) {
  const { data } = await api.get<{ results: ApiWorkItem[] }>('/work-items', {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return data.results.map(toCalendarItem);
}

export async function updateWorkItemTiming(item: CalendarItem) {
  await api.patch(`/work-items/${item.id}`, {
    startAt: item.start.toISOString(),
    endAt: item.end.toISOString(),
    allDay: item.allDay,
  });
}

export async function getWorkItem(id: string) {
  const { data } = await api.get<ApiWorkItem>(`/work-items/${id}`);
  return toWorkItemDetail(data);
}

export async function updateWorkItem(id: string, item: UpdateWorkItemInput) {
  const { data } = await api.patch<ApiWorkItem>(`/work-items/${id}`, {
    ...item,
    assignees: serializeAssignees(item.assignees),
    formAttachment: item.formAttachment,
    meeting: item.meeting,
    resources: item.resources,
    aiAgenda: item.aiAgenda,
  });
  return toWorkItemDetail(data);
}

export async function deleteWorkItem(id: string) {
  await api.delete(`/work-items/${id}`);
}

export async function importWorkItems(items: WorkItemImportInput[]) {
  const { data } = await api.post<{ results: ApiWorkItem[] }>(
    '/work-items/import',
    { items }
  );
  return data.results.map(toCalendarItem);
}

export async function createWorkItem(item: CreateWorkItemInput) {
  const { data } = await api.post<ApiWorkItem>('/work-items', {
    type: item.kind,
    title: item.title,
    startAt: item.start.toISOString(),
    endAt: item.end.toISOString(),
    allDay: item.allDay,
    status: item.status,
    priority: item.priority,
    description: item.description,
    assignees: item.assignees && serializeAssignees(item.assignees),
    formAttachment: item.formAttachment,
    meeting: item.meeting,
    reminder: item.reminder,
  });
  return toCalendarItem(data);
}

function serializeAssignees(assignees: WorkItemAssignee[]) {
  return assignees.map((assignee) => {
    if (assignee.kind === 'all') {
      return {
        kind: 'all' as const,
        name: assignee.name || '@all (All Users)',
      };
    }
    if (assignee.kind === 'role') {
      return {
        kind: 'role' as const,
        roleId: assignee.roleId,
        name: assignee.name,
      };
    }
    if (assignee.kind === 'form_submissions') {
      return {
        kind: 'form_submissions' as const,
        projectId: assignee.projectId,
        formId: assignee.formId,
        name: assignee.name,
      };
    }
    if (assignee.kind === 'contact') {
      return {
        kind: 'contact' as const,
        name: assignee.name,
        email: assignee.email,
        phone: assignee.phone,
      };
    }
    return { kind: 'user' as const, userId: assignee.userId };
  });
}

export async function generateMeetingLink(payload: {
  provider: 'google_meet' | 'jitsi' | 'custom';
  title?: string;
}): Promise<{
  provider: 'google_meet' | 'jitsi' | 'custom';
  joinUrl: string;
  meetingId?: string;
  passcode?: string;
  autoGenerated: boolean;
}> {
  const { data } = await api.post('/work-items/generate-meeting', payload);
  return data;
}

export async function getPublicWorkItem(id: string) {
  const { data } = await api.get<any>(`/work-items/public/${id}`);
  return data;
}

export async function addPublicResource(
  id: string,
  payload: {
    title: string;
    url: string;
    type?: string;
    storageFileId?: string;
    description?: string;
  }
) {
  const { data } = await api.post<{ resources: any[] }>(
    `/work-items/public/${id}/resources`,
    payload
  );
  return data;
}
