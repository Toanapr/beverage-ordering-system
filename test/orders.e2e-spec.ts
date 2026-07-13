import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  setupTestContext,
  teardownTestContext,
  TestContext,
} from './test-helper';

describe('Orders (Integration)', () => {
  let context: TestContext;
  let app: INestApplication;
  let dataSource: DataSource;

  let customerToken: string;
  let staffToken: string;
  let adminToken: string;

  let storeIdOpen: string;
  let storeIdClosed: string;
  let storeIdLocked: string;

  let categoryIdOpen: string;

  let productActive: string;
  let productHidden: string;
  let productOutOfStock: string;
  let productOtherStore: string;

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

    // 1. Create and Login Customer
    const customerEmail = `cust-order-${Date.now()}@gmail.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: customerEmail, password, fullName: 'Customer User' })
      .expect(201);

    const loginCust = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: customerEmail, password })
      .expect(200);
    customerToken = loginCust.body.data.accessToken;

    // 2. Create and Login Admin
    const adminEmail = `admin-order-${Date.now()}@gmail.com`;
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

    // 3. Create Stores
    // Store Open & Unlocked
    const storeOpenRes = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Store Open', phone: '0901111111', address: 'Address 1' })
      .expect(201);
    storeIdOpen = storeOpenRes.body.data.id;

    // Store Closed
    const storeClosedRes = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Store Closed', phone: '0902222222', address: 'Address 2' })
      .expect(201);
    storeIdClosed = storeClosedRes.body.data.id;
    await dataSource.query(`UPDATE stores SET is_open = false WHERE id = $1`, [
      storeIdClosed,
    ]);

    // Store Locked
    const storeLockedRes = await request(app.getHttpServer())
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Store Locked', phone: '0903333333', address: 'Address 3' })
      .expect(201);
    storeIdLocked = storeLockedRes.body.data.id;
    await dataSource.query(`UPDATE stores SET is_locked = true WHERE id = $1`, [
      storeIdLocked,
    ]);

    // 4. Create and Login Staff
    const staffEmail = `staff-order-${Date.now()}@gmail.com`;
    const regStaff = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: staffEmail, password, fullName: 'Staff User' })
      .expect(201);
    await dataSource.query(
      `UPDATE users SET role = 'staff', store_id = $1 WHERE id = $2`,
      [storeIdOpen, regStaff.body.data.id],
    );
    const loginStaff = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: staffEmail, password })
      .expect(200);
    staffToken = loginStaff.body.data.accessToken;

    // 5. Seed Category for Store Open
    const catOpen = await dataSource.query(
      `INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id`,
      [storeIdOpen, 'Beverages'],
    );
    categoryIdOpen = catOpen[0].id;

    // 6. Seed Products for Store Open
    // Active Product
    const pActive = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdOpen, categoryIdOpen, 'Active Milk Tea', 35000, 'active'],
    );
    productActive = pActive[0].id;

    // Hidden Product
    const pHidden = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdOpen, categoryIdOpen, 'Hidden Tea', 25000, 'hidden'],
    );
    productHidden = pHidden[0].id;

    // Out of Stock Product
    const pOOS = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdOpen, categoryIdOpen, 'OOS Coffee', 30000, 'out_of_stock'],
    );
    productOutOfStock = pOOS[0].id;

    // 7. Seed Product for Store Closed (Other Store)
    const catClosed = await dataSource.query(
      `INSERT INTO categories (store_id, name) VALUES ($1, $2) RETURNING id`,
      [storeIdClosed, 'Soft Drinks'],
    );
    const pOther = await dataSource.query(
      `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [storeIdClosed, catClosed[0].id, 'Cola', 15000, 'active'],
    );
    productOtherStore = pOther[0].id;
  });

  afterAll(async () => {
    await teardownTestContext(context);
  });

  // ==========================================
  // 1. POST /orders (Create Order)
  // ==========================================
  describe('POST /orders (Create Order)', () => {
    describe('Authentication & Authorization', () => {
      it('should fail with 401 if no authorization header is provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Unauthorized');
      });

      it('should fail with 401 if invalid token is provided', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should fail with 403 if user role is not CUSTOMER (e.g. STAFF)', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          'You do not have permission to access this resource',
        );
      });

      it('should fail with 403 if user role is ADMIN', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      });
    });

    describe('Input Validation (DTO)', () => {
      it('should fail with 400 if storeId is missing', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail with 400 if storeId is not a valid UUID', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: 'invalid-uuid-format',
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(400);
      });

      it('should fail with 400 if receiverName is empty', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: '',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(400);
      });

      it('should fail with 400 if receiverPhone is empty', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(400);
      });

      it('should fail with 400 if deliveryAddress is empty', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(400);
      });

      it('should fail with 400 if items list is empty', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail with 400 if item quantity is less than 1', async () => {
        await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 0 }],
          })
          .expect(400);
      });
    });

    describe('Business Logic & Pre-checks', () => {
      it('should fail with 404 if the store does not exist', async () => {
        const nonExistentStoreId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: nonExistentStoreId,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Store not found');
      });

      it('should fail with 403 if the store is locked', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdLocked,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          'Store is locked, cannot place order',
        );
      });

      it('should fail with 403 if the store is closed', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdClosed,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productActive, quantity: 1 }],
          })
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
          'Store is currently closed, cannot place order',
        );
      });

      it('should fail with 400 if product does not exist', async () => {
        const nonExistentProductId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: nonExistentProductId, quantity: 1 }],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('does not exist');
      });

      it('should fail with 400 if product does not belong to the selected store', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productOtherStore, quantity: 1 }],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain(
          'does not belong to this store',
        );
      });

      it('should fail with 400 if product status is hidden', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productHidden, quantity: 1 }],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('is currently unavailable');
      });

      it('should fail with 400 if product status is out of stock', async () => {
        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            storeId: storeIdOpen,
            receiverName: 'Receiver',
            receiverPhone: '0901234567',
            deliveryAddress: '123 Main St',
            items: [{ productId: productOutOfStock, quantity: 1 }],
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('is currently unavailable');
      });
    });

    describe('Happy Path (Success Cases)', () => {
      it('should successfully place an order with a single item', async () => {
        const payload = {
          storeId: storeIdOpen,
          receiverName: 'John Doe',
          receiverPhone: '0909999999',
          deliveryAddress: '789 Oak Road',
          items: [{ productId: productActive, quantity: 2 }],
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(payload)
          .expect(201);

        expectSuccessEnvelope(response.body);

        const order = response.body.data;
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('orderCode');
        expect(order.storeId).toBe(storeIdOpen);
        expect(order.receiverName).toBe(payload.receiverName);
        expect(order.receiverPhone).toBe(payload.receiverPhone);
        expect(order.deliveryAddress).toBe(payload.deliveryAddress);
        expect(Number(order.subtotal)).toBe(70000); // 35000 * 2
        expect(Number(order.totalAmount)).toBe(70000);
        expect(order.paymentMethod).toBe('COD');
        expect(order.status).toBe('pending');
        expect(order.items).toHaveLength(1);
        expect(order.items[0].productId).toBe(productActive);
        expect(order.items[0].productName).toBe('Active Milk Tea');
        expect(Number(order.items[0].price)).toBe(35000);
        expect(order.items[0].quantity).toBe(2);
        expect(Number(order.items[0].lineTotal)).toBe(70000);

        // Verify in DB
        const dbOrder = await dataSource.query(
          `SELECT * FROM orders WHERE id = $1`,
          [order.id],
        );
        expect(dbOrder).toHaveLength(1);
        expect(dbOrder[0].receiver_name).toBe(payload.receiverName);
        expect(Number(dbOrder[0].total_amount)).toBe(70000);

        const dbOrderItems = await dataSource.query(
          `SELECT * FROM order_items WHERE order_id = $1`,
          [order.id],
        );
        expect(dbOrderItems).toHaveLength(1);
        expect(dbOrderItems[0].product_id).toBe(productActive);
        expect(dbOrderItems[0].product_name).toBe('Active Milk Tea');
        expect(Number(dbOrderItems[0].price)).toBe(35000);
      });

      it('should successfully place an order with multiple items', async () => {
        // Seed a second active product
        const pActive2 = await dataSource.query(
          `INSERT INTO products (store_id, category_id, name, price, status) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [storeIdOpen, categoryIdOpen, 'Matcha Smoothie', 40000, 'active'],
        );
        const productActive2 = pActive2[0].id;

        const payload = {
          storeId: storeIdOpen,
          receiverName: 'Jane Smith',
          receiverPhone: '0908888888',
          deliveryAddress: '456 Maple Ave',
          items: [
            { productId: productActive, quantity: 1 }, // 35000
            { productId: productActive2, quantity: 3 }, // 40000 * 3 = 120000
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send(payload)
          .expect(201);

        expectSuccessEnvelope(response.body);

        const order = response.body.data;
        expect(Number(order.subtotal)).toBe(155000);
        expect(Number(order.totalAmount)).toBe(155000);
        expect(order.items).toHaveLength(2);

        // Verify DB records
        const dbOrderItems = await dataSource.query(
          `SELECT * FROM order_items WHERE order_id = $1 ORDER BY price ASC`,
          [order.id],
        );
        expect(dbOrderItems).toHaveLength(2);
        // first item (Active Milk Tea: 35000)
        expect(dbOrderItems[0].product_name).toBe('Active Milk Tea');
        expect(Number(dbOrderItems[0].price)).toBe(35000);
        expect(dbOrderItems[0].quantity).toBe(1);
        // second item (Matcha Smoothie: 40000)
        expect(dbOrderItems[1].product_name).toBe('Matcha Smoothie');
        expect(Number(dbOrderItems[1].price)).toBe(40000);
        expect(dbOrderItems[1].quantity).toBe(3);
      });
    });
  });

  // ==========================================
  // 2. GET /orders (List Orders) - Future tests
  // ==========================================
  describe('GET /orders (List Orders)', () => {
    // TODO: Add tests for listing orders with pagination and filtering
  });

  // ==========================================
  // 3. GET /orders/:id (Order Details) - Future tests
  // ==========================================
  describe('GET /orders/:id (Order Details)', () => {
    // TODO: Add tests for retrieving detailed information of a specific order
  });

  // ==========================================
  // 4. PATCH /orders/:id/status (Update Order Status) - Future tests
  // ==========================================
  describe('PATCH /orders/:id/status (Update Order Status)', () => {
    // TODO: Add tests for updating order workflow status (pending -> processing -> completed)
  });

  // ==========================================
  // 5. PATCH /orders/:id/cancel (Cancel Order) - Future tests
  // ==========================================
  describe('PATCH /orders/:id/cancel (Cancel Order)', () => {
    // TODO: Add tests for order cancellation rules and limits
  });
});
