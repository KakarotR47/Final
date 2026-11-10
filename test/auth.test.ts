import test from 'node:test';
import assert from 'node:assert/strict';

interface UserProfile {
  id: string;
  name: string;
  role: 'owner' | 'staff';
  pin: string;
}

function verifyLogin(
  profiles: UserProfile[],
  usernameInput: string,
  passwordInput: string
): { success: boolean; profileId?: string; role?: string; message?: string } {
  const rawPass = passwordInput.trim();
  const rawUser = usernameInput.trim().toLowerCase();

  if (!rawPass) {
    return { success: false, message: 'Please enter your password / PIN to sign in.' };
  }

  const staffProfile = profiles.find((prof) => prof.role === 'staff')!;
  const ownerProfile = profiles.find((prof) => prof.role === 'owner')!;

  const ownerExactPin = (ownerProfile.pin || '').trim();
  const staffExactPin = (staffProfile.pin || '').trim();

  const isOwnerTarget =
    rawUser === 'owner' ||
    rawUser === 'admin' ||
    rawUser === 'shop owner' ||
    rawUser === ownerProfile.name.trim().toLowerCase() ||
    rawUser === ownerProfile.id.toLowerCase();

  const isStaffTarget =
    rawUser === 'staff' ||
    rawUser === 'cashier' ||
    rawUser === 'staff cashier' ||
    rawUser === staffProfile.name.trim().toLowerCase() ||
    rawUser === staffProfile.id.toLowerCase();

  if (isOwnerTarget) {
    if (rawPass === ownerExactPin) {
      return { success: true, profileId: ownerProfile.id, role: 'owner' };
    }
    return {
      success: false,
      message: 'Incorrect Owner password. Only the password configured in Store Settings is accepted.',
    };
  }

  if (isStaffTarget) {
    if (rawPass === staffExactPin) {
      return { success: true, profileId: staffProfile.id, role: 'staff' };
    }
    return {
      success: false,
      message: 'Incorrect Staff password. Only the password set for Staff Cashier is accepted.',
    };
  }

  if (rawPass === ownerExactPin) {
    return { success: true, profileId: ownerProfile.id, role: 'owner' };
  }

  if (rawPass === staffExactPin) {
    return { success: true, profileId: staffProfile.id, role: 'staff' };
  }

  return {
    success: false,
    message: 'Incorrect password. Only the password configured in Store Settings is accepted.',
  };
}

test('Owner password strict verification', () => {
  let profiles: UserProfile[] = [
    { id: 'prof-owner', name: 'Shop Owner', role: 'owner', pin: '1080' },
    { id: 'prof-staff', name: 'Staff Cashier', role: 'staff', pin: '0000' },
  ];

  // 1. Trying 1234 when owner pin is 1080 MUST FAIL
  const attempt1234 = verifyLogin(profiles, 'owner', '1234');
  assert.equal(attempt1234.success, false);
  assert.match(attempt1234.message || '', /Incorrect Owner password/);

  // 2. Trying 1080 MUST SUCCEED
  const attempt1080 = verifyLogin(profiles, 'owner', '1080');
  assert.equal(attempt1080.success, true);
  assert.equal(attempt1080.role, 'owner');

  // 3. Update password to new custom password e.g. "9988"
  profiles = profiles.map((p) => (p.role === 'owner' ? { ...p, pin: '9988' } : p));

  // 4. Old passwords (1234 and 1080) MUST FAIL
  assert.equal(verifyLogin(profiles, 'owner', '1234').success, false);
  assert.equal(verifyLogin(profiles, 'owner', '1080').success, false);

  // 5. Only 9988 MUST SUCCEED
  const attempt9988 = verifyLogin(profiles, 'owner', '9988');
  assert.equal(attempt9988.success, true);
  assert.equal(attempt9988.role, 'owner');
});

test('Staff password verification', () => {
  const profiles: UserProfile[] = [
    { id: 'prof-owner', name: 'Shop Owner', role: 'owner', pin: '1080' },
    { id: 'prof-staff', name: 'Staff Cashier', role: 'staff', pin: '0000' },
  ];

  assert.equal(verifyLogin(profiles, 'staff', '1234').success, false);
  assert.equal(verifyLogin(profiles, 'staff', '1080').success, false);
  assert.equal(verifyLogin(profiles, 'staff', '0000').success, true);
});

test('Owner 1080 and Staff 1234 strict role isolation (no 1234 on Owner, no 0000 on Staff)', () => {
  const profiles: UserProfile[] = [
    { id: 'prof-owner', name: 'Shop Owner', role: 'owner', pin: '1080' },
    { id: 'prof-staff', name: 'Staff Cashier', role: 'staff', pin: '1234' },
  ];

  assert.equal(verifyLogin(profiles, 'owner', '1234').success, false);
  assert.equal(verifyLogin(profiles, 'owner', '0000').success, false);
  assert.equal(verifyLogin(profiles, 'staff', '0000').success, false);
  assert.equal(verifyLogin(profiles, 'staff', '1080').success, false);
  assert.equal(verifyLogin(profiles, 'owner', '1080').success, true);
  assert.equal(verifyLogin(profiles, 'staff', '1234').success, true);
});
