import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  TestContext,
  setupTestContext,
  teardownTestContext,
} from './test-helper';

describe('StoresController (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    // 1. Create and login an admin
    const adminEmail = `admin-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
    const password = 'password123';
    const registerAdminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password,
        fullName: 'Admin User',
      })
      .expect(201);
    const adminId = registerAdminRes.body.data.id;
    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      adminId,
    ]);

    const loginAdminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = loginAdminRes.body.data.accessToken;

    // 2. Create and login a customer
    const customerEmail = `customer-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: customerEmail,
        password,
        fullName: 'Customer User',
      })
      .expect(201);
    const loginCustomerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password })
      .expect(200);
    customerToken = loginCustomerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  const expectSuccessEnvelope = (body: any) => {
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('message', 'Request successful');
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('timestamp');
  };

  describe('POST /stores (Create Store)', () => {
    const storeData = {
      name: 'E2E Test Store',
      phone: '0987654321',
      address: '456 Le Loi, District 1, HCMC',
    };

    it('should create a store successfully when requested by an admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(storeData)
        .expect(201);

      expectSuccessEnvelope(response.body);
      const store = response.body.data;
      expect(store).toHaveProperty('id');
      expect(store.name).toBe(storeData.name);
      expect(store.isOpen).toBe(true);
      expect(store.isLocked).toBe(false);
    });

    it('should fail (401 Unauthorized) when requested without a token', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .send(storeData)
        .expect(401);
    });

    it('should fail (403 Forbidden) when requested by a non-admin user (customer)', async () => {
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(storeData)
        .expect(403);
    });

    it('should fail (400 Bad Request) when name is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          phone: '0987654321',
          address: '456 Le Loi',
        })
        .expect(400);

      expect(response.body.message).toContain('Store name must not be empty');
    });

    it('should fail (400 Bad Request) when phone is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Phone Store',
          phone: '',
          address: '456 Le Loi',
        })
        .expect(400);

      expect(response.body.message).toContain('Phone number must not be empty');
    });

    it('should fail (400 Bad Request) when address is empty', async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Address Store',
          phone: '0987654321',
          address: '',
        })
        .expect(400);

      expect(response.body.message).toContain('Address must not be empty');
    });

    it('should fail (400 Bad Request) when name exceeds 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: longName,
          phone: '0987654321',
          address: '456 Le Loi',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Store name must be at most 100 characters',
      );
    });

    it('should fail (409 Conflict) when store name already exists', async () => {
      const uniqueName = `Duplicate Name Store ${Date.now()}_${Math.random()}`;
      const seedData = {
        name: uniqueName,
        phone: '0901234567',
        address: '123 Nguyen Trai',
      };

      // Seed first store
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(seedData)
        .expect(201);

      // Attempt to create second store with same name
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: uniqueName,
          phone: '0907654321',
          address: '321 Le Hong Phong',
        })
        .expect(409);

      expect(response.body.message).toBe('Store name already exists');
    });
  });

  describe('GET /stores (List Stores - Public)', () => {
    it('should return only open and unlocked stores regardless of requested filters', async () => {
      const prefix = `Public Visibility ${Date.now()}`;
      const createStore = (name: string) =>
        request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name,
          phone: '0908888888',
          address: 'Active Address',
        });

      const openStore = await createStore(`${prefix} Open`);
      const closedStore = await createStore(`${prefix} Closed`);
      const lockedStore = await createStore(`${prefix} Locked`);
      const closedLockedStore = await createStore(`${prefix} Closed Locked`);

      await request(app.getHttpServer())
        .patch(`/stores/${closedStore.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isOpen: false })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/stores/${lockedStore.body.data.id}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/stores/${closedLockedStore.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isOpen: false })
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/stores/${closedLockedStore.body.data.id}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/stores?search=${encodeURIComponent(prefix)}&isOpen=false&isLocked=true`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      const { items } = response.body.data;
      expect(Array.isArray(items)).toBe(true);

      expect(items.map((store: any) => store.id)).toEqual([
        openStore.body.data.id,
      ]);
    });
  });

  describe('GET /stores/:id (Get Store Details - Public)', () => {
    it('should return a store by valid ID', async () => {
      const seedResponse = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Single Test Store ${Date.now()}`,
          phone: '0902222222',
          address: 'Address B',
        });
      const seedId = seedResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/stores/${seedId}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.id).toBe(seedId);
    });

    it('should fail (404 Not Found) if the store is locked', async () => {
      // Seed a store
      const seedResponse = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Will Be Locked Store ${Date.now()}`,
          phone: '0901239999',
          address: 'Address X',
        });
      const seedId = seedResponse.body.data.id;

      // Lock it
      await request(app.getHttpServer())
        .patch(`/stores/${seedId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Attempt to get details publicly (should return 404)
      const response = await request(app.getHttpServer())
        .get(`/stores/${seedId}`)
        .expect(404);

      expect(response.body.message).toBe('Store not found');
    });

    it('should fail (404 Not Found) if the store is closed', async () => {
      const seedResponse = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Will Be Closed Store ${Date.now()}`,
          phone: '0901238888',
          address: 'Address Y',
        });
      const seedId = seedResponse.body.data.id;

      await request(app.getHttpServer())
        .patch(`/stores/${seedId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isOpen: false })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get(`/stores/${seedId}`)
        .expect(404);

      expect(response.body.message).toBe('Store not found');
    });
  });

  describe('PATCH /stores/:id (Update Store)', () => {
    let storeId: string;
    const updateData = {
      name: 'New Store',
      phone: '0904444444',
    };

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Update Target Store ${Date.now()}_${Math.random().toString(36).substring(7)}`,
          phone: '0903333333',
          address: 'Old Address',
        });
      storeId = response.body.data.id;
    });

    it('should update store information successfully when requested by an admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.id).toBe(storeId);
      expect(response.body.data.phone).toBe(updateData.phone);
    });

    it('should fail (401 Unauthorized) when requested without a token', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}`)
        .send(updateData)
        .expect(401);
    });

    it('should fail (403 Forbidden) when requested by a non-admin user (customer)', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail (409 Conflict) if updating to a name that is already taken by another store', async () => {
      const duplicateName = `Other Store ${Date.now()}_${Math.random().toString(36).substring(7)}`;
      // Seed another store
      await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: duplicateName,
          phone: '0909999888',
          address: 'Other Address',
        });

      // Try to update current store's name to duplicateName
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: duplicateName })
        .expect(409);

      expect(response.body.message).toBe('Store name already exists');
    });
  });

  describe('PATCH /stores/:id/lock (Lock Store)', () => {
    let storeId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Lock Test Store ${Date.now()}_${Math.random().toString(36).substring(7)}`,
          phone: '0905555555',
          address: 'Address E',
        });
      storeId = response.body.data.id;
    });

    it('should lock an active store successfully when requested by an admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.isLocked).toBe(true);
    });

    it('should fail (401 Unauthorized) when requested without a token', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .expect(401);
    });

    it('should fail (403 Forbidden) when requested by a non-admin user (customer)', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should be idempotent (locking an already locked store returns 200 and remains locked)', async () => {
      // Lock first time
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Lock second time
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.isLocked).toBe(true);
    });
  });

  describe('PATCH /stores/:id/unlock (Unlock Store)', () => {
    let storeId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/stores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Unlock Test Store ${Date.now()}_${Math.random().toString(36).substring(7)}`,
          phone: '0905555556',
          address: 'Address F',
        });
      storeId = response.body.data.id;
      // Lock it first
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should unlock a locked store successfully when requested by an admin', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.isLocked).toBe(false);
    });

    it('should fail (401 Unauthorized) when requested without a token', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/unlock`)
        .expect(401);
    });

    it('should fail (403 Forbidden) when requested by a non-admin user (customer)', async () => {
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/unlock`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should be idempotent (unlocking an already unlocked store returns 200 and remains unlocked)', async () => {
      // Unlock first time
      await request(app.getHttpServer())
        .patch(`/stores/${storeId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Unlock second time
      const response = await request(app.getHttpServer())
        .patch(`/stores/${storeId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.isLocked).toBe(false);
    });
  });
});
