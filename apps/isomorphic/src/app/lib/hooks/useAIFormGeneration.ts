import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FormElementType } from '@haloform/types/form-builder';

export interface GenerationOptions {
  industry?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  additionalContext?: string;
}

export interface GeneratedForm {
  elements: FormElementType[];
  metadata?: {
    generatedBy: string;
    timestamp: string;
    context?: GenerationOptions;
    tokensUsed?: number;
    title?: string;
    description?: string;
    industry?: string;
    model?: string;
    elementsCount?: number;
    hasValidation?: boolean;
    wizardMode?: boolean;
    workflow?: Record<string, any>;
    payment?: Record<string, any>;
    paymentConfig?: Record<string, any>;
  };
}

export interface StreamChunk {
  type: 'thinking' | 'generating' | 'complete' | 'error';
  content: string;
  formStructure?: GeneratedForm;
}

interface UseAIFormGenerationReturn {
  generating: boolean;
  error: string | null;
  generateForm: (prompt: string, options?: GenerationOptions) => Promise<GeneratedForm | null>;
  streamGeneration: (prompt: string, options: GenerationOptions, onChunk: (chunk: StreamChunk) => void) => Promise<GeneratedForm | null>;
  validateFormStructure: (structure: any) => boolean;
}

export function useAIFormGeneration(): UseAIFormGenerationReturn {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFormStructure = useCallback((structure: any): boolean => {
    try {
      // Check if structure has elements array
      if (!structure || !Array.isArray(structure.elements)) {
        console.error('❌ [Validation] No elements array found');
        return false;
      }

      // Validate each element
      for (const element of structure.elements) {
        if (!element.id || !element.type || !element.properties) {
          console.error('❌ [Validation] Invalid element structure:', element);
          return false;
        }

        // Check required properties based on type
        if (!element.label && element.type !== 'button') {
          console.warn('⚠️ [Validation] Element missing label:', element.id);
        }
      }

      console.log('✅ [Validation] Form structure valid');
      return true;
      
    } catch (err) {
      console.error('❌ [Validation] Validation error:', err);
      return false;
    }
  }, []);

  const generateForm = useCallback(async (
    prompt: string, 
    options: GenerationOptions = {}
  ): Promise<GeneratedForm | null> => {
    setGenerating(true);
    setError(null);

    try {
      console.log('🤖 [AI Generate] Starting generation:', { prompt, options });

      const response = await fetch('/api/ai/generate-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          industry: options.industry,
          complexity: options.complexity || 'medium',
          additionalContext: options.additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [AI Generate] Generation complete:', result);

      if (result.success && result.formStructure) {
        // Validate the generated structure
        if (!validateFormStructure(result.formStructure)) {
          throw new Error('Generated form structure is invalid');
        }

        toast.success('Form generated successfully!');
        return result.formStructure;
      } else {
        throw new Error(result.message || 'Failed to generate form');
      }

    } catch (err: any) {
      console.error('❌ [AI Generate] Error:', err);
      setError(err.message || 'Failed to generate form');
      toast.error(err.message || 'Failed to generate form');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [validateFormStructure]);

  const streamGeneration = useCallback(async (
    prompt: string,
    options: GenerationOptions,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<GeneratedForm | null> => {
    setGenerating(true);
    setError(null);

    try {
      console.log('🌊 [AI Stream] Starting streaming generation:', { prompt, options });

      const response = await fetch('/api/ai/generate-form/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          industry: options.industry,
          complexity: options.complexity || 'medium',
          additionalContext: options.additionalContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let generatedForm: GeneratedForm | null = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const chunk: StreamChunk = data;
              
              onChunk(chunk);

              if (chunk.type === 'complete' && chunk.formStructure) {
                generatedForm = chunk.formStructure;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      if (generatedForm && validateFormStructure(generatedForm)) {
        toast.success('Form generated successfully!');
        return generatedForm;
      } else {
        throw new Error('Invalid form structure received');
      }

    } catch (err: any) {
      console.error('❌ [AI Stream] Error:', err);
      setError(err.message || 'Failed to stream generation');
      toast.error(err.message || 'Failed to generate form');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [validateFormStructure]);

  return {
    generating,
    error,
    generateForm,
    streamGeneration,
    validateFormStructure,
  };
}

// AI Form Generation Service (for direct use without hook)
export class AIFormGenerator {
  private static readonly API_ENDPOINT = '/api/ai/generate-form';

  static async generateForm(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedForm> {
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate form');
    }

    const result = await response.json();
    
    if (!result.success || !result.formStructure) {
      throw new Error(result.message || 'Invalid response from AI');
    }

    return result.formStructure;
  }

  static validateElements(elements: any[]): boolean {
    if (!Array.isArray(elements)) return false;

    return elements.every(element => 
      element.id && 
      element.type && 
      element.properties &&
      typeof element.properties === 'object'
    );
  }
}
