import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('CategoriesController (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let customerToken: string;
  let staffAToken: string;
  let staffBToken: string;
  let unassignedStaffToken: string;
  let storeIdA: string;
  let storeIdB: string;

  const password = 'password123';
  const suffix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

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

  const createStaff = async (
    email: string,
    storeId: string,
  ): Promise<{ id: string; token: string }> => {
    const response = await request(app.getHttpServer())
      .post('/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password, fullName: 'Category Staff', storeId })
      .expect(201);

    return { id: response.body.data.id, token: await login(email) };
  };

  const createStore = async (name: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name, phone: '0901234567', address: 'Category test address' })
      .expect(201);
    return response.body.data.id;
  };

  const createCategory = async (
    token: string,
    name: string,
  ): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name })
      .expect(201);
    return response.body.data.id;
  };

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    const adminEmail = `admin-categories-${suffix}@gmail.com`;
    const admin = await register(adminEmail, 'Admin User');
    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      admin.body.data.id,
    ]);
    adminToken = await login(adminEmail);

    const customerEmail = `customer-categories-${suffix}@gmail.com`;
    await register(customerEmail, 'Customer User');
    customerToken = await login(customerEmail);

    storeIdA = await createStore(`Category Store A ${suffix}`);
    storeIdB = await createStore(`Category Store B ${suffix}`);

    staffAToken = (
      await createStaff(`staff-a-categories-${suffix}@gmail.com`, storeIdA)
    ).token;
    staffBToken = (
      await createStaff(`staff-b-categories-${suffix}@gmail.com`, storeIdB)
    ).token;

    const unassignedStaff = await createStaff(
      `staff-unassigned-categories-${suffix}@gmail.com`,
      storeIdA,
    );
    await dataSource.query(`UPDATE users SET store_id = NULL WHERE id = $1`, [
      unassignedStaff.id,
    ]);
    unassignedStaffToken = unassignedStaff.token;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('POST /categories', () => {
    it('should create a category in the authenticated staff store', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: `Coffee ${suffix}` })
        .expect(201);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          storeId: storeIdA,
          name: `Coffee ${suffix}`,
        }),
      );
    });

    it('should validate names and reject duplicates in the same store', async () => {
      const name = `Duplicate ${suffix}`;
      await createCategory(staffAToken, name);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name })
        .expect(409);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: '' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: 'x'.repeat(101) })
        .expect(400);
    });

    it('should allow another store to reuse a category name', async () => {
      const name = `Shared name ${suffix}`;
      await createCategory(staffAToken, name);
      const categoryId = await createCategory(staffBToken, name);

      expect(categoryId).toBeDefined();
    });

    it('should reject unauthenticated, non-staff, and unassigned staff users', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Coffee' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Coffee' })
        .expect(403);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .send({ name: 'Coffee' })
        .expect(403);
    });
  });

  describe('GET /categories', () => {
    it('should return only the assigned store categories with search and pagination', async () => {
      const uniqueName = `Searchable category ${suffix}`;
      await createCategory(staffAToken, uniqueName);
      await createCategory(staffBToken, uniqueName);

      const response = await request(app.getHttpServer())
        .get('/categories')
        .query({ search: uniqueName, page: 1, limit: 1, sortBy: 'name' })
        .set('Authorization', `Bearer ${staffAToken}`)
        .expect(200);

      expect(response.body.data.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 1, totalItems: 1 }),
      );
      expect(response.body.data.items).toEqual([
        expect.objectContaining({ storeId: storeIdA, name: uniqueName }),
      ]);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update a category in the assigned store', async () => {
      const categoryId = await createCategory(
        staffAToken,
        `Update source ${suffix}`,
      );

      const response = await request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: `Updated category ${suffix}` })
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: categoryId,
          storeId: storeIdA,
          name: `Updated category ${suffix}`,
        }),
      );
    });

    it('should return 404 when updating a category in another store', async () => {
      const categoryId = await createCategory(
        staffBToken,
        `Other store category ${suffix}`,
      );

      await request(app.getHttpServer())
        .patch(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({ name: 'Attempted update' })
        .expect(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete an empty category in the assigned store', async () => {
      const categoryId = await createCategory(
        staffAToken,
        `Empty category ${suffix}`,
      );

      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .expect(200);

      expect(response.body.data).toEqual(
        expect.objectContaining({ id: categoryId, storeId: storeIdA }),
      );
    });

    it('should block deletion when the category has any product', async () => {
      const categoryId = await createCategory(
        staffAToken,
        `Referenced category ${suffix}`,
      );
      await dataSource.query(
        `INSERT INTO products (store_id, category_id, name, price, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [storeIdA, categoryId, `Hidden product ${suffix}`, 25000, 'hidden'],
      );

      const response = await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .expect(409);

      expect(response.body.message).toBe(
        'Cannot delete a category that contains products',
      );
    });

    it('should return 404 when deleting a category in another store', async () => {
      const categoryId = await createCategory(
        staffBToken,
        `Other delete category ${suffix}`,
      );

      await request(app.getHttpServer())
        .delete(`/categories/${categoryId}`)
        .set('Authorization', `Bearer ${staffAToken}`)
        .expect(404);
    });
  });
});
