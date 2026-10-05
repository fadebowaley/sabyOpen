'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { FormElementType } from '@haloform/types/form-builder';
import { Button } from '@haloform/ui/button';
import { Input } from '@haloform/ui/input';
import { Label } from '@haloform/ui/label';
import { Badge } from '@haloform/ui/badge';
import { Separator } from '@haloform/ui/separator';
import { Switch } from '@haloform/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@haloform/ui/dialog';

import {
  FileText,
  Tags as TagsIcon,
  Globe,
  Code,
  Smartphone,
  Lock,
  Unlock,
  Settings,
  Save,
  Check,
  Shield,
  Zap,
  Database,
  Users,
  BarChart,
  MessageCircle,
  Briefcase,
  HeartHandshake,
  ShoppingCart,
  Truck,
  Home,
  DollarSign,
  BookOpen,
  Calendar,
  Mail,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';

interface ProjectConfigurationData {
  projectName: string;
  tags: string[];
  accessibility: string[];
  security: 'public' | 'private';
}

interface ProjectConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: ProjectConfigurationData) => Promise<void>;
  elements: FormElementType[];
  selectedStyle: string;
  wizardMode: boolean;
  columnSpans: Record<string, number>;
  userSettings?: any;
}

const AVAILABLE_TAGS = [
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    darkColor: 'bg-blue-600',
  },
  {
    id: 'financials',
    label: 'Financials',
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    darkColor: 'bg-emerald-600',
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    darkColor: 'bg-purple-600',
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Settings,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    darkColor: 'bg-orange-600',
  },
  {
    id: 'hr',
    label: 'HR',
    icon: HeartHandshake,
    color: 'bg-pink-50 text-pink-700 border-pink-200',
    darkColor: 'bg-pink-600',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Zap,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    darkColor: 'bg-indigo-600',
  },
  {
    id: 'support',
    label: 'Support',
    icon: MessageCircle,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    darkColor: 'bg-yellow-600',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart,
    color: 'bg-red-50 text-red-700 border-red-200',
    darkColor: 'bg-red-600',
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: Truck,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    darkColor: 'bg-gray-600',
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: Shield,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    darkColor: 'bg-slate-600',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    icon: Home,
    color: 'bg-green-50 text-green-700 border-green-200',
    darkColor: 'bg-green-600',
  },
  {
    id: 'education',
    label: 'Education',
    icon: BookOpen,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    darkColor: 'bg-cyan-600',
  },
  {
    id: 'events',
    label: 'Events',
    icon: Calendar,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    darkColor: 'bg-violet-600',
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: Mail,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    darkColor: 'bg-rose-600',
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    darkColor: 'bg-amber-600',
  },
  {
    id: 'database',
    label: 'Database',
    icon: Database,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    darkColor: 'bg-teal-600',
  },
];

const ACCESSIBILITY_OPTIONS = [
  {
    id: 'api',
    label: 'API Access',
    description: 'REST API integration',
    icon: Code,
    color: 'bg-blue-50 border-blue-200',
    activeColor: 'bg-blue-500',
  },
  {
    id: 'embedded',
    label: 'HTML Embed',
    description: 'Website embedding',
    icon: Globe,
    color: 'bg-green-50 border-green-200',
    activeColor: 'bg-green-500',
  },
  {
    id: 'javascript',
    label: 'JavaScript SDK',
    description: 'JS integration',
    icon: FileText,
    color: 'bg-purple-50 border-purple-200',
    activeColor: 'bg-purple-500',
  },
  {
    id: 'mobile',
    label: 'Mobile App',
    description: 'Mobile optimized',
    icon: Smartphone,
    color: 'bg-orange-50 border-orange-200',
    activeColor: 'bg-orange-500',
  },
];

const ProjectConfigurationModal: React.FC<ProjectConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  elements,
  selectedStyle,
  wizardMode,
  columnSpans,
  userSettings,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectConfigurationData>({
    projectName: '',
    tags: [],
    accessibility: [],
    security: 'public',
  });

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const handleAccessibilityToggle = (optionId: string) => {
    setFormData((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(optionId)
        ? prev.accessibility.filter((id) => id !== optionId)
        : [...prev.accessibility, optionId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    if (formData.tags.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    if (formData.accessibility.length === 0) {
      toast.error('Please select at least one access method');
      return;
    }

    setIsSubmitting(true);

    try {
      // Log all the available data before submission
      console.log(
        '📝 [ProjectConfig] ========== COMPLETE PROJECT DATA =========='
      );
      console.log(
        '📝 [ProjectConfig] Configuration data:',
        JSON.stringify(formData, null, 2)
      );
      console.log(
        '📝 [ProjectConfig] Form elements count:',
        elements?.length || 0
      );
      console.log('📝 [ProjectConfig] Selected style:', selectedStyle);
      console.log('📝 [ProjectConfig] Wizard mode:', wizardMode);
      console.log(
        '📝 [ProjectConfig] Column spans:',
        JSON.stringify(columnSpans, null, 2)
      );
      console.log(
        '📝 [ProjectConfig] User settings:',
        JSON.stringify(userSettings, null, 2)
      );

      // Create complete project data structure
      const completeProjectData = {
        configuration: {
          projectName: formData.projectName.trim(),
          tags: formData.tags,
          accessibility: formData.accessibility,
          security: formData.security,
        },
        elements: elements || [],
        style: selectedStyle || 'default',
        wizardMode: wizardMode || false,
        columnSpans: columnSpans || {},
        userSettings: userSettings || {},
        metadata: {
          version: '1.0.0',
          elementsCount: elements?.length || 0,
          hasValidation:
            elements?.some((el) => el.properties?.validation?.required) ||
            false,
          deploymentStatus: 'draft' as const,
          createdAt: new Date().toISOString(),
        },
      };

      console.log(
        '📦 [ProjectConfig] Complete project data being sent:',
        JSON.stringify(completeProjectData, null, 2)
      );
      console.log(
        '📝 [ProjectConfig] ============================================='
      );

      await onSubmit(formData);
      toast.success('Project created successfully!');
      onClose();

      // Reset form data
      setFormData({
        projectName: '',
        tags: [],
        accessibility: [],
        security: 'public',
      });
    } catch (error) {
      console.error('❌ [ProjectConfig] Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTagsData = AVAILABLE_TAGS.filter((tag) =>
    formData.tags.includes(tag.id)
  );

  const removeTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((id) => id !== tagId),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="my-8 max-h-[80vh] max-w-2xl overflow-y-auto border-0 bg-gradient-to-br from-white to-gray-50/30 shadow-2xl">
        <DialogHeader className="border-b border-gray-100 pb-6">
          <DialogTitle className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            Project Configuration
          </DialogTitle>
          <p className="mt-2 text-sm text-gray-600">
            Configure your project settings with beautiful customization
          </p>
        </DialogHeader>

        <div className="space-y-8 py-2">
          {/* Project Name Section */}
          <div className="space-y-3">
            <Label
              htmlFor="projectName"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <div className="rounded-lg bg-blue-100 p-1">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              Project Name *
            </Label>
            <Input
              id="projectName"
              placeholder="Enter your amazing project name..."
              value={formData.projectName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  projectName: e.target.value,
                }))
              }
              className="h-11 border-gray-200 bg-white shadow-sm transition-all duration-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          {/* Categories Section - Multi-Select Dropdown */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="rounded-lg bg-purple-100 p-1">
                <TagsIcon className="h-4 w-4 text-purple-600" />
              </div>
              Categories *
            </Label>

            {/* Custom Multi-Select Dropdown */}
            <div className="relative">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex min-h-[2.75rem] w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-400 focus:ring-blue-400"
              >
                <div className="flex items-center gap-2">
                  <TagsIcon className="h-4 w-4 text-gray-400" />
                  <span
                    className={
                      formData.tags.length > 0
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }
                  >
                    {formData.tags.length > 0
                      ? `${formData.tags.length} categories selected`
                      : 'Select categories...'}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Dropdown Content */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {AVAILABLE_TAGS.map((tag) => (
                      <div
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`flex cursor-pointer items-center gap-2 rounded-md p-2 transition-all duration-200 ${
                          formData.tags.includes(tag.id)
                            ? `${tag.color} border`
                            : 'border border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`rounded p-1 ${formData.tags.includes(tag.id) ? tag.darkColor + ' text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          <tag.icon className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium">{tag.label}</span>
                        {formData.tags.includes(tag.id) && (
                          <Check className="ml-auto h-3 w-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Tags Display */}
            {selectedTagsData.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                {selectedTagsData.map((tag) => (
                  <Badge
                    key={tag.id}
                    className={`${tag.color} flex items-center gap-2 border px-3 py-1 text-xs transition-all duration-200 hover:shadow-sm`}
                  >
                    <tag.icon className="h-3 w-3" />
                    {tag.label}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag.id);
                      }}
                      className="ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Access Methods Section - List with Toggle Switches */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="rounded-lg bg-green-100 p-1">
                <Globe className="h-4 w-4 text-green-600" />
              </div>
              Access Methods *
            </Label>

            <div className="space-y-3">
              {ACCESSIBILITY_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <option.icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={formData.accessibility.includes(option.id)}
                    onCheckedChange={() => handleAccessibilityToggle(option.id)}
                    className="border-2 data-[state=unchecked]:border-black data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-black"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Security Section - Enhanced Switch */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <div className="rounded-lg bg-orange-100 p-1">
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              Security & Access
            </Label>

            <div
              className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                formData.security === 'public'
                  ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50'
                  : 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      formData.security === 'public'
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}
                  >
                    {formData.security === 'public' ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formData.security === 'public'
                        ? 'Public Access'
                        : 'Private Access'}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {formData.security === 'public'
                        ? 'Anyone with the link can access this project'
                        : 'Authentication required to access this project'}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.security === 'public'}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      security: checked ? 'public' : 'private',
                    }))
                  }
                  className="border-2 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-gray-300 text-gray-700 transition-all duration-200 hover:bg-gray-50"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.projectName.trim()}
            className="bg-blue-600 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectConfigurationModal;
