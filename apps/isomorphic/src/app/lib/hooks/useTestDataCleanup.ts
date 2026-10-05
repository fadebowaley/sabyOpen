import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { softDeleteProjectForm } from '../api/projectForms';
import { api } from '../axios';
import toast from 'react-hot-toast';

interface CleanupResult {
  success: boolean;
  deletedSubmissions?: number;
  error?: string;
}

export const useTestDataCleanup = () => {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  /**
   * Delete all test submissions for a project
   */
  const deleteSubmissions = useCallback(
    async (projectId: string): Promise<CleanupResult> => {
      setLoading(true);
      try {
        const response = await api.delete('/project-form-submissions', {
          params: { projectId },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const deletedCount = response.data?.deletedCount || 0;
        toast.success(`Deleted ${deletedCount} test submission${deletedCount !== 1 ? 's' : ''}`);

        return {
          success: true,
          deletedSubmissions: deletedCount,
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'Failed to delete submissions';
        toast.error(errorMessage);
        console.error('[useTestDataCleanup] Error deleting submissions:', err);

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
   * Delete a form (soft delete)
   */
  const deleteForm = useCallback(
    async (formId: string): Promise<CleanupResult> => {
      setLoading(true);
      try {
        await softDeleteProjectForm(formId);
        toast.success('Form deleted successfully');

        return {
          success: true,
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || 'Failed to delete form';
        toast.error(errorMessage);
        console.error('[useTestDataCleanup] Error deleting form:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Delete form and all its submissions
   */
  const deleteFormAndData = useCallback(
    async (formId: string, projectId: string): Promise<CleanupResult> => {
      setLoading(true);
      try {
        // Delete submissions first
        const submissionsResult = await deleteSubmissions(projectId);

        if (!submissionsResult.success) {
          throw new Error(submissionsResult.error || 'Failed to delete submissions');
        }

        // Then delete the form
        const formResult = await deleteForm(formId);

        if (!formResult.success) {
          throw new Error(formResult.error || 'Failed to delete form');
        }

        toast.success(
          `✅ Cleanup complete! Deleted form and ${submissionsResult.deletedSubmissions} submission${submissionsResult.deletedSubmissions !== 1 ? 's' : ''}`
        );

        return {
          success: true,
          deletedSubmissions: submissionsResult.deletedSubmissions,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to delete form and data';
        toast.error(errorMessage);
        console.error('[useTestDataCleanup] Error:', err);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [deleteSubmissions, deleteForm]
  );

  return {
    deleteSubmissions,
    deleteForm,
    deleteFormAndData,
    loading,
  };
};

