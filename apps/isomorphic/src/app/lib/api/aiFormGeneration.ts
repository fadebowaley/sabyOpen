export const generateAIForm = async (payload: {
  prompt: string;
  industry?: string;
}) => {
  const response = await fetch('/api/ai/generate-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || !result?.success || !result?.formStructure) {
    throw new Error(result?.message || 'Failed to generate form');
  }

  return result.formStructure;
};

export const streamAIFormGeneration = async (
  payload: { prompt: string; industry?: string },
  onChunk: (content: string) => void
) => {
  const response = await fetch('/api/ai/generate-form/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.message || 'Failed to stream generation');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response stream');
  }

  let buffer = '';
  let finalForm: { elements: any[]; metadata: any } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      try {
        const chunk = JSON.parse(data);
        if (chunk?.content) {
          onChunk(chunk.content);
        }
        if (chunk?.type === 'complete' && chunk?.formStructure) {
          finalForm = chunk.formStructure;
        }
      } catch {
        // Ignore malformed chunks
      }
    }
  }

  if (!finalForm) {
    throw new Error('No form data received');
  }

  return finalForm;
};

