import { Node } from '@/app/lib/api/node';

export type NodeMutationPayload =
  | {
      type: 'upsert';
      nodes: Node[];
      touchedNodeIds?: string[];
      reason?: string;
    }
  | {
      type: 'remove';
      nodeIds: string[];
      touchedNodeIds?: string[];
      reason?: string;
    }
  | {
      type: 'refresh';
      nodeIds?: string[];
      reason?: string;
    };

type Listener = (payload: NodeMutationPayload) => void;

const listeners = new Set<Listener>();

export function emitNodeMutation(payload: NodeMutationPayload) {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.error('[NODE MUTATION BUS] Listener error:', error);
    }
  });
}

export function subscribeToNodeMutations(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

