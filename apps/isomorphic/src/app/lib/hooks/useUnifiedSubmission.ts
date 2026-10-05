import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '../axios';
import toast from 'react-hot-toast';

interface UnifiedSubmissionPayload {
  tenantId: string;
  projectId: string;
  formId: string;
  payload: Record<string, any>;
  source?: string;
  userId?: string;
  nodeId?: string;
  month?: string;
  year?: number;
  perm_enabled?: boolean;
  // Submitter Blueprint (Required for proper activity logging)
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  node_name?: string;
  node_reference?: string;
  form_reference?: string;
}

interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
  jobId?: string;
}

interface BulkSubmissionProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
}

export const useUnifiedSubmission = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<BulkSubmissionProgress | null>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  /**
   * Submit a single form
   */
  const submitForm = useCallback(
    async (payload: UnifiedSubmissionPayload): Promise<SubmissionResult> => {
      setLoading(true);
      try {
        const response = await api.post('/submissions', payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        return {
          success: true,
          data: response.data,
          jobId: response.data?.jobId,
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'Submission failed';
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  /**
   * Submit multiple forms (bulk simulation)
   */
  const submitBulk = useCallback(
    async (
      count: number,
      basePayload: UnifiedSubmissionPayload,
      randomizeData: boolean = true
    ): Promise<BulkSubmissionProgress> => {
      setLoading(true);
      const results: BulkSubmissionProgress = {
        total: count,
        completed: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
      };

      const responseTimes: number[] = [];

      for (let i = 0; i < count; i++) {
        const startTime = Date.now();

        try {
          // Randomize payload if enabled
          const submissionPayload = randomizeData
            ? {
                ...basePayload,
                payload: randomizeFormData(basePayload.payload),
              }
            : basePayload;

          const result = await submitForm(submissionPayload);

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }

          results.completed++;
          responseTimes.push(Date.now() - startTime);
          results.avgResponseTime =
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

          // Update progress
          setProgress({ ...results });

          // Small delay to prevent overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.completed++;
          setProgress({ ...results });
        }
      }

      setLoading(false);
      return results;
    },
    [submitForm]
  );

  /**
   * Randomize form data for realistic testing
   */
  const randomizeFormData = (originalData: Record<string, any>): Record<string, any> => {
    const randomized: Record<string, any> = {};

    Object.keys(originalData).forEach((key) => {
      const value = originalData[key];

      // Keep PERM fields as-is
      if (['nodeId', 'month', 'year', 'userId'].includes(key)) {
        randomized[key] = value;
        return;
      }

      // Randomize based on type
      if (typeof value === 'number') {
        randomized[key] = Math.floor(Math.random() * 100) + 1;
      } else if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          randomized[key] = `test${Math.random().toString(36).substring(7)}@example.com`;
        } else if (key.toLowerCase().includes('name')) {
          const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma'];
          randomized[key] = names[Math.floor(Math.random() * names.length)];
        } else if (key.toLowerCase().includes('phone')) {
          randomized[key] = `+2348${Math.floor(Math.random() * 100000000)}`;
        } else {
          randomized[key] = `Test ${Math.random().toString(36).substring(7)}`;
        }
      } else if (typeof value === 'boolean') {
        randomized[key] = Math.random() > 0.5;
      } else {
        randomized[key] = value;
      }
    });

    return randomized;
  };

  return {
    submitForm,
    submitBulk,
    loading,
    progress,
  };
};

