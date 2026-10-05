import { api } from '../axios';

export const previewEventCalendar = async (payload: {
  formId: string;
  month: string;
  year: number;
}) => {
  const { data } = await api.post('/event-calendar/preview', payload);
  return data;
};

