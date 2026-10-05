'use client';

import { useState, useCallback } from 'react';
import * as api from '@/app/lib/api/inmail';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import type {
  InMailMessage,
  CreateMessageInput,
  UpdateMessageInput,
  QueryMessagesParams,
} from '@/app/lib/api/inmail';

// ---------------------
// ✅ Types
// ---------------------
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

interface UseInMailOptions {
  initialStatus?: 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash';
  limit?: number;
}

// ---------------------
// ✅ Hook
// ---------------------
export const useInMail = (options: UseInMailOptions = {}) => {
  const { initialStatus = 'inbox', limit = 10 } = options;
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<InMailMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  // ---------------------
  // 🛠️ API Request Utility
  // ---------------------
  const apiRequest = useCallback(
    async (apiFunc: Function, params: any[] = []): Promise<ApiResponse> => {
      setLoading(true);
      try {
        const result = await apiFunc(...params, token);
        return { success: true, data: result };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'An error occurred';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  // ---------------------
  // 📥 Fetch Messages
  // ---------------------
  const fetchMessages = useCallback(
    async (params: QueryMessagesParams = {}): Promise<ApiResponse> => {
      const response = await apiRequest(api.queryMessages, [
        {
          page: currentPage,
          limit,
          status: initialStatus,
          ...params,
        },
      ]);

      if (response.success && response.data) {
        console.log('Fetched messages:', response.data.results);
        setMessages(response.data.results);
        setTotalPages(response.data.totalPages);
        setTotalResults(response.data.totalResults);
      }

      return response;
    },
    [apiRequest, currentPage, limit, initialStatus]
  );

  // ---------------------
  // ✍️ Create Message
  // ---------------------
  const create = useCallback(
    async (input: CreateMessageInput): Promise<ApiResponse> => {
      const response = await apiRequest(api.createMessage, [input]);
      if (response.success) {
        setMessages((prev) => [response.data, ...prev]);
        toast.success('Message created successfully');
      }
      return response;
    },
    [apiRequest]
  );

  // ---------------------
  // 📨 Send Message
  // ---------------------
  const send = useCallback(
    async (input: CreateMessageInput): Promise<ApiResponse> => {
      const response = await apiRequest(api.sendMessage, [input]);
      if (response.success) {
        setMessages((prev) => [response.data, ...prev]);
        toast.success('Message sent successfully');
      }
      return response;
    },
    [apiRequest]
  );

  // ---------------------
  // 💾 Save Draft
  // ---------------------
  const saveAsDraft = useCallback(
    async (input: CreateMessageInput): Promise<ApiResponse> => {
      const response = await apiRequest(api.saveDraft, [input]);
      if (response.success) {
        setMessages((prev) => [response.data, ...prev]);
        toast.success('Draft saved successfully');
      }
      return response;
    },
    [apiRequest]
  );

  // ---------------------
  // ✏️ Update Message
  // ---------------------
  const update = useCallback(
    async (id: string, input: UpdateMessageInput): Promise<ApiResponse> => {
      console.log('updateMessage called with:', { id, input });
      const response = await apiRequest(api.updateMessage, [id, input]);
      if (response.success) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === id ? response.data : msg))
        );
        toast.success('Message updated successfully');
      }
      return response;
    },
    [apiRequest]
  );

  // ---------------------
  // 🗑️ Delete Message
  // ---------------------
  const remove = useCallback(
    async (id: string): Promise<ApiResponse> => {
      console.log('deleteMessage called with id:', id);
      const response = await apiRequest(api.deleteMessage, [id]);
      if (response.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
        toast.success('Message deleted successfully');
      }
      return response;
    },
    [apiRequest]
  );

  // ---------------------
  // 🗑️ Move to Trash
  // ---------------------
  const moveToTrash = useCallback(
    async (id: string): Promise<ApiResponse> => {
      return update(id, { status: 'trash' });
    },
    [update]
  );

  // ---------------------
  // 📄 Pagination
  // ---------------------
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    // Data
    messages,
    currentPage,
    totalPages,
    totalResults,

    // Status
    loading,

    // Actions
    fetchMessages,
    create,
    send,
    saveAsDraft,
    update,
    remove,
    moveToTrash,
    goToPage,
  };
};
