import { useState, useEffect, useCallback } from 'react';
import * as inmailApi from './inmail';
import type { InMail } from './inmail';

export function useMails(initialFilters: Record<string, any> = {}) {
  const [messages, setMessages] = useState<InMail[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InMail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalResults: 0,
    limit: 20,
  });

  const fetchMessages = useCallback(
    async (overrideFilters: Record<string, any> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const params = { ...filters, ...overrideFilters };
        const data = await inmailApi.getMessages(params);
        setMessages(data.results);
        setPagination({
          page: data.page,
          totalPages: data.totalPages,
          totalResults: data.totalResults,
          limit: data.limit,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const selectMessage = (msg: InMail) => setSelectedMessage(msg);

  const sendMessage = async (data: Partial<InMail>) => {
    setLoading(true);
    setError(null);
    try {
      const sent = await inmailApi.sendMessage(data);
      setMessages((prev) => [sent, ...prev]);
      return sent;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (data: Partial<InMail>) => {
    setLoading(true);
    setError(null);
    try {
      const draft = await inmailApi.saveDraft(data);
      setMessages((prev) => [draft, ...prev]);
      return draft;
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (id: string, data: Partial<InMail>) => {
    console.log('updateMessage called with:', { id, data });
    setLoading(true);
    setError(null);
    try {
      const updated = await inmailApi.updateMessage(id, data);
      console.log('updateMessage success:', updated);
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    } catch (err: any) {
      console.error('updateMessage error:', err);
      setError(err.message || 'Failed to update message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    console.log('deleteMessage called with id:', id);
    setLoading(true);
    setError(null);
    try {
      await inmailApi.deleteMessage(id);
      console.log('deleteMessage success for id:', id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error('deleteMessage error:', err);
      setError(err.message || 'Failed to delete message');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    selectedMessage,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    fetchMessages,
    selectMessage,
    sendMessage,
    saveDraft,
    updateMessage,
    deleteMessage,
  };
}
