import { z } from 'zod';
import { messages } from '@/config/messages';

// form zod validation schema
export const createNodeSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, messages.nodeNameIsRequired),
  level: z.string().min(1, messages.nodeLevelIsRequired),
  structure: z.string().min(1, 'Structure is required'),
  parent: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  dateOfEstablishment: z.string().optional(),
  isMain: z.boolean().optional(),
  users: z.array(z.string()).optional(),
});

// generate form types from zod validation schema
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
