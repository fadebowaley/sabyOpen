'use client';
import PageHeader from '@/app/shared/page-header';
import FormBuilderWithPreview from './FormBuilderWithPreview';
import ProceedButton from './ProceedButton';
import { TooltipProvider } from '@haloform/ui/tooltip';
import { useState, useCallback } from 'react';
import { FormElementType } from '@haloform/types/form-builder';

const pageHeader = {
  title: 'Project Studio',
  breadcrumb: [
    {
      href: '/',
      name: 'Home',
    },
    {
      name: 'Project Studio',
    },
  ],
};

export default function HaloForm() {
  const [formState, setFormState] = useState<{
    elements: FormElementType[];
    selectedStyle: string;
    wizardMode: boolean;
    columnSpans: Record<string, number>;
    userSettings?: any;
  }>({
    elements: [],
    selectedStyle: 'default',
    wizardMode: false,
    columnSpans: {},
    userSettings: undefined,
  });

  const handleFormStateChange = useCallback(
    (state: {
      elements: FormElementType[];
      selectedStyle: string;
      wizardMode: boolean;
      columnSpans: Record<string, number>;
      userSettings?: any;
    }) => {
      setFormState(state);
    },
    []
  );
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <div className="relative">
          <PageHeader
            title={pageHeader.title}
            breadcrumb={pageHeader.breadcrumb}
          />

          {/* Proceed Button - Positioned at top right */}
          <div className="absolute right-6 top-6 z-50">
            <ProceedButton
              elements={formState.elements}
              selectedStyle={formState.selectedStyle}
              wizardMode={formState.wizardMode}
              columnSpans={formState.columnSpans}
              userSettings={formState.userSettings}
            />
          </div>
        </div>

        {/* Open Book Container */}
        <div className="flex items-center justify-center p-6">
          <div className="relative w-full max-w-7xl">
            {/* Book Spine Shadow */}
            <div className="absolute bottom-0 left-1/2 top-0 z-10 w-8 -translate-x-1/2 transform rounded-sm bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 shadow-lg dark:from-slate-600 dark:via-slate-700 dark:to-slate-600"></div>

            {/* FormBuilder with integrated Book Layout */}
            <FormBuilderWithPreview onFormStateChange={handleFormStateChange} />

            {/* Book Base Shadow */}
            <div className="absolute -bottom-2 left-4 right-4 h-4 rounded-full bg-gradient-to-r from-transparent via-slate-400/30 to-transparent blur-sm dark:via-slate-600/30"></div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
