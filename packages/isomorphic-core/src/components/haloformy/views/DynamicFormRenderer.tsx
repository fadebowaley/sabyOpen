'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'rizzui';
import { toast } from 'react-hot-toast';
import FormPreview from '@haloform/FormBuilder/FormPreview';
import { FormElementType } from '@haloform/types/form-builder';
import { getProjectFormByProjectId } from '@/app/lib/api/projectForms';

interface ProjectForm {
  projectId: string;
  configuration: {
    projectName: string;
    tags: string[];
    accessibility: string[];
    security: 'public' | 'private';
  };
  elements: FormElementType[];
  style: string;
  wizardMode: boolean;
  userSettings: any;
  metadata: {
    deploymentStatus: 'draft' | 'published' | 'archived';
    version: string;
  };
  status: 'active' | 'inactive' | 'archived';
  columnSpans?: Record<string, 1 | 2 | 3 | 4>;
}

interface DynamicFormRendererProps {
  projectId: string;
}

// Predefined form styles matching FormPreviewPanel
const formStyles = {
  default: {
    background: 'bg-white dark:bg-black',
    inputBackground: 'bg-white dark:bg-black',
    inputBorder: 'border-black dark:border-white',
    inputFocus: 'ring-black dark:ring-white',
    borderRadius: 'rounded-lg',
    padding: 'p-6',
    inputText: 'text-black dark:text-white',
    labelText: 'text-black dark:text-white',
  },
  modern: {
    background: 'bg-blue-50 dark:bg-blue-950',
    inputBackground: 'bg-white dark:bg-black',
    inputBorder: '!border-2 !border-blue-500 dark:!border-blue-400',
    inputFocus: 'ring-black dark:ring-white',
    borderRadius: 'rounded-xl',
    padding: 'p-8',
    inputText: 'text-black dark:text-white',
    labelText: 'text-black dark:text-white',
  },
  minimal: {
    background: 'bg-gray-100 dark:bg-gray-800',
    inputBackground: 'bg-white dark:bg-black',
    inputBorder:
      '!border-b-2 !border-gray-400 !border-t-0 !border-l-0 !border-r-0',
    inputFocus: 'ring-black dark:ring-white',
    borderRadius: '!rounded-none',
    padding: 'p-4',
    inputText: 'text-black dark:text-white',
    labelText: 'text-black dark:text-white',
  },
  elegant: {
    background:
      'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900',
    inputBackground: 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm',
    inputBorder: 'border-slate-200 dark:border-slate-700',
    inputFocus: 'ring-violet-500',
    borderRadius: 'rounded-2xl',
    padding: 'p-8',
    inputText: 'text-slate-900 dark:text-slate-100',
    labelText: 'text-slate-700 dark:text-slate-300',
  },
  dark: {
    background: 'bg-gray-900 dark:bg-black',
    inputBackground: 'bg-gray-800 dark:bg-gray-900',
    inputBorder: 'border-gray-700 dark:border-gray-800',
    inputFocus: 'ring-blue-500',
    borderRadius: 'rounded-lg',
    padding: 'p-6',
    inputText: 'text-gray-100 dark:text-gray-100',
    labelText: 'text-gray-300 dark:text-gray-400',
  },
  light: {
    background: 'bg-gray-50 dark:bg-white',
    inputBackground: 'bg-white dark:bg-gray-50',
    inputBorder: 'border-gray-200 dark:border-gray-300',
    inputFocus: 'ring-blue-500',
    borderRadius: 'rounded-lg',
    padding: 'p-6',
    inputText: 'text-gray-900 dark:text-gray-900',
    labelText: 'text-gray-700 dark:text-gray-700',
  },
};

export default function DynamicFormRenderer({
  projectId,
}: DynamicFormRendererProps) {
  const [projectForm, setProjectForm] = useState<ProjectForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    fetchProjectForm();
  }, [projectId, fetchProjectForm]);

  const fetchProjectForm = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectFormByProjectId(projectId);
      setProjectForm(response);

      // Check if module is published and active
      if (
        response.metadata.deploymentStatus !== 'published' ||
        response.status !== 'active'
      ) {
        toast.error('This module is not currently available');
        router.push('/404');
        return;
      }

      // Initialize module data with default values
      const initialData: Record<string, any> = {};
      response.elements?.forEach((element: FormElementType) => {
        if (element.properties.defaultValue !== undefined) {
          initialData[element.id] = element.properties.defaultValue;
        }
      });
      setFormData(initialData);
    } catch (error: any) {
      console.error('Error fetching module:', error);
      toast.error('Module not found or unavailable');
      router.push('/404');
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  const handleInputChange = (elementId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [elementId]: value,
    }));

    // Clear error for this field
    if (errors[elementId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[elementId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    projectForm?.elements?.forEach((element) => {
      const value = formData[element.id];
      const { required, validation } = element.properties;

      // Check required fields
      if (
        required &&
        (!value || (typeof value === 'string' && value.trim() === ''))
      ) {
        newErrors[element.id] =
          `${element.properties.label || 'This field'} is required`;
      }

      // Additional validation
      if (value && validation) {
        if (validation.minLength && value.length < validation.minLength) {
          newErrors[element.id] =
            `Minimum length is ${validation.minLength} characters`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          newErrors[element.id] =
            `Maximum length is ${validation.maxLength} characters`;
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          newErrors[element.id] = 'Invalid format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setSubmitting(true);

      // Submit module data
      const submissionData = {
        projectId,
        formData,
        submittedAt: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          timestamp: Date.now(),
        },
      };

      // Call submission API
      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit module');
      }

      toast.success('Module submitted successfully!');

      // Reset module if multiple submissions are allowed
      if (projectForm?.userSettings?.behavior?.allowMultipleSubmissions) {
        setFormData({});
      } else {
        // Show success message and disable form
        setFormData({});
      }
    } catch (error: any) {
      console.error('Error submitting module:', error);
      toast.error(error.message || 'Failed to submit module');
    } finally {
      setSubmitting(false);
    }
  };

  const getFormStyle = () => {
    const styleName = projectForm?.style || 'default';
    return (
      formStyles[styleName as keyof typeof formStyles] || formStyles.default
    );
  };

  // Add a custom submit button to the elements if it doesn't exist
  const elementsWithSubmit = React.useMemo(() => {
    if (!projectForm?.elements) return [];

    const hasSubmitButton = projectForm.elements.some(
      (element) =>
        element.type === 'button' && element.properties.buttonType === 'submit'
    );

    if (hasSubmitButton) {
      return projectForm.elements;
    }

    // Add a custom submit button
    const submitButton: FormElementType = {
      id: 'custom-submit-btn',
      type: 'button',
      label: 'Submit Module',
      properties: {
        label: 'Submit Module',
        buttonType: 'submit',
        buttonText: submitting ? 'Submitting...' : 'Submit Module',
        disabled: submitting,
        style: {
          backgroundColor:
            projectForm?.userSettings?.ui?.primaryColor || '#3b82f6',
        },
      },
    };

    return [...projectForm.elements, submitButton];
  }, [
    projectForm?.elements,
    submitting,
    projectForm?.userSettings?.ui?.primaryColor,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!projectForm) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Module Not Found
          </h1>
          <p className="text-gray-600">
            The requested module could not be found or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Module Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {projectForm.configuration.projectName}
          </h1>
          {projectForm.configuration.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {projectForm.configuration.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Module Content using FormPreview */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
          <FormPreview
            elements={elementsWithSubmit}
            onSave={handleSubmit}
            wizardMode={projectForm.wizardMode}
            columnSpans={projectForm.columnSpans || {}}
            formStyle={getFormStyle()}
            formData={formData}
            onInputChange={handleInputChange}
          />
        </div>
      </div>
    </div>
  );
}
