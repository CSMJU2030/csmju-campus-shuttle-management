import { SubsystemRole } from './core-hub-identity';
import { Permission, can, canAny } from './permissions';

describe('permissions', () => {
  it.each([SubsystemRole.STUDENT, SubsystemRole.LECTURER])('%s can only read shuttle data', (role) => {
    expect(can(role, Permission.SHUTTLE_READ_ANY)).toBe(true);
    expect(can(role, Permission.SHUTTLE_MANAGE)).toBe(false);
    expect(can(role, Permission.BUS_LOCATION_REPORT)).toBe(false);
  });

  it('ALUMNI has no permission', () => {
    expect(canAny(SubsystemRole.ALUMNI, Object.values(Permission))).toBe(false);
  });

  it('STAFF can read, manage routes and report bus locations', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.STAFF, permission)).toBe(true);
    }
  });

  it('ADMIN has every permission', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
    }
  });
});
