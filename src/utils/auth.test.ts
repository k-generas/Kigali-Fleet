import { test } from 'node:test';
import assert from 'node:assert';
import {
  isSuperAdminEmail,
  isSuperAdminUser,
  verifySuperAdminPassword,
  SUPER_ADMIN_EMAILS,
} from './auth';

test('isSuperAdminEmail recognizes primary and secondary superadmin emails', () => {
  assert.strictEqual(isSuperAdminEmail('generaskagiraneza@gmail.com'), true);
  assert.strictEqual(isSuperAdminEmail('GENERASKAGIRANEZA@GMAIL.COM'), true);
  assert.strictEqual(isSuperAdminEmail('generaskagiraneza9@gmail.com'), true);
  assert.strictEqual(isSuperAdminEmail('owner@kigaliexecutive.rw'), false);
  assert.strictEqual(isSuperAdminEmail('driver@kigali.rw'), false);
  assert.strictEqual(isSuperAdminEmail(null), false);
});

test('verifySuperAdminPassword verifies exact master security credentials', () => {
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
