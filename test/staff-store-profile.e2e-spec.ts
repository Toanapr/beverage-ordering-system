import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('Staff Store Profile (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let customerToken: string;
  let staffToken: string;
  let unassignedStaffToken: string;
  let assignedStoreId: string;
  let otherStoreId: string;

  const password = 'password123';

  const registerAndLogin = async (
    email: string,
    fullName: string,
  ): Promise<{ id: string; token: string }> => {
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, fullName })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return {
      id: registerResponse.body.data.id,
      token: loginResponse.body.data.accessToken,
    };
  };

  const createStaffAndLogin = async (
    email: string,
    storeId: string,
  ): Promise<{ id: string; token: string }> => {
    const createResponse = await request(app.getHttpServer())
      .post('/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email,
        password,
        fullName: 'Store Staff',
        storeId,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return {
      id: createResponse.body.data.id,
      token: loginResponse.body.data.accessToken,
    };
  };

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    const suffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const admin = await registerAndLogin(
      `admin-store-profile-${suffix}@gmail.com`,
      'Admin User',
    );
    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      admin.id,
    ]);
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `admin-store-profile-${suffix}@gmail.com`,
        password,
      })
      .expect(200);
    adminToken = adminLoginResponse.body.data.accessToken;

    const customer = await registerAndLogin(
      `customer-store-profile-${suffix}@gmail.com`,
      'Customer User',
    );
    customerToken = customer.token;

    const assignedStoreResponse = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Assigned Store ${suffix}`,
        phone: '0901111111',
        address: 'Assigned address',
      })
      .expect(201);
    assignedStoreId = assignedStoreResponse.body.data.id;

    const otherStoreResponse = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Other Store ${suffix}`,
        phone: '0902222222',
        address: 'Other address',
      })
      .expect(201);
    otherStoreId = otherStoreResponse.body.data.id;

    const staff = await createStaffAndLogin(
      `staff-store-profile-${suffix}@gmail.com`,
      assignedStoreId,
    );
    staffToken = staff.token;

    const unassignedStaff = await createStaffAndLogin(
      `unassigned-store-profile-${suffix}@gmail.com`,
      assignedStoreId,
    );
    await dataSource.query(`UPDATE users SET store_id = NULL WHERE id = $1`, [
      unassignedStaff.id,
    ]);
    unassignedStaffToken = unassignedStaff.token;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('GET /staff/store', () => {
    it('should return the store assigned to the authenticated staff', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff/store')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: assignedStoreId,
          phone: '0901111111',
          address: 'Assigned address',
        }),
      );
    });

    it('should reject unauthenticated and non-staff users', async () => {
      await request(app.getHttpServer()).get('/staff/store').expect(401);
      await request(app.getHttpServer())
        .get('/staff/store')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should reject staff without an assigned store', async () => {
      const response = await request(app.getHttpServer())
        .get('/staff/store')
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .expect(403);

      expect(response.body.message).toBe(
        'Nhân viên chưa được phân công cửa hàng',
      );
    });
  });

  describe('PATCH /staff/store', () => {
    it('should update only the store assigned to the authenticated staff', async () => {
      const response = await request(app.getHttpServer())
        .patch('/staff/store')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          phone: '0909999999',
          address: 'Updated assigned address',
          isOpen: false,
        })
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: assignedStoreId,
          phone: '0909999999',
          address: 'Updated assigned address',
          isOpen: false,
        }),
      );

      const otherStoreResponse = await request(app.getHttpServer())
        .get(`/stores/${otherStoreId}`)
        .expect(200);
      expect(otherStoreResponse.body.data.phone).toBe('0902222222');
      expect(otherStoreResponse.body.data.address).toBe('Other address');
    });

    it('should validate profile fields', async () => {
      await request(app.getHttpServer())
        .patch('/staff/store')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ phone: '' })
        .expect(400);
    });

    it('should reject staff without an assigned store', async () => {
      await request(app.getHttpServer())
        .patch('/staff/store')
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .send({ isOpen: false })
        .expect(403);
    });
  });
});
