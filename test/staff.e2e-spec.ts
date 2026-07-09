import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('Staff Management (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let storeId: string;

  const password = 'password123';

  const expectSuccessEnvelope = (body: any) => {
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('message', 'Request successful');
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('timestamp');
  };

  const getRefreshCookie = (response: request.Response): string | undefined => {
    const rawCookies = response.headers['set-cookie'];
    if (!rawCookies) return undefined;
    const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
    return cookies.find((cookie) => cookie.startsWith('refreshToken='));
  };

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    const adminEmail = `admin-staff-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
    const registerAdminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password,
        fullName: 'Admin User',
      })
      .expect(201);

    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      registerAdminRes.body.data.id,
    ]);

    const loginAdminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = loginAdminRes.body.data.accessToken;

    const customerEmail = `customer-staff-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
    const registerCustomerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: customerEmail,
        password,
        fullName: 'Customer User',
      })
      .expect(201);
    customerId = registerCustomerRes.body.data.id;

    const loginCustomerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password })
      .expect(200);
    customerToken = loginCustomerRes.body.data.accessToken;

    const createStoreRes = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Staff Test Store ${Date.now()}`,
        phone: '0901234567',
        address: '123 Staff Test St',
      })
      .expect(201);
    storeId = createStoreRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('POST /admin/staff', () => {
    it('should create a staff account when requested by an admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `staff-create-${Date.now()}@gmail.com`,
          password,
          fullName: 'Created Staff',
          storeId,
        })
        .expect(201);

      expectSuccessEnvelope(response.body);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          role: 'staff',
          storeId,
          fullName: 'Created Staff',
          isBanned: false,
        }),
      );
      expect(response.body.data).not.toHaveProperty('passwordHash');
    });

    it('should fail with 401 when requested without a token', async () => {
      await request(app.getHttpServer())
        .post('/admin/staff')
        .send({
          email: `staff-no-token-${Date.now()}@gmail.com`,
          password,
          fullName: 'No Token Staff',
          storeId,
        })
        .expect(401);
    });

    it('should fail with 403 when requested by a customer', async () => {
      await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: `staff-customer-${Date.now()}@gmail.com`,
          password,
          fullName: 'Customer Staff',
          storeId,
        })
        .expect(403);
    });

    it('should fail with 409 when email already exists', async () => {
      const email = `staff-duplicate-${Date.now()}@gmail.com`;

      await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password,
          fullName: 'Duplicate Staff',
          storeId,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password,
          fullName: 'Duplicate Staff Again',
          storeId,
        })
        .expect(409);
    });

    it('should fail with 404 when store does not exist', async () => {
      await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `staff-missing-store-${Date.now()}@gmail.com`,
          password,
          fullName: 'Missing Store Staff',
          storeId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });
  });

  describe('GET /admin/staff', () => {
    it('should list staff with store and lock filters', async () => {
      const email = `staff-list-${Date.now()}@gmail.com`;
      await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password,
          fullName: 'Listed Staff',
          storeId,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/admin/staff')
        .query({
          search: 'Listed',
          storeId,
          isBanned: false,
          page: 1,
          limit: 10,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email,
            role: 'staff',
            storeId,
            isBanned: false,
          }),
        ]),
      );
      expect(response.body.data.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: customerId,
          }),
        ]),
      );
    });
  });

  describe('PATCH /admin/staff/:id/lock / unlock', () => {
    it('should lock and unlock a staff account', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `staff-lock-unlock-${Date.now()}@gmail.com`,
          password,
          fullName: 'Lock Unlock Staff',
          storeId,
        })
        .expect(201);
      const staffId = createResponse.body.data.id;

      const lockResponse = await request(app.getHttpServer())
        .patch(`/admin/staff/${staffId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(lockResponse.body.data.isBanned).toBe(true);

      const unlockResponse = await request(app.getHttpServer())
        .patch(`/admin/staff/${staffId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(unlockResponse.body.data.isBanned).toBe(false);
    });

    it('should not lock a non-staff user', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/staff/${customerId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should block login, refresh, and existing access tokens after locking staff', async () => {
      const email = `staff-blocked-${Date.now()}@gmail.com`;
      const createResponse = await request(app.getHttpServer())
        .post('/admin/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password,
          fullName: 'Blocked Staff',
          storeId,
        })
        .expect(201);
      const staffId = createResponse.body.data.id;

      const staffAgent = request.agent(app.getHttpServer());
      const loginResponse = await staffAgent
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(getRefreshCookie(loginResponse)).toBeDefined();
      const staffToken = loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .patch(`/admin/staff/${staffId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(403);

      await staffAgent.post('/auth/refresh').send().expect(403);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      const tokenRows = await dataSource.query(
        `SELECT is_revoked FROM refresh_tokens WHERE user_id = $1`,
        [staffId],
      );
      expect(tokenRows).toEqual(
        expect.arrayContaining([expect.objectContaining({ is_revoked: true })]),
      );
    });
  });
});
