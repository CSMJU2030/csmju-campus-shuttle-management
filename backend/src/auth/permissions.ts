import { SubsystemRole } from './core-hub-identity';

/**
 * Permissions of csmju-campus-shuttle-management (authorization.md).
 * Format: <resource>:<action>[:scope]
 */
export enum Permission {
  SHUTTLE_READ_ANY = 'shuttle:read:any',
  SHUTTLE_MANAGE = 'shuttle:manage',
  BUS_LOCATION_REPORT = 'bus-location:report',
  RIDE_REQUEST_CREATE = 'ride-request:create',
  RIDE_REQUEST_MANAGE = 'ride-request:manage',
  LOST_ITEM_REPORT = 'lost-item:report',
  LOST_ITEM_MANAGE = 'lost-item:manage',
  REVIEW_CREATE = 'review:create',
  REVIEW_READ_ANY = 'review:read:any',
  ANNOUNCEMENT_CREATE = 'announcement:create',
  PROBLEM_REPORT_CREATE = 'problem-report:create',
  PROBLEM_REPORT_MANAGE = 'problem-report:manage',
}

/** Riders (student, lecturer): view, call the bus, report lost items, review the service. */
const VIEWER_PERMISSIONS: Permission[] = [
  Permission.SHUTTLE_READ_ANY,
  Permission.RIDE_REQUEST_CREATE,
  Permission.LOST_ITEM_REPORT,
  Permission.REVIEW_CREATE,
  Permission.PROBLEM_REPORT_CREATE,
];

/** Staff = drivers and the transport office (also runs the admin panel; the team has no admin test account). */
const STAFF_PERMISSIONS: Permission[] = [
  Permission.SHUTTLE_READ_ANY,
  Permission.SHUTTLE_MANAGE,
  Permission.BUS_LOCATION_REPORT,
  Permission.RIDE_REQUEST_MANAGE,
  Permission.LOST_ITEM_REPORT,
  Permission.LOST_ITEM_MANAGE,
  Permission.REVIEW_READ_ANY,
  Permission.ANNOUNCEMENT_CREATE,
  Permission.PROBLEM_REPORT_MANAGE,
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
