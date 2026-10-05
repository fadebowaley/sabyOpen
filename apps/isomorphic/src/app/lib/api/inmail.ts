import { api } from '../axios';

export interface InMailAttachment {
  fileId?: string;
  url: string;
  filename: string;
  size: number;
  mimeType?: string;
}

export interface InMailMessage {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  from: string | any; // Can be populated user object
  to: string[] | any[]; // Can be populated user objects
  read: boolean;
  starred: boolean;
  timestamp: string;
  attachments?: InMailAttachment[];
  status: 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash';
  createdAt: string;
  updatedAt: string;
  readBy?: Array<{
    userId: string;
    readAt: string;
  }>;
}

export interface CreateMessageInput {
  subject: string;
  body: string;
  from?: string;
  recipients: string[]; // Can include user IDs or group identifiers (allofus, alladmins, all+rolename)
  attachments?: InMailAttachment[];
}

export interface UpdateMessageInput extends Partial<CreateMessageInput> {
  status?: 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash';
  read?: boolean;
  starred?: boolean;
}

export interface QueryMessagesParams {
  page?: number;
  limit?: number;
  status?: 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash';
  search?: string;
  inbox?: boolean;
  sent?: boolean;
  drafts?: boolean;
  trash?: boolean;
  starred?: boolean;
}

export const createMessage = async (
  input: CreateMessageInput,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/inmail', input, options);
  return data;
};

export const queryMessages = async (
  params: QueryMessagesParams = {},
  token?: string
) => {
  const options = {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get('/inmail', options);
  return data;
};

export const getMessageById = async (id: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.get(`/inmail/${id}`, options);
  return data;
};

export const updateMessage = async (
  id: string,
  input: UpdateMessageInput,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.patch(`/inmail/${id}`, input, options);
  return data;
};

export const deleteMessage = async (id: string, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.delete(`/inmail/${id}`, options);
  return data;
};

export const sendMessage = async (
  input: CreateMessageInput,
  token?: string
) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/inmail/send', input, options);
  return data;
};

export const saveDraft = async (input: CreateMessageInput, token?: string) => {
  const options = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  const { data } = await api.post('/inmail/draft', input, options);
  return data;
};
