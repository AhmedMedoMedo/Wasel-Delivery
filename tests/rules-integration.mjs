import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'wasel-delivery-test';
const rules = readFileSync('firestore.rules', 'utf8');

async function runTests() {
  console.log('----------------------------------------------------');
  console.log(' Starting Real Firestore Emulator Rules Integration Tests');
  console.log(' Project: ' + PROJECT_ID);
  console.log('----------------------------------------------------\n');

  const hostPort = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';
  const [host, portStr] = hostPort.split(':');
  const port = parseInt(portStr || '8088', 10);

  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rules,
        host: host,
        port: port,
      },
    });
  } catch (err) {
    console.error('Failed to connect to Firestore Emulator:', err.message);
    process.exit(1);
  }

  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      results.push({ name, passed: true });
    } catch (err) {
      console.log(`[FAIL] ${name}`);
      console.log(`       Reason: ${err.message}`);
      results.push({ name, passed: false, error: err.message });
    }
  }

  // Clear before starting
  await testEnv.clearFirestore();

  const unauthed = testEnv.unauthenticatedContext().firestore();
  const restContext = testEnv.authenticatedContext('rest-user-1', { role: 'restaurant' });
  const restDb = restContext.firestore();

  const driverContext = testEnv.authenticatedContext('driver-user-1', { role: 'driver' });
  const driverDb = driverContext.firestore();

  const otherContext = testEnv.authenticatedContext('intruder-user-9', {});
  const otherDb = otherContext.firestore();

  const adminContext = testEnv.authenticatedContext('admin-user-1', { admin: true });
  const adminDb = adminContext.firestore();

  // Test 1: Unauthenticated access
  await test('1. Unauthenticated user cannot read private users collection', async () => {
    await assertFails(getDoc(doc(unauthed, 'users', 'rest-user-1')));
  });

  await test('2. Unauthenticated user cannot create a user profile', async () => {
    await assertFails(
      setDoc(doc(unauthed, 'users', 'anon-1'), {
        name: 'Anon',
        email: 'a@b.com',
        phone: '010',
        role: 'restaurant',
        commissionOwed: 0,
      })
    );
  });

  // Test 3: Creation flow in order: users/{uid} then publicProfiles/{uid}
  await test('3. Restaurant creates private profile (users/{uid}) with valid fields', async () => {
    await assertSucceeds(
      setDoc(doc(restDb, 'users', 'rest-user-1'), {
        name: 'مطعم الشرق',
        email: 'sharg@example.com',
        phone: '01011112222',
        role: 'restaurant',
        commissionOwed: 0,
        createdAt: new Date().toISOString(),
      })
    );
  });

  await test('4. Restaurant creates public profile (publicProfiles/{uid}) with matching role', async () => {
    await assertSucceeds(
      setDoc(doc(restDb, 'publicProfiles', 'rest-user-1'), {
        id: 'rest-user-1',
        name: 'مطعم الشرق',
        role: 'restaurant',
        createdAt: new Date().toISOString(),
      })
    );
  });

  // Test 5: Driver creation with default rating [5]
  await test('5. Driver creates private profile (users/{uid}) and public profile', async () => {
    await assertSucceeds(
      setDoc(doc(driverDb, 'users', 'driver-user-1'), {
        name: 'كابتن محمود',
        email: 'capt@example.com',
        phone: '01122223333',
        role: 'driver',
        vehicle: 'motorcycle',
        ratings: [5],
        commissionOwed: 0,
        createdAt: new Date().toISOString(),
      })
    );
    await assertSucceeds(
      setDoc(doc(driverDb, 'publicProfiles', 'driver-user-1'), {
        id: 'driver-user-1',
        name: 'كابتن محمود',
        role: 'driver',
        vehicle: 'motorcycle',
        ratings: [5],
        createdAt: new Date().toISOString(),
      })
    );
  });

  // Test 6: Role escalation attack on creation
  await test('6. User CANNOT create a profile with role="admin"', async () => {
    const evilContext = testEnv.authenticatedContext('attacker-1', {});
    await assertFails(
      setDoc(doc(evilContext.firestore(), 'users', 'attacker-1'), {
        name: 'Evil Admin',
        email: 'evil@example.com',
        phone: '0100000000',
        role: 'admin',
        commissionOwed: 0,
      })
    );
  });

  // Test 7: User attempting to assign themselves high ratings on registration
  await test('7. User CANNOT assign arbitrary high rating [5,5,5,5] during creation', async () => {
    const fraudDriver = testEnv.authenticatedContext('fraud-driver-1', {});
    await assertFails(
      setDoc(doc(fraudDriver.firestore(), 'publicProfiles', 'fraud-driver-1'), {
        id: 'fraud-driver-1',
        name: 'Fraud Driver',
        role: 'driver',
        ratings: [5, 5, 5, 5, 5],
        createdAt: new Date().toISOString(),
      })
    );
  });

  // Test 8: Tampering with role on update
  await test('8. Restaurant CANNOT modify their role to "admin" or "driver"', async () => {
    await assertFails(
      updateDoc(doc(restDb, 'users', 'rest-user-1'), {
        role: 'admin',
      })
    );
  });

  // Test 9: Tampering with commissionOwed
  await test('9. Driver CANNOT modify commissionOwed (financial tamper)', async () => {
    await assertFails(
      updateDoc(doc(driverDb, 'users', 'driver-user-1'), {
        commissionOwed: 100,
      })
    );
  });

  // Test 10: Modifying ratings on publicProfiles
  await test('10. Driver CANNOT modify ratings in publicProfiles', async () => {
    await assertFails(
      updateDoc(doc(driverDb, 'publicProfiles', 'driver-user-1'), {
        ratings: [5, 5, 5],
      })
    );
  });

  // Test 11: Privacy: Reading another user private document
  await test('11. User CANNOT read another user private document in users/{uid}', async () => {
    await assertFails(getDoc(doc(otherDb, 'users', 'rest-user-1')));
  });

  // Test 12: PublicProfiles readable by authenticated users
  await test('12. Authenticated user CAN read public profile of other users', async () => {
    await assertSucceeds(getDoc(doc(otherDb, 'publicProfiles', 'driver-user-1')));
  });

  // Test 13: Updating allowed personal fields
  await test('13. User CAN update allowed personal fields (name, vehicle) in publicProfiles', async () => {
    await assertSucceeds(
      updateDoc(doc(driverDb, 'publicProfiles', 'driver-user-1'), {
        name: 'كابتن محمود المعدل',
        vehicle: 'car',
      })
    );
  });

  // Test 14: Admin with Custom Claim accessing private data
  await test('14. Admin with Custom Claim (admin: true) CAN read any private user document', async () => {
    await assertSucceeds(getDoc(doc(adminDb, 'users', 'rest-user-1')));
  });

  // Test 15: Regular user without 'admin' claim in token CANNOT access admin privileges
  await test('15. Regular user without "admin" claim in token CANNOT access admin privileges', async () => {
    // otherDb has standard token without 'admin' property
    await assertFails(getDoc(doc(otherDb, 'users', 'rest-user-1')));
    await assertFails(
      updateDoc(doc(otherDb, 'users', 'rest-user-1'), {
        name: 'Unauthorized Change',
      })
    );
  });

  // Test 16: Orders collection closed
  await test('16. Reading from orders collection is completely DENIED in this phase', async () => {
    await assertFails(getDoc(doc(restDb, 'orders', 'ord-101')));
  });

  await test('17. Writing to orders collection is completely DENIED in this phase', async () => {
    await assertFails(
      setDoc(doc(restDb, 'orders', 'ord-101'), {
        restaurantId: 'rest-user-1',
        type: 'بيتزا',
        deliveryFee: 30,
        status: 'pending',
      })
    );
  });

  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(` Summary: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} tests.`);
  console.log('====================================================');

  await testEnv.cleanup();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
