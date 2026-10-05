export const BACKEND_PERMISSIONS = {
  projectForm: {
    view: 'view:project-form',
    create: 'create:project-form',
    update: 'update:project-form',
    delete: 'delete:project-form',
  },
  submission: {
    create: 'submission:create',
    read: 'submission:read',
    update: 'submission:update',
    delete: 'submission:delete',
    manage: 'submission:manage',
  },
  report: {
    read: 'report:read',
  },
  export: {
    read: 'export:read',
  },
  analytics: {
    read: 'analytics:read',
  },
  validation: {
    read: 'validation:read',
  },
  storage: {
    read: 'storage:read',
    viewFile: 'view:storage:file',
    updateFile: 'update:storage:file',
    deleteFile: 'delete:storage:file',
    shareFile: 'share:storage:file',
    viewFolder: 'view:storage:folder',
    updateFolder: 'update:storage:folder',
    deleteFolder: 'delete:storage:folder',
    shareFolder: 'share:storage:folder',
  },
  user: {
    read: 'user:read',
    create: 'user:create',
    update: 'user:update',
    delete: 'user:delete',
    assign: 'user:assign',
    restore: 'user:restore',
    import: 'user:import',
    manage: 'user:manage',
  },
  role: {
    read: 'role:read',
    create: 'role:create',
    update: 'role:update',
    delete: 'role:delete',
    permissions: 'role:permissions',
  },
  permission: {
    read: 'permissions:read',
    create: 'permissions:create',
    update: 'permissions:update',
    delete: 'permissions:delete',
  },
  apiKey: {
    read: 'apikey:read',
    create: 'apikey:create',
    update: 'apikey:update',
    delete: 'apikey:delete',
    regenerate: 'apikey:regenerate',
  },
  node: {
    read: 'node:read',
    create: 'node:create',
    update: 'node:update',
    delete: 'node:delete',
    move: 'node:move',
    activate: 'node:activate',
    deactivate: 'node:deactivate',
    import: 'node:import',
    manage: 'node:manage',
  },
  level: {
    read: 'level:read',
    create: 'level:create',
    update: 'level:update',
    delete: 'level:delete',
  },
  structure: {
    read: 'structures:read',
    create: 'structures:create',
    update: 'structures:update',
    delete: 'structures:delete',
  },
  calendar: {
    read: 'calendar:read',
    manage: 'calendar:manage',
  },
  baselineIntelligence: {
    read: 'baselineintelligence:read',
    create: 'baselineintelligence:create',
  },
  payment: {
    read: 'payment:read',
    create: 'payment:create',
    update: 'payment:update',
    delete: 'payment:delete',
  },
  collection: {
    read: 'collection:read',
    create: 'collection:create',
    update: 'collection:update',
    delete: 'collection:delete',
  },
  statement: {
    read: 'statement:read',
    create: 'statement:create',
    update: 'statement:update',
    delete: 'statement:delete',
  },
  setting: {
    read: 'setting:read',
    create: 'setting:create',
    update: 'setting:update',
    delete: 'setting:delete',
  },
} as const;

export const LEGACY_PERMISSION_ALIASES: Record<string, string> = {
  'projectform:read': BACKEND_PERMISSIONS.projectForm.view,
  'projectform:create': BACKEND_PERMISSIONS.projectForm.create,
  'projectform:update': BACKEND_PERMISSIONS.projectForm.update,
  'projectform:delete': BACKEND_PERMISSIONS.projectForm.delete,
  'permission:read': BACKEND_PERMISSIONS.permission.read,
  'permission:create': BACKEND_PERMISSIONS.permission.create,
  'permission:update': BACKEND_PERMISSIONS.permission.update,
  'permission:delete': BACKEND_PERMISSIONS.permission.delete,
  'network:read': BACKEND_PERMISSIONS.node.read,
  'network:create': BACKEND_PERMISSIONS.node.create,
  'network:update': BACKEND_PERMISSIONS.node.update,
  'network:delete': BACKEND_PERMISSIONS.node.delete,
  'structure:read': BACKEND_PERMISSIONS.structure.read,
  'structure:create': BACKEND_PERMISSIONS.structure.create,
  'structure:update': BACKEND_PERMISSIONS.structure.update,
  'structure:delete': BACKEND_PERMISSIONS.structure.delete,
  'eventcalendar:read': BACKEND_PERMISSIONS.calendar.read,
  'eventcalendar:manage': BACKEND_PERMISSIONS.calendar.manage,
};

Object.entries(LEGACY_PERMISSION_ALIASES).forEach(([legacyPermission, canonicalPermission]) => {
  if (!LEGACY_PERMISSION_ALIASES[canonicalPermission]) {
    LEGACY_PERMISSION_ALIASES[canonicalPermission] = canonicalPermission;
  }
  if (!LEGACY_PERMISSION_ALIASES[legacyPermission]) {
    LEGACY_PERMISSION_ALIASES[legacyPermission] = canonicalPermission;
  }
});

export const normalizePermissionAlias = (permission?: string | null) => {
  const normalized = String(permission || '').trim();
  if (!normalized) {
    return normalized;
  }
  return LEGACY_PERMISSION_ALIASES[normalized] || normalized;
};

export const flattenBackendPermissions = () =>
  Object.values(BACKEND_PERMISSIONS).flatMap((group) => Object.values(group));
