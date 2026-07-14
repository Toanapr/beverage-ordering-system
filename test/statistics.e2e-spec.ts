import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('StatisticsController (Integration)', () => {
  jest.setTimeout(30000);

  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let customerToken: string;
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const password = 'password123';

  const register = async (email: string, fullName: string) =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, fullName })
      .expect(201);

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.data.accessToken;
  };

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    const adminEmail = `admin-stats-${suffix}@gmail.com`;
    const admin = await register(adminEmail, 'Admin User');
    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      admin.body.data.id,
    ]);
    adminToken = await login(adminEmail);

    const customerEmail = `customer-stats-${suffix}@gmail.com`;
    await register(customerEmail, 'Customer User');
    customerToken = await login(customerEmail);
  });

  afterAll(async () => {
    if (context) {
      await teardownTestContext(context);
    }
  });

  describe('Authorization check', () => {
    it('should return 401 when unauthorized', async () => {
      await request(app.getHttpServer()).get('/statistics/admin').expect(401);
    });

    it('should return 403 when not an admin', async () => {
      await request(app.getHttpServer())
        .get('/statistics/admin')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('GET /statistics/admin', () => {
    it('should return overview metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('totalStores');
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('totalOrders');
      expect(response.body.data).toHaveProperty('totalRevenue');
    });
  });

  describe('GET /statistics/admin/trends', () => {
    it('should return trend metrics grouped by range', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/admin/trends')
        .query({ range: 'day' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail with invalid range parameter', async () => {
      await request(app.getHttpServer())
        .get('/statistics/admin/trends')
        .query({ range: 'invalid_range' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /statistics/admin/top-stores', () => {
    it('should return top store list', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/admin/top-stores')
        .query({ limit: 5, sortBy: 'revenue' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should fail with invalid sortBy parameter', async () => {
      await request(app.getHttpServer())
        .get('/statistics/admin/top-stores')
        .query({ sortBy: 'invalid_sort' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /statistics/admin/top-products', () => {
    it('should return top selling products list', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/admin/top-products')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /statistics/admin/order-status', () => {
    it('should return order status distribution', async () => {
      const response = await request(app.getHttpServer())
        .get('/statistics/admin/order-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('preparing');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('cancelled');
    });
  });
});
