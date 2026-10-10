import { SubsystemRole } from './core-hub-identity';

/**
 * Permissions of csmju-campus-shuttle-management (authorization.md).
 * Format: <resource>:<action>[:scope]
 */
export enum Permission {
  SHUTTLE_READ_ANY = 'shuttle:read:any',
  SHUTTLE_MANAGE = 'shuttle:manage',
  BUS_LOCATION_REPORT = 'bus-location:report',
}

const VIEWER_PERMISSIONS: Permission[] = [Permission.SHUTTLE_READ_ANY];

const STAFF_PERMISSIONS: Permission[] = [
  Permission.SHUTTLE_READ_ANY,
  Permission.SHUTTLE_MANAGE,
  Permission.BUS_LOCATION_REPORT,
];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze([...VIEWER_PERMISSIONS]),
    // alumni is not mapped by role-mapping.ts (Core Hub rejects it with 403); kept empty for completeness.
    [SubsystemRole.ALUMNI]: Object.freeze([] as Permission[]),
    [SubsystemRole.LECTURER]: Object.freeze([...VIEWER_PERMISSIONS]),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}
