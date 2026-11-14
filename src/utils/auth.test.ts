import { test } from 'node:test';
import assert from 'node:assert';
import {
  isSuperAdminEmail,
  isSuperAdminUser,
  verifySuperAdminPassword,
  getDefaultRolePermissions,
  hasPlatformPermission,
  canModifyPlatformAdmin,
} from './auth';
import { PlatformAdmin } from '../types';

test('isSuperAdminEmail recognizes primary and secondary superadmin emails', () => {
  assert.strictEqual(isSuperAdminEmail('generaskagiraneza@gmail.com'), true);
  assert.strictEqual(isSuperAdminEmail('GENERASKAGIRANEZA@GMAIL.COM'), true);
  assert.strictEqual(isSuperAdminEmail('generaskagiraneza9@gmail.com'), true);
  assert.strictEqual(isSuperAdminEmail('owner@kigaliexecutive.rw'), false);
  assert.strictEqual(isSuperAdminEmail('driver@kigali.rw'), false);
  assert.strictEqual(isSuperAdminEmail(null), false);
});

test('verifySuperAdminPassword verifies exact master security credentials via SHA-256', () => {
  assert.strictEqual(
    verifySuperAdminPassword('generaskagiraneza@gmail.com', 'kg0f$2KG'),
    true
  );
  assert.strictEqual(
    verifySuperAdminPassword('generaskagiraneza9@gmail.com', 'kg0f$9KG'),
    true
  );
  assert.strictEqual(
    verifySuperAdminPassword('generaskagiraneza@gmail.com', 'wrongpassword'),
    false
  );
  assert.strictEqual(
    verifySuperAdminPassword('random@user.rw', 'kg0f$2KG'),
    false
  );
});

test('isSuperAdminUser verifies role-based and email-based authorization', () => {
  assert.strictEqual(isSuperAdminUser({ role: 'superadmin', email: 'any@domain.com' }), true);
  assert.strictEqual(isSuperAdminUser({ role: 'owner', email: 'generaskagiraneza@gmail.com' }), true);
  assert.strictEqual(isSuperAdminUser({ role: 'owner', email: 'owner@kigali.rw' }), false);
  assert.strictEqual(isSuperAdminUser({ role: 'driver', email: 'driver@kigali.rw' }), false);
  assert.strictEqual(isSuperAdminUser(null), false);
});

test('Superadmin sub-role permission matrix scopes Finance, Support, and Security admins properly', () => {
  const financeAdmin: PlatformAdmin = {
    id: 'adm-fin',
    name: 'Nadine Uwimana',
    email: 'finance.admin@kigalifleet.rw',
    phone: '+250 788 111 222',
    sub_role: 'finance_admin',
    status: 'Active',
    permissions: getDefaultRolePermissions('finance_admin'),
    created_at: '2026-01-10',
  };

  assert.strictEqual(hasPlatformPermission(financeAdmin, 'saas_payments', 'approve'), true);
  assert.strictEqual(hasPlatformPermission(financeAdmin, 'revenue', 'export'), true);
  assert.strictEqual(hasPlatformPermission(financeAdmin, 'security', 'suspend'), false);
  assert.strictEqual(hasPlatformPermission(financeAdmin, 'admins', 'configure'), false);

  const ownerAdmin: PlatformAdmin = {
    id: 'adm-owner-1',
    name: 'Generas Kagiraneza',
    email: 'generaskagiraneza@gmail.com',
    phone: '+250 788 100 200',
    sub_role: 'platform_owner',
    status: 'Active',
    permissions: getDefaultRolePermissions('platform_owner'),
    created_at: '2026-01-01',
  };

  assert.strictEqual(hasPlatformPermission(ownerAdmin, 'admins', 'configure'), true);
  assert.strictEqual(
    canModifyPlatformAdmin(financeAdmin, ownerAdmin, 'support_admin').allowed,
    false
  );
  assert.strictEqual(
    canModifyPlatformAdmin(ownerAdmin, financeAdmin, 'platform_admin').allowed,
    true
  );
});
