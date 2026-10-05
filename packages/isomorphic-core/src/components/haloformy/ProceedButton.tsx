'use client';
import React, { useState } from 'react';
import { Button } from '@haloform/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FormElementType } from '@haloform/types/form-builder';
import { useProjectForms } from '@/app/lib/hooks/useProjectForms';
import { ProjectFormData } from '@/app/lib/api/projectForms';
import ProjectConfigurationModal from './ProjectConfigurationModal';

interface ProceedButtonProps {
  elements: FormElementType[];
  selectedStyle: string;
  wizardMode: boolean;
  columnSpans: Record<string, number>;
  userSettings?: any; // Include user settings
}

const ProceedButton = ({
  elements,
  selectedStyle,
  wizardMode,
  columnSpans,
  userSettings,
}: ProceedButtonProps) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { createProjectForm, loading } = useProjectForms();

  const handleProceed = () => {
    if (elements.length === 0) {
      toast.error(
        'Please add at least one element to your form before proceeding'
      );
      return;
    }

    setShowConfigModal(true);
  };

  const handleFormSubmit = async (config: any) => {
    try {
      console.log(
        '🎯 [ProceedButton] ========== RECEIVED CONFIG FROM MODAL =========='
      );
      console.log(
        '🎯 [ProceedButton] Config from modal:',
        JSON.stringify(config, null, 2)
      );
      console.log(
        '🎯 [ProceedButton] Elements available:',
        elements?.length || 0
      );
      console.log(
        '🎯 [ProceedButton] User settings available:',
        !!userSettings
      );
      console.log(
        '🎯 [ProceedButton] ===================================================='
      );

      // Clean and validate accessibility array
      const validAccessibilityOptions = [
        'api',
        'embedded',
        'javascript',
        'mobile',
      ];
      const cleanAccessibility = (config.accessibility || []).filter(
        (item: string) => validAccessibilityOptions.includes(item)
      );

      // Create completely clean project data
      const projectData: ProjectFormData = {
        configuration: {
          projectName: config.projectName.trim(),
          tags: config.tags || [],
          accessibility: cleanAccessibility,
          security: config.security || 'private',
        },
        elements: elements.map((element) => {
          // Preserve elements EXACTLY as they exist in the form builder
          // No cleaning, no modification - this ensures perfect import/export compatibility
          console.log(
            `🔍 [Element ${element.id}] Preserving original element:`,
            {
              id: element.id,
              type: element.type,
              label: element.label,
              propertiesCount: Object.keys(element.properties).length,
              originalElement: element,
            }
          );

          // Return the element structure exactly as it exists in the form builder
          // No position property - preserving pure form builder structure
          const preservedProperties = { ...element.properties };

          // Ensure label is preserved in properties if it exists at element level
          if (element.label && element.label.trim()) {
            preservedProperties.label = element.label;
          }

          return {
            id: element.id,
            type: element.type,
            properties: preservedProperties, // Preserve ALL properties including label
            // No position property - keeping pure form builder JSON structure
          };
        }) as any, // Cast to bypass backend type requirement for position
        style: selectedStyle || 'default',
        wizardMode: wizardMode || false,
        columnSpans: columnSpans || {},
        userSettings: {
          // Only include the exact fields allowed by backend validation
          access: {
            allowedRoles: userSettings?.access?.allowedRoles || [],
            allowedUsers: userSettings?.access?.allowedUsers || [],
            restrictByLocation:
              userSettings?.access?.restrictByLocation || false,
            allowedCountries: userSettings?.access?.allowedCountries || [],
          },
          behavior: {
            allowMultipleSubmissions:
              userSettings?.behavior?.allowMultipleSubmissions !== undefined
                ? userSettings.behavior.allowMultipleSubmissions
                : true,
            enableProgressSave:
              userSettings?.behavior?.enableProgressSave !== undefined
                ? userSettings.behavior.enableProgressSave
                : true,
            autoSave: userSettings?.behavior?.autoSave || false,
            submitOnComplete:
              userSettings?.behavior?.submitOnComplete !== undefined
                ? userSettings.behavior.submitOnComplete
                : true,
          },
          distribution: {
            enableSharing:
              userSettings?.distribution?.enableSharing !== undefined
                ? userSettings.distribution.enableSharing
                : true,
            allowEmbedding: userSettings?.distribution?.allowEmbedding || false,
            generateQR: userSettings?.distribution?.generateQR || false,
            enableDeepLinking:
              userSettings?.distribution?.enableDeepLinking || false,
          },
          notifications: {
            emailOnSubmission:
              userSettings?.notifications?.emailOnSubmission || false,
            notifyOwner:
              userSettings?.notifications?.notifyOwner !== undefined
                ? userSettings.notifications.notifyOwner
                : true,
            customEmails: userSettings?.notifications?.customEmails || [],
            smsNotifications:
              userSettings?.notifications?.smsNotifications || false,
          },
          ui: {
            theme: userSettings?.ui?.theme || 'default',
            primaryColor: userSettings?.ui?.primaryColor || '#3b82f6',
            layout: userSettings?.ui?.layout || 'single',
            showProgressBar:
              userSettings?.ui?.showProgressBar !== undefined
                ? userSettings.ui.showProgressBar
                : true,
          },
          builder: {
            gridSize: userSettings?.builder?.gridSize || 12,
            snapToGrid:
              userSettings?.builder?.snapToGrid !== undefined
                ? userSettings.builder.snapToGrid
                : true,
            showGridLines: userSettings?.builder?.showGridLines || false,
            autoArrange: userSettings?.builder?.autoArrange || false,
          },
        },
        metadata: {
          version: '1.0.0',
          elementsCount: elements.length,
          hasValidation: elements.some(
            (el) => el.properties.validation?.required
          ),
          deploymentStatus: 'draft',
        },
      };

      // Log original elements being preserved (no processing/cleaning)
      console.log(
        '🔍 [ProceedButton] ========== ORIGINAL ELEMENTS PRESERVED =========='
      );
      elements.forEach((element, index) => {
        console.log(`📝 Element ${index + 1} (${element.type}):`, {
          id: element.id,
          type: element.type,
          label: element.label,
          propertiesCount: Object.keys(element.properties).length,
          propertyKeys: Object.keys(element.properties),
          completeElement: element, // Log the complete original element
        });
      });
      console.log(
        '🔍 [ProceedButton] ================================================'
      );

      // Log the final elements being sent (preserved originals with minimal position)
      if (projectData.elements && projectData.elements.length > 0) {
        console.log(
          '📋 [ProceedButton] Final elements for backend (preserved originals):'
        );
        projectData.elements.forEach((element, index) => {
          console.log(`Final Element ${index + 1}:`, {
            id: element.id,
            type: element.type,
            propertiesCount: Object.keys(element.properties).length,
            preservedProperties: element.properties,
          });
        });
      } else {
        console.log('📋 [ProceedButton] No elements to log');
      }

      // Calculate total properties being preserved
      const totalPropertiesPreserved =
        projectData.elements?.reduce((total, element) => {
          return total + Object.keys(element.properties).length;
        }, 0) || 0;

      // Log the complete form data being sent
      console.log(
        '🚀 [ProceedButton] ========== FINAL PROJECT DATA TO BACKEND =========='
      );
      console.log(
        '✅ [ProceedButton] PRESERVING: Elements saved exactly as created for perfect import compatibility!'
      );
      console.log(
        `📊 [ProceedButton] Total elements: ${projectData.elements?.length || 0}`
      );
      console.log(
        `📊 [ProceedButton] Total properties preserved: ${totalPropertiesPreserved}`
      );
      console.log('🚀 [ProceedButton] Complete project data:');
      console.log(JSON.stringify(projectData, null, 2));
      console.log(
        '🚀 [ProceedButton] ======================================================='
      );

      // Use the hook to create the project
      console.log('📡 [ProceedButton] Calling createProjectForm API...');
      const response = await createProjectForm(projectData);

      console.log(
        '📥 [ProceedButton] API Response received:',
        JSON.stringify(response, null, 2)
      );

      if (response.success) {
        const projectId =
          response.data?.formId || response.data?.projectForm?.projectId;
        console.log(
          '✅ [ProceedButton] Project created successfully with ID:',
          projectId
        );
        toast.success(`Project created successfully! ID: ${projectId}`);

        // You can add navigation logic here if needed
        // router.push(`/projects/${projectId}`);

        // Close the modal
        setShowConfigModal(false);
      } else {
        // Error handling is already done in the hook with toast.error
        console.error(
          '❌ [ProceedButton] Failed to create project:',
          response.error
        );
      }
    } catch (error) {
      console.error(
        '❌ [ProceedButton] Exception during project creation:',
        error
      );
      toast.error('Failed to create project. Please try again.');
    }
  };

  return (
    <>
      <Button
        onClick={handleProceed}
        disabled={loading || elements.length === 0}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Project...
          </>
        ) : (
          <>
            Create Project
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <ProjectConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSubmit={handleFormSubmit}
        elements={elements}
        selectedStyle={selectedStyle}
        wizardMode={wizardMode}
        columnSpans={columnSpans}
        userSettings={userSettings}
      />
    </>
  );
};

export default ProceedButton;
