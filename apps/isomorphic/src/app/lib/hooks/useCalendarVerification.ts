import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '../axios';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  date: string;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  required: boolean;
  submissionCount: number;
  compliance: number;
}

interface CalendarData {
  exists: boolean;
  month: string;
  events: CalendarEvent[];
  overallCompliance: number;
  totalEvents: number;
  completedEvents: number;
}

interface UseCalendarVerificationReturn {
  calendar: CalendarData | null;
  loading: boolean;
  error: string | null;
  verify: (month?: string) => Promise<void>;
  generate: () => Promise<void>;
}

export const useCalendarVerification = (
  projectId: string,
  initialMonth?: string
): UseCalendarVerificationReturn => {
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(initialMonth || getCurrentMonth());
  
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const tenantId = (session?.user as any)?.tenantId;

  /**
   * Get current month in YYYY-MM format
   */
  function getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Verify if calendar exists and fetch data
   */
  const verify = useCallback(
    async (month?: string) => {
      const targetMonth = month || currentMonth;
      if (!projectId || !tenantId) return;

      setLoading(true);
      setError(null);

      try {
        console.log('📅 [CALENDAR VERIFY] Fetching calendar:', { tenantId, projectId, month: targetMonth });
        
        const response = await api.get('/event-calendar', {
          params: {
            tenant_id: tenantId,  // ✅ FIX: Backend expects tenant_id not tenantId
            project_id: projectId,  // ✅ FIX: Backend expects project_id not projectId
            month: targetMonth,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        console.log('📅 [CALENDAR VERIFY] Response:', response.data);

        // ✅ FIX: Backend returns data in `data` field, not `results`
        const calendarsData = response.data.data || response.data.results || [];
        
        if (calendarsData && calendarsData.length > 0) {
          // Parse calendar based on tracking_mode
          const calendar = calendarsData[0]; // First calendar entry for the month
          const trackingMode = calendar.tracking_mode;
          
          let eventsList: any[] = [];
          
          // Parse events based on tracking mode
          if (trackingMode === 'daily' && calendar.daily_config) {
            // Daily tracking: each date is an event
            const dailyConfig = typeof calendar.daily_config === 'string' 
              ? JSON.parse(calendar.daily_config) 
              : calendar.daily_config;
            
            const dates = dailyConfig.dates || [];
            const frequencyPerDay = dailyConfig.frequency_per_day || 1;
            
            eventsList = dates.map((date: string, index: number) => ({
              id: `${calendar.id}-date-${index}`,
              date: date,
              name: `Daily Submission - ${new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
              frequency: 'daily' as const,
              required: calendar.is_required !== false,
              submissionCount: 0, // TODO: Fetch actual submission count from DB
              compliance: 0,
            }));
          } else if (trackingMode === 'weekly' && calendar.weekly_config) {
            // Weekly tracking: parse weekly_config
            const weeklyConfig = typeof calendar.weekly_config === 'string'
              ? JSON.parse(calendar.weekly_config)
              : calendar.weekly_config;
            
            // TODO: Parse weekly events
            eventsList = [];
          } else {
            // Month-only tracking: single entry for the month
            eventsList = [{
              id: calendar.id,
              date: calendar.month,
              name: `Monthly Submission - ${new Date(calendar.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
              frequency: 'monthly' as const,
              required: calendar.is_required !== false,
              submissionCount: 0,
              compliance: 0,
            }];
          }
          
          // Calculate compliance
          const totalEvents = eventsList.length;
          const completedEvents = eventsList.filter((e: any) => e.submissionCount > 0).length;
          const overallCompliance = totalEvents > 0
            ? Math.round((completedEvents / totalEvents) * 100)
            : 0;

          setCalendar({
            exists: true,
            month: targetMonth,
            events: eventsList,
            overallCompliance,
            totalEvents,
            completedEvents,
          });
        } else {
          setCalendar({
            exists: false,
            month: targetMonth,
            events: [],
            overallCompliance: 0,
            totalEvents: 0,
            completedEvents: 0,
          });
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'Failed to verify calendar';
        setError(errorMessage);
        console.error('[useCalendarVerification] Error:', err);
        
        // Set as non-existent on error
        setCalendar({
          exists: false,
          month: targetMonth,
          events: [],
          overallCompliance: 0,
          totalEvents: 0,
          completedEvents: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [projectId, tenantId, token, currentMonth]
  );

  /**
   * Generate calendar for the current month
   */
  const generate = useCallback(async () => {
    if (!projectId || !tenantId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📅 [CALENDAR GENERATE] Generating calendar:', { tenantId, projectId, month: currentMonth });
      
      await api.post(
        '/event-calendar/generate',
        {
          tenant_id: tenantId,  // ✅ FIX: Backend expects tenant_id
          project_id: projectId,  // ✅ FIX: Backend expects project_id
          month: currentMonth,
          event_types: ['weekly'],  // ✅ ADD: Required by backend
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success('Calendar generated successfully');
      
      // Refresh calendar data
      await verify(currentMonth);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to generate calendar';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('[useCalendarVerification] Generate error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, tenantId, token, currentMonth, verify]);

  // Auto-verify on mount
  useEffect(() => {
    verify();
  }, [verify]);

  return {
    calendar,
    loading,
    error,
    verify,
    generate,
  };
};

