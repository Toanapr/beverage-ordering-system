import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('Admin User Management (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminId: string;
  let adminToken: string;
  let customerId: string;
  let customerToken: string;
  let customerEmail: string;
  let staffId: string;
  let staffEmail: string;
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

    const adminEmail = `admin-users-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
    const registerAdminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password,
        fullName: 'Admin User',
      })
      .expect(201);
    adminId = registerAdminRes.body.data.id;

    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      adminId,
    ]);

    const loginAdminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = loginAdminRes.body.data.accessToken;

    customerEmail = `customer-users-${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
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
        name: `Users Test Store ${Date.now()}`,
        phone: '0901234567',
        address: '123 Users Test St',
      })
      .expect(201);
    storeId = createStoreRes.body.data.id;

    staffEmail = `staff-users-${Date.now()}@gmail.com`;
    const createStaffRes = await request(app.getHttpServer())
      .post('/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: staffEmail,
        password,
        fullName: 'Staff User',
        storeId,
      })
      .expect(201);
    staffId = createStaffRes.body.data.id;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('GET /admin/users', () => {
    it('should list all user roles by default', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: adminId, role: 'admin' }),
          expect.objectContaining({ id: customerId, role: 'customer' }),
          expect.objectContaining({ id: staffId, role: 'staff' }),
        ]),
      );
      expect(response.body.data.items[0]).not.toHaveProperty('passwordHash');
    });

    it('should filter users by role', async () => {
      const customerResponse = await request(app.getHttpServer())
        .get('/admin/users')
        .query({ role: 'customer' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(customerResponse.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: customerId, role: 'customer' }),
        ]),
      );
      expect(customerResponse.body.data.items).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ role: 'staff' })]),
      );

      const staffResponse = await request(app.getHttpServer())
        .get('/admin/users')
        .query({ role: 'staff' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(staffResponse.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: staffId, role: 'staff' }),
        ]),
      );

      const adminResponse = await request(app.getHttpServer())
        .get('/admin/users')
        .query({ role: 'admin' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: adminId, role: 'admin' }),
        ]),
      );
    });

    it('should fail with 401 without a token and 403 for non-admin users', async () => {
      await request(app.getHttpServer()).get('/admin/users').expect(401);

      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/users/:id/lock / unlock', () => {
    it('should lock and unlock a customer account', async () => {
      const lockResponse = await request(app.getHttpServer())
        .patch(`/admin/users/${customerId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(lockResponse.body.data).toEqual(
        expect.objectContaining({
          id: customerId,
          role: 'customer',
          isBanned: true,
        }),
      );

      const unlockResponse = await request(app.getHttpServer())
        .patch(`/admin/users/${customerId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(unlockResponse.body.data.isBanned).toBe(false);
    });

    it('should lock and unlock a staff account through user management', async () => {
      const lockResponse = await request(app.getHttpServer())
        .patch(`/admin/users/${staffId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(lockResponse.body.data).toEqual(
        expect.objectContaining({
          id: staffId,
          role: 'staff',
          isBanned: true,
        }),
      );

      const unlockResponse = await request(app.getHttpServer())
        .patch(`/admin/users/${staffId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(unlockResponse.body.data.isBanned).toBe(false);
    });

    it('should not lock admin accounts through user management', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${adminId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should block login, refresh, and existing access tokens after locking a customer', async () => {
      const email = `customer-blocked-${Date.now()}@gmail.com`;
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password,
          fullName: 'Blocked Customer',
        })
        .expect(201);
      const userId = registerResponse.body.data.id;

      const customerAgent = request.agent(app.getHttpServer());
      const loginResponse = await customerAgent
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      expect(getRefreshCookie(loginResponse)).toBeDefined();
      const accessToken = loginResponse.body.data.accessToken;

      await request(app.getHttpServer())
        .patch(`/admin/users/${userId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(403);

      await customerAgent.post('/auth/refresh').send().expect(403);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      const tokenRows = await dataSource.query(
        `SELECT is_revoked FROM refresh_tokens WHERE user_id = $1`,
        [userId],
      );
      expect(tokenRows).toEqual(
        expect.arrayContaining([expect.objectContaining({ is_revoked: true })]),
      );
    });
  });
});
