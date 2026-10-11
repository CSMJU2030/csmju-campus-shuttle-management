import { SubsystemRole } from './core-hub-identity';
import { Permission, can, canAny } from './permissions';

describe('permissions', () => {
  it.each([SubsystemRole.STUDENT, SubsystemRole.LECTURER])('%s is a rider', (role) => {
    for (const permission of [
      Permission.SHUTTLE_READ_ANY,
      Permission.RIDE_REQUEST_CREATE,
      Permission.LOST_ITEM_REPORT,
      Permission.REVIEW_CREATE,
    ]) {
      expect(can(role, permission)).toBe(true);
    }
    for (const permission of [
      Permission.SHUTTLE_MANAGE,
      Permission.BUS_LOCATION_REPORT,
      Permission.RIDE_REQUEST_MANAGE,
      Permission.LOST_ITEM_MANAGE,
      Permission.REVIEW_READ_ANY,
      Permission.ANNOUNCEMENT_CREATE,
    ]) {
      expect(can(role, permission)).toBe(false);
    }
  });

  it('ALUMNI has no permission', () => {
    expect(canAny(SubsystemRole.ALUMNI, Object.values(Permission))).toBe(false);
  });

  it('STAFF runs the buses but does not call the bus or review itself', () => {
    expect(can(SubsystemRole.STAFF, Permission.BUS_LOCATION_REPORT)).toBe(true);
    expect(can(SubsystemRole.STAFF, Permission.RIDE_REQUEST_MANAGE)).toBe(true);
    expect(can(SubsystemRole.STAFF, Permission.REVIEW_READ_ANY)).toBe(true);
    expect(can(SubsystemRole.STAFF, Permission.RIDE_REQUEST_CREATE)).toBe(false);
    expect(can(SubsystemRole.STAFF, Permission.REVIEW_CREATE)).toBe(false);
  });

  it('ADMIN has every permission', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
    }
  });
});
