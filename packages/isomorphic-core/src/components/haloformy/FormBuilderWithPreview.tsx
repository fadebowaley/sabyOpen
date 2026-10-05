'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import FormElementsList from '@haloform/FormBuilder/FormElementsList';
import {
  generateElement,
  FormElementType,
  ElementType,
} from '@haloform/types/form-builder';
import FormBuilderHeader from '@haloform/FormBuilder/FormBuilderHeader';
import FormPreviewPanel from '@haloform/FormBuilder/FormPreviewPanel';
import { useForms } from '@/app/lib/hooks/useForms';

const LOCAL_STORAGE_KEY = 'formBuilderElements';

interface FormBuilderWithPreviewProps {
  onFormStateChange?: (state: {
    elements: FormElementType[];
    selectedStyle: string;
    wizardMode: boolean;
    columnSpans: Record<string, number>;
    userSettings?: any; // Include user settings in form state
  }) => void;
}

const FormBuilderWithPreview = ({
  onFormStateChange,
}: FormBuilderWithPreviewProps) => {
  const [elements, setElements] = useState<FormElementType[]>([]);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'properties'>(
    'preview'
  );
  const [wizardMode, setWizardMode] = useState<boolean>(false);
  const [columnSpans, setColumnSpans] = useState<Record<string, 1 | 2 | 3 | 4>>(
    {}
  );
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const [userSettings, setUserSettings] = useState<any>(null);

  // Add effect to track userSettings changes
  useEffect(() => {
    console.log('🎯 [UserSettings] State changed:', {
      hasSettings: !!userSettings,
      settingsKeys: userSettings ? Object.keys(userSettings) : null,
      fullSettings: userSettings,
    });
  }, [userSettings]);

  const { data: session } = useSession();
  // Try multiple possible userId field names
  const userId =
    session?.user?.id ||
    (session?.user as any)?._id ||
    (session?.user as any)?.userId;

  // Debug session data
  useEffect(() => {
    console.log('🔐 [Session Debug] Session status:', {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : null,
      hasUser: !!session?.user,
      userKeys: session?.user ? Object.keys(session.user) : null,
      userId: userId,
      userEmail: session?.user?.email,
      possibleUserIds: {
        id: session?.user?.id,
        _id: (session?.user as any)?._id,
        userId: (session?.user as any)?.userId,
      },
      fullSession: session,
      fullUser: session?.user,
    });
  }, [session, userId]);

  const {
    getUserFormSettingsByUserId,
    upsertUserFormSettings,
    loading: formsLoading,
  } = useForms();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const editingElement =
    elements.find((el) => el.id === editingElementId) || null;

  // Load user form settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      console.log(
        '🔍 [UserFormSettings] Starting to load settings for userId:',
        userId
      );

      if (userId) {
        try {
          console.log(
            '📡 [UserFormSettings] Calling getUserFormSettingsByUserId...'
          );
          const response = await getUserFormSettingsByUserId(userId);

          console.log('📦 [UserFormSettings] API Response:', {
            success: response.success,
            hasData: !!response.data,
            dataStructure: response.data ? Object.keys(response.data) : null,
          });

          if (response.success && response.data) {
            const settings = response.data.defaultFormSettings;

            console.log('⚙️ [UserFormSettings] Settings structure:', {
              hasAccess: !!settings.access,
              hasBehavior: !!settings.behavior,
              hasDistribution: !!settings.distribution,
              hasNotifications: !!settings.notifications,
              hasUI: !!settings.ui,
              hasBuilder: !!settings.builder,
            });

            console.log('🎨 [UserFormSettings] UI Settings:', settings.ui);
            console.log(
              '🛠️ [UserFormSettings] Builder Settings:',
              settings.builder
            );

            // Only save settings to state for JSON inclusion - DO NOT apply to UI
            setUserSettings(settings);
            console.log(
              '✅ [UserFormSettings] Settings saved to state (JSON only - not applied to builder UI)'
            );

            // NOTE: Settings are NOT applied to the form builder UI
            // They will only be included in the JSON output
            console.log(
              '📋 [UserFormSettings] Settings loaded for JSON output only (UI unchanged)'
            );
            toast.success('User settings loaded for JSON output');
          } else {
            console.log('⚠️ [UserFormSettings] No settings data received');
          }
        } catch (error) {
          console.error('❌ [UserFormSettings] Error loading settings:', error);
          console.log('No user settings found, using defaults');
        }
      } else {
        console.log(
          '👤 [UserFormSettings] No userId available, skipping settings load'
        );
      }
    };

    loadUserSettings();
  }, [userId, getUserFormSettingsByUserId]);

  // Load from localStorage on mount (client only) as fallback
  useEffect(() => {
    if (!userId) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsedElements = JSON.parse(stored) as FormElementType[];
          setElements(parsedElements);
        }
      } catch (e) {}
    }
  }, [userId]);

  // Add new effect to automatically add navigation buttons when wizard mode is toggled on
  useEffect(() => {
    if (wizardMode) {
      // Find if we already have any next or back buttons
      const hasNextButton = elements.some(
        (el) => el.type === 'button' && el.properties.buttonType === 'next'
      );

      if (!hasNextButton) {
        // Add a "Next" button if we don't have one
        const nextButton = generateElement('button');
        nextButton.properties.buttonType = 'next';
        nextButton.properties.buttonText = 'Next';
        nextButton.label = 'Next Button';

        // Add button at the end
        setElements([...elements, nextButton]);
      }
    }
  }, [wizardMode, elements]);

  // Effect to auto-switch to properties tab when an element is selected
  useEffect(() => {
    if (editingElementId) {
      setActiveTab('properties');
    }
  }, [editingElementId]);

  // Save elements to localStorage on change (fallback)
  useEffect(() => {
    if (!userId) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(elements));
      } catch (e) {}
    }
  }, [elements, userId]);

  // Memoized form state to prevent unnecessary re-renders
  const formState = useMemo(() => {
    const state = {
      elements,
      selectedStyle,
      wizardMode,
      columnSpans,
      userSettings, // Include user settings in form state
    };

    console.log('🔄 [FormState] State updated:', {
      elementsCount: elements.length,
      selectedStyle,
      wizardMode,
      columnSpansCount: Object.keys(columnSpans).length,
      hasUserSettings: !!userSettings,
      userSettingsKeys: userSettings ? Object.keys(userSettings) : null,
    });

    return state;
  }, [elements, selectedStyle, wizardMode, columnSpans, userSettings]);

  // Notify parent component of form state changes
  useEffect(() => {
    if (onFormStateChange) {
      console.log('📤 [FormState] Notifying parent component of state change');
      onFormStateChange(formState);
    }
  }, [formState, onFormStateChange]);

  // Save user settings to backend
  const saveUserSettings = async () => {
    if (userId) {
      try {
        const payload = {
          defaultFormSettings: {
            access: userSettings?.access || {
              type: 'public',
              requiresLogin: false,
              allowedRoles: [],
              submissionLimit: 0,
              allowMultipleSubmissions: true,
              allowAnonymous: true,
            },
            behavior: userSettings?.behavior || {
              autosave: true,
              saveDraft: false,
              allowResubmission: false,
              showProgressBar: wizardMode,
              timeoutInMinutes: 0,
            },
            distribution: userSettings?.distribution || {
              enablePublicUrl: true,
              enablePrivateUrl: false,
              enableHtmlEmbed: false,
              enableApiSubmission: false,
              enableJsEmbed: false,
            },
            notifications: userSettings?.notifications || {
              onSubmit: {
                sendToUser: false,
                sendToOwner: true,
                emailTemplateId: 'default',
                customEmails: [],
              },
              onFailure: {
                sendToOwner: false,
                emailTemplateId: 'error',
              },
            },
            ui: {
              theme: userSettings?.ui?.theme || 'light',
              layout: wizardMode
                ? 'multi-step'
                : userSettings?.ui?.layout || 'single-page',
              branding: userSettings?.ui?.branding || {
                logoUrl: '',
                primaryColor: '#3b82f6',
                backgroundColor: '#ffffff',
                fontFamily: 'Inter',
                customCss: '',
              },
              language: userSettings?.ui?.language || 'en',
              showFormTitle: userSettings?.ui?.showFormTitle ?? true,
              showFormDescription:
                userSettings?.ui?.showFormDescription ?? true,
            },
            builder: {
              selectedStyle,
              wizardMode,
              columnSpans,
              elements,
              formLayout: userSettings?.builder?.formLayout || {
                spacing: 'normal',
                labelPosition: 'top',
                buttonAlignment: 'left',
              },
              validation: userSettings?.builder?.validation || {
                showRequiredAsterisk: true,
                validateOnSubmit: true,
                validateOnBlur: false,
              },
            },
          },
        };

        const response = await upsertUserFormSettings(userId, payload);
        if (response.success) {
          setUserSettings(payload.defaultFormSettings);
          toast.success('User settings saved successfully');
        }
      } catch (error) {
        toast.error('Failed to save user settings');
      }
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type) {
      // This is a drag from the palette
    }
  };

  const handleDragOver = () => {
    // Handle drag over events if needed
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // If dragging from palette to the form area
    if (active.data.current?.type && over) {
      const type = active.data.current.type as ElementType;

      const newElement = generateElement(type);

      // If adding a button and wizard mode is on, default to "next" type
      if (type === 'button' && wizardMode) {
        newElement.properties.buttonType = 'next';
        newElement.properties.buttonText = 'Next';
      }

      setElements([...elements, newElement]);
      setEditingElementId(newElement.id);

      toast.success(`Added ${type} element`);
    }
  };

  const handleWizardModeToggle = (enabled: boolean) => {
    setWizardMode(enabled);

    if (enabled) {
      toast.info(
        'Wizard mode enabled. Multi-step form functionality activated.'
      );

      // Check if we already have navigation buttons
      const hasNextButton = elements.some(
        (el) => el.type === 'button' && el.properties.buttonType === 'next'
      );

      // If no next button exists, create one
      if (!hasNextButton) {
        const nextButton = generateElement('button');
        nextButton.properties.buttonType = 'next';
        nextButton.properties.buttonText = 'Next';
        nextButton.label = 'Next Button';

        setElements([...elements, nextButton]);
        toast.success('Added navigation button to start multi-step form');
      }
    }
  };

  const handleAddElement = (type: ElementType) => {
    const newElement = generateElement(type);

    // If adding a button and wizard mode is on, default to "next" type
    if (type === 'button' && wizardMode) {
      newElement.properties.buttonType = 'next';
      newElement.properties.buttonText = 'Next';
      newElement.label = 'Next Button';
    }

    setElements([...elements, newElement]);
    // Do NOT set editingElementId here, so tab does not switch
    toast.success(`Added ${type} element`);
  };

  const handleElementUpdate = (updatedElement: FormElementType) => {
    const newElements = elements.map((element) =>
      element.id === updatedElement.id ? updatedElement : element
    );
    setElements(newElements);
  };

  const handleElementsChange = (newElements: FormElementType[]) => {
    setElements(newElements);
  };

  const handleSaveForm = () => {
    console.log('💾 [SaveForm] Starting form save process...');
    console.log('💾 [SaveForm] Current userSettings state:', userSettings);

    // Create complete form JSON with user settings
    const completeFormData = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        elementsCount: elements.length,
        hasValidation: elements.some(
          (el) => el.properties.validation?.required
        ),
      },
      elements,
      style: selectedStyle,
      wizardMode,
      columnSpans,
      userSettings, // Include user settings in form output
    };

    console.log('📋 [SaveForm] Complete form data structure:', {
      hasMetadata: !!completeFormData.metadata,
      elementsCount: completeFormData.elements.length,
      style: completeFormData.style,
      wizardMode: completeFormData.wizardMode,
      columnSpansCount: Object.keys(completeFormData.columnSpans).length,
      hasUserSettings: !!completeFormData.userSettings,
      userSettingsStructure: completeFormData.userSettings
        ? {
            hasAccess: !!completeFormData.userSettings.access,
            hasBehavior: !!completeFormData.userSettings.behavior,
            hasDistribution: !!completeFormData.userSettings.distribution,
            hasNotifications: !!completeFormData.userSettings.notifications,
            hasUI: !!completeFormData.userSettings.ui,
            hasBuilder: !!completeFormData.userSettings.builder,
          }
        : null,
    });

    console.log(
      '🚀 [SaveForm] Complete form data with user settings:',
      JSON.stringify(completeFormData, null, 2)
    );
    toast.success('Form structure with settings logged to console');

    // Also save user settings
    if (userId) {
      console.log('💾 [SaveForm] Saving user settings to backend...');
      saveUserSettings();
    } else {
      console.log('👤 [SaveForm] No userId, skipping backend save');
    }
  };

  const handleClearForm = () => {
    if (
      window.confirm(
        'Are you sure you want to clear the form? This will remove all elements.'
      )
    ) {
      setElements([]);
      setEditingElementId(null);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {}
      toast.info('Form cleared');
    }
  };

  const handleExportForm = (format: 'json' | 'html') => {
    console.log('📤 [ExportForm] Starting export process, format:', format);

    if (format === 'json') {
      console.log(
        '📤 [ExportForm] Current userSettings for export:',
        userSettings
      );

      // Export complete form data including user settings
      const completeFormData = {
        metadata: {
          createdAt: new Date().toISOString(),
          version: '1.0.0',
          elementsCount: elements.length,
          hasValidation: elements.some(
            (el) => el.properties.validation?.required
          ),
        },
        elements,
        style: selectedStyle,
        wizardMode,
        columnSpans,
        userSettings, // Include user settings in export
      };

      console.log('📋 [ExportForm] Export data structure:', {
        hasMetadata: !!completeFormData.metadata,
        elementsCount: completeFormData.elements.length,
        hasUserSettings: !!completeFormData.userSettings,
        userSettingsKeys: completeFormData.userSettings
          ? Object.keys(completeFormData.userSettings)
          : null,
      });

      const dataStr = JSON.stringify(completeFormData, null, 2);
      console.log('📄 [ExportForm] JSON string length:', dataStr.length);

      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileName = 'complete-form-with-settings.json';
      console.log('💾 [ExportForm] Downloading file:', exportFileName);

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();

      toast.success('Complete form JSON with settings exported successfully');
    } else {
      console.log('🚧 [ExportForm] HTML export not yet implemented');
      toast.info('HTML export functionality coming soon');
    }
  };

  const handleDuplicateElement = (elementId: string) => {
    const elementToDuplicate = elements.find((el) => el.id === elementId);
    if (elementToDuplicate) {
      const duplicatedElement = {
        ...elementToDuplicate,
        id: generateElement(elementToDuplicate.type).id,
        label: `${elementToDuplicate.label} (Copy)`,
      };
      setElements([...elements, duplicatedElement]);
      setEditingElementId(duplicatedElement.id);
      toast.success(`Duplicated ${elementToDuplicate.type} element`);
    }
  };

  const handleElementEdit = (id: string | null) => {
    setEditingElementId(id);
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    // If the click is directly on the canvas (not an element), clear element selection
    if (
      (event.target as HTMLElement).classList.contains('canvas-grid') ||
      (event.target as HTMLElement).classList.contains('form-structure-canvas')
    ) {
      setEditingElementId(null);
      if (activeTab === 'properties') {
        setActiveTab('preview');
      }
    }
  };

  const handleTabChange = (tab: 'preview' | 'json' | 'properties') => {
    setActiveTab(tab);
    // If switching to properties tab but no element is selected, maintain the current tab
    if (tab === 'properties' && !editingElementId) {
      setActiveTab('preview');
      toast.info('Select an element to edit its properties');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Book Pages Container */}
      <div className="relative z-0 flex gap-4">
        {/* Left Page - Form Builder */}
        <div className="relative flex-1 -rotate-1 transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-transform duration-300 hover:rotate-0 dark:border-white dark:bg-slate-900">
          {/* Page Header */}
          <div className="rounded-t-xl border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
              <span className="h-3 w-3 rounded-full bg-red-500"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
              <span className="h-3 w-3 rounded-full bg-green-500"></span>
              Form Builder
              {formsLoading && (
                <span className="text-sm text-blue-600">
                  Loading settings...
                </span>
              )}
              {userSettings && (
                <span className="text-xs text-green-600">
                  ✅ User settings loaded for JSON output
                </span>
              )}
            </h2>
          </div>

          {/* Form Builder Header */}
          <FormBuilderHeader
            wizardMode={wizardMode}
            onWizardModeToggle={handleWizardModeToggle}
            onSaveForm={handleSaveForm}
            onClearForm={handleClearForm}
            onExportForm={handleExportForm}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onAddElement={handleAddElement}
          />

          {/* Form Builder Content */}
          <div className="h-[calc(100vh-280px)] p-4">
            <div
              className="form-structure-canvas h-full"
              onClick={handleCanvasClick}
            >
              <div className="mb-3">
                <h3 className="text-lg font-semibold dark:text-white">
                  Form Structure
                </h3>
              </div>
              <div className="halo-grid h-[calc(100%-60px)] overflow-auto">
                <div className="canvas-grid rounded-md">
                  <FormElementsList
                    elements={elements}
                    onElementsChange={handleElementsChange}
                    editingElementId={editingElementId}
                    onEditElement={handleElementEdit}
                    onDuplicateElement={handleDuplicateElement}
                    columnSpans={columnSpans}
                    onColumnSpansChange={setColumnSpans}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Page - Preview */}
        <div className="relative flex-1 rotate-1 transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-transform duration-300 hover:rotate-0 dark:border-white dark:bg-slate-900">
          {/* Page Header */}
          <div className="rounded-t-xl border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-200">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <span className="h-3 w-3 rounded-full bg-purple-500"></span>
              <span className="h-3 w-3 rounded-full bg-pink-500"></span>
              Live Form Preview
            </h2>
          </div>

          {/* Preview Content */}
          <div className="h-[calc(100vh-200px)]">
            <FormPreviewPanel
              elements={elements}
              onSave={handleSaveForm}
              activeTab={activeTab}
              editingElement={editingElement}
              onElementUpdate={handleElementUpdate}
              wizardMode={wizardMode}
              columnSpans={columnSpans}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
            />
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default FormBuilderWithPreview;
