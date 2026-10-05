'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { DraftOperation, ModuleDraftV2 } from './contracts';
import {
  createEmptyDraft,
  initialModuleDraftHistoryState,
  moduleDraftReducer,
} from './moduleDraft.reducer';
import { evaluateDraftReadiness } from './moduleDraft.validators';

type ModuleDraftContextValue = {
  draft: ModuleDraftV2 | null;
  canUndo: boolean;
  canRedo: boolean;
  readiness: ReturnType<typeof evaluateDraftReadiness> | null;
  initialize: (seed?: Partial<ModuleDraftV2>) => void;
  applyOperation: (operation: DraftOperation) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
};

const ModuleDraftContext = createContext<ModuleDraftContextValue | null>(null);

const getStorageKey = (tenantId?: string, userId?: string) =>
  `saby:module-draft-v2:${tenantId || 'tenant'}:${userId || 'user'}`;

type ModuleDraftProviderProps = {
  children: React.ReactNode;
  tenantId?: string;
  userId?: string;
};

export const ModuleDraftProvider = ({
  children,
  tenantId,
  userId,
}: ModuleDraftProviderProps) => {
  const [state, dispatch] = useReducer(
    moduleDraftReducer,
    initialModuleDraftHistoryState
  );

  const storageKey = useMemo(() => getStorageKey(tenantId, userId), [tenantId, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ModuleDraftV2;
      if (!parsed || parsed.version !== 2) return;
      dispatch({ type: 'initialize', draft: parsed });
    } catch {
      // ignore invalid storage payload
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!state.present) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state.present));
  }, [state.present, storageKey]);

  const contextValue = useMemo<ModuleDraftContextValue>(
    () => ({
      draft: state.present,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      readiness: state.present ? evaluateDraftReadiness(state.present) : null,
      initialize: (seed) =>
        dispatch({
          type: 'initialize',
          draft: createEmptyDraft(seed),
        }),
      applyOperation: (operation) =>
        dispatch({
          type: 'apply_operation',
          operation,
        }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state.future.length, state.past.length, state.present]
  );

  return (
    <ModuleDraftContext.Provider value={contextValue}>
      {children}
    </ModuleDraftContext.Provider>
  );
};

export const useModuleDraftStore = () => {
  const ctx = useContext(ModuleDraftContext);
  if (!ctx) {
    throw new Error('useModuleDraftStore must be used within ModuleDraftProvider');
  }
  return ctx;
};

