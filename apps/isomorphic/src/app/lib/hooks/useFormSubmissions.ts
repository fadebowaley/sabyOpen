'use client';

import { useCallback, useRef, useState } from 'react';
import {
  submitProjectFormSubmission,
  submitPublicFormSubmission,
  submitPublicFormSubmissionByReference,
  submitSecurePublicForm,
} from '@/app/lib/api/formSubmissions';

export const useFormSubmissions = () => {
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const submitPublic = useCallback(
    async (payload: {
      projectId: string;
      formData: Record<string, unknown>;
      submittedAt?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        return await submitPublicFormSubmission(payload);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    []
  );

  const submitProject = useCallback(
    async (payload: {
      projectId: string;
      submissionData: Record<string, unknown>;
      submittedAt?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        return await submitProjectFormSubmission(payload);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    []
  );

  const submitPublicByReference = useCallback(
    async (
      reference: string,
      payload: {
        submissionData: Record<string, unknown>;
        submittedAt?: string;
        metadata?: Record<string, unknown>;
        nodeId?: string;
        event_date?: string;
        submission_date?: string;
        month?: string;
        year?: number;
      }
    ) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        return await submitPublicFormSubmissionByReference(reference, payload);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    []
  );

  const submitPublicSecure = useCallback(
    async (payload: {
      accessToken: string;
      nodeId?: string;
      submissionData: Record<string, unknown>;
      submittedAt?: string;
      metadata?: Record<string, unknown>;
      event_date?: string;
      submission_date?: string;
      month?: string;
      year?: number;
    }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        return await submitSecurePublicForm(payload);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    []
  );

  return {
    submitting,
    submitPublic,
    submitPublicByReference,
    submitPublicSecure,
    submitProject,
  };
};
