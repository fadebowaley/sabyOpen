export interface ProjectCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  accentColor: string;
  projectFormId?: string;
  projectId?: string;
  workspaceId?: string;
  status?: string;
  referenceType?: 'project_form';
  responseCount?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
}
