import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('Products (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let staffTokenA: string;
  let customerToken: string;

  let storeIdA: string;
  let storeIdB: string;
  let storeIdC: string;

  let categoryIdA: string;
  let categoryIdB: string;

  let activeProductA: string;
  let hiddenProductA: string;
  let outOfStockProductA: string;
  let activeProductB: string;
  let activeProductC: string;

  const password = 'password123';

  const expectSuccessEnvelope = (body: any) => {
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('message', 'Request successful');
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('timestamp');
  };

  beforeAll(async () => {
    context = await setupTestContext();
    app = context.app;
    dataSource = context.dataSource;

    // 1. Create and login Admin
    const adminEmail = `admin-prod-${Date.now()}@gmail.com`;
    const regAdmin = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: adminEmail, password, fullName: 'Admin User' })
      .expect(201);
    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [
      regAdmin.body.data.id,
    ]);
    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = loginAdmin.body.data.accessToken;

    // 2. Create Stores
    // Store A: Open & Unlocked
    const storeResA = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Store A Open', phone: '0900000001', address: 'Address A' })
      .expect(201);
    storeIdA = storeResA.body.data.id;

    // Store B: Closed & Unlocked
    const storeResB = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Store B Closed',
        phone: '0900000002',
        address: 'Address B',
      })
      .expect(201);
    storeIdB = storeResB.body.data.id;
    await dataSource.query(`UPDATE stores SET is_open = false WHERE id = $1`, [
      storeIdB,
    ]);

    // Store C: Open & Locked
    const storeResC = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Store C Locked',
        phone: '0900000003',
        address: 'Address C',
      })
      .expect(201);
    storeIdC = storeResC.body.data.id;
    await dataSource.query(`UPDATE stores SET is_locked = true WHERE id = $1`, [
      storeIdC,
    ]);

    // 3. Create Staff of Store A
    const staffEmailA = `staff-prod-a-${Date.now()}@gmail.com`;
    const regStaffA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: staffEmailA, password, fullName: 'Staff User A' })
      .expect(201);
    await dataSource.query(
      `UPDATE users SET role = 'staff', store_id = $1 WHERE id = $2`,
      [storeIdA, regStaffA.body.data.id],
    );
    const loginStaffA = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: staffEmailA, password })
      .expect(200);
    staffTokenA = loginStaffA.body.data.accessToken;

    // 4. Create Customer
    const customerEmail = `cust-prod-${Date.now()}@gmail.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: customerEmail, password, fullName: 'Customer User' })
      .expect(201);
    const loginCust = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password })
      .expect(200);
    customerToken = loginCust.body.data.accessToken;

    // 5. Seed Categories
    const catA = await dataSource.query(
      `INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id`,
      [storeIdA, 'Coffee'],
    );
    categoryIdA = catA[0].id;

    const catB = await dataSource.query(
      `INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id`,
      [storeIdB, 'Tea'],
    );
    categoryIdB = catB[0].id;

    const catC = await dataSource.query(
      `INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id`,
      [storeIdC, 'Juice'],
    );

    // 6. Seed Products
    // Products in Store A (Open, Unlocked)
    const prodA1 = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdA, categoryIdA, 'Espresso Active', 30000, 'active'],
    );
    activeProductA = prodA1[0].id;

    const prodA2 = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdA, categoryIdA, 'Capuccino Hidden', 40000, 'hidden'],
    );
    hiddenProductA = prodA2[0].id;

    const prodA3 = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdA, categoryIdA, 'Latte OutOfStock', 45000, 'out_of_stock'],
    );
    outOfStockProductA = prodA3[0].id;

    // Products in Store B (Closed, Unlocked)
    const prodB1 = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdB, categoryIdB, 'Black Tea Active', 25000, 'active'],
    );
    activeProductB = prodB1[0].id;

    // Products in Store C (Open, Locked)
    const prodC1 = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdC, catC[0].id, 'Orange Juice Active', 35000, 'active'],
    );
    activeProductC = prodC1[0].id;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  describe('GET /products/public (Public Product List)', () => {
    it('should return only active products of open and unlocked stores', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/public')
        .expect(200);

      expectSuccessEnvelope(response.body);
      const items = response.body.data.items;
      // Only activeProductA should be visible.
      // Hidden/out_of_stock (Store A) should be filtered out.
      // Store B (closed) and Store C (locked) active products should be filtered out.
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(activeProductA);
      expect(items[0].name).toBe('Espresso Active');
    });

    it('should filter public products by storeId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/public?storeId=${storeIdA}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].id).toBe(activeProductA);

      const emptyResponse = await request(app.getHttpServer())
        .get(`/products/public?storeId=${storeIdB}`)
        .expect(200);

      // Store B is closed, so no products should be returned.
      expect(emptyResponse.body.data.items).toHaveLength(0);
    });

    it('should filter public products by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/public?categoryId=${categoryIdA}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].id).toBe(activeProductA);

      const emptyResponse = await request(app.getHttpServer())
        .get(`/products/public?categoryId=${categoryIdB}`)
        .expect(200);

      expect(emptyResponse.body.data.items).toHaveLength(0);
    });

    it('should search public products by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/public?search=espresso')
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);

      const emptyResponse = await request(app.getHttpServer())
        .get('/products/public?search=matcha')
        .expect(200);

      expect(emptyResponse.body.data.items).toHaveLength(0);
    });
  });

  describe('GET /products/public/:id (Public Product Details)', () => {
    it('should return active product details of open/unlocked store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/public/${activeProductA}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.id).toBe(activeProductA);
      expect(response.body.data.name).toBe('Espresso Active');
    });

    it('should return 404 for product in closed store', async () => {
      await request(app.getHttpServer())
        .get(`/products/public/${activeProductB}`)
        .expect(404);
    });

    it('should return 404 for product in locked store', async () => {
      await request(app.getHttpServer())
        .get(`/products/public/${activeProductC}`)
        .expect(404);
    });

    it('should return 404 for hidden/out_of_stock products in open store', async () => {
      await request(app.getHttpServer())
        .get(`/products/public/${hiddenProductA}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/products/public/${outOfStockProductA}`)
        .expect(404);
    });
  });

  describe('GET /products (Staff/Admin Product List)', () => {
    it('should allow Admin to see all products from all stores', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      // Admin should see all 5 seeded products
      expect(response.body.data.items).toHaveLength(5);
    });

    it('should allow Staff to see all products in their store only (including hidden/out_of_stock)', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${staffTokenA}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      const items = response.body.data.items;
      // Staff of Store A should see all 3 products of Store A
      expect(items).toHaveLength(3);
      const ids = items.map((p: any) => p.id);
      expect(ids).toContain(activeProductA);
      expect(ids).toContain(hiddenProductA);
      expect(ids).toContain(outOfStockProductA);
    });

    it('should fail (400 Bad Request) if Staff passes storeId in query', async () => {
      await request(app.getHttpServer())
        .get(`/products?storeId=${storeIdB}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .expect(400);
    });

    it('should fail (403 Forbidden) for Customers attempting to access', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('GET /products/:id (Staff/Admin Product Details)', () => {
    it('should allow Staff to see their own store product detail (including hidden/out_of_stock)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${hiddenProductA}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.id).toBe(hiddenProductA);
    });

    it('should fail (403 Forbidden) if Staff attempts to view products of other stores', async () => {
      await request(app.getHttpServer())
        .get(`/products/${activeProductB}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .expect(403);
    });

    it('should allow Admin to see any product detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${activeProductB}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.id).toBe(activeProductB);
    });

    it('should return 404 for invalid product id', async () => {
      await request(app.getHttpServer())
        .get('/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /products and PATCH /products/:id (Staff Product Management)', () => {
    let createdProductId: string;

    it('should allow staff to create a product in their assigned store', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({
          storeId: storeIdB,
          categoryId: categoryIdA,
          name: 'Staff Created Product',
          description: 'Created by Store A staff',
          price: 0,
        })
        .expect(201);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.storeId).toBe(storeIdA);
      expect(response.body.data.categoryId).toBe(categoryIdA);
      expect(response.body.data.price).toBe(0);
      expect(response.body.data.status).toBe('active');
      createdProductId = response.body.data.id;
    });

    it('should expose a newly created active product publicly', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/public')
        .expect(200);

      expect(response.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdProductId }),
        ]),
      );
    });

    it('should reject invalid prices and categories outside the staff store', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ categoryId: categoryIdA, name: 'Negative Price', price: -1 })
        .expect(400);

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ categoryId: categoryIdB, name: 'Wrong Category', price: 10000 })
        .expect(404);
    });

    it('should require staff authentication and role to create products', async () => {
      const payload = {
        categoryId: categoryIdA,
        name: 'Unauthorized Product',
        price: 10000,
      };

      await request(app.getHttpServer())
        .post('/products')
        .send(payload)
        .expect(401);
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload)
        .expect(403);
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(403);
    });

    it('should allow staff to update their product and hide it from public listing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ name: 'Staff Updated Product', price: 0, status: 'hidden' })
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.name).toBe('Staff Updated Product');
      expect(response.body.data.status).toBe('hidden');

      const publicResponse = await request(app.getHttpServer())
        .get('/products/public')
        .expect(200);
      expect(publicResponse.body.data.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdProductId }),
        ]),
      );
    });

    it('should allow direct status transitions and only expose active products publicly', async () => {
      const outOfStockResponse = await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ status: 'out_of_stock' })
        .expect(200);

      expect(outOfStockResponse.body.data).toMatchObject({
        id: createdProductId,
        name: 'Staff Updated Product',
        status: 'out_of_stock',
      });

      const outOfStockPublicResponse = await request(app.getHttpServer())
        .get('/products/public')
        .expect(200);
      expect(outOfStockPublicResponse.body.data.items).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdProductId }),
        ]),
      );

      const activeResponse = await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ status: 'active' })
        .expect(200);
      expect(activeResponse.body.data.status).toBe('active');

      const activePublicResponse = await request(app.getHttpServer())
        .get('/products/public')
        .expect(200);
      expect(activePublicResponse.body.data.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: createdProductId }),
        ]),
      );
    });

    it('should reject empty, invalid, unauthorized, or cross-store updates', async () => {
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({})
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ price: -1 })
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ status: 'unavailable' })
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .send({ status: 'hidden' })
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'hidden' })
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/products/${activeProductB}`)
        .set('Authorization', `Bearer ${staffTokenA}`)
        .send({ status: 'hidden' })
        .expect(404);
      await request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'hidden' })
        .expect(403);
    });
  });
});
