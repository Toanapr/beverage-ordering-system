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
  let customerId: string;
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
    const registerCustomer = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: customerEmail, password, fullName: 'Customer User' })
      .expect(201);
    customerId = registerCustomer.body.data.id;

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
  // 2. GET /orders/history (Customer Order History)
  // ==========================================
  describe('GET /orders/history (Customer Order History)', () => {
    let otherCustomerOrderId: string;

    beforeAll(async () => {
      await dataSource.query(
        `UPDATE orders SET status = 'completed' WHERE customer_id = $1`,
        [customerId],
      );

      const otherCustomerEmail = `other-history-${Date.now()}@gmail.com`;
      const registerOtherCustomer = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherCustomerEmail,
          password,
          fullName: 'Other Customer',
        })
        .expect(201);

      const insertedOrder = await dataSource.query(
        `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          `OTH${Date.now().toString().slice(-7)}`,
          registerOtherCustomer.body.data.id,
          storeIdOpen,
          'Other Customer',
          '0900000000',
          'Other Address',
          35000,
          35000,
          'COD',
          'pending',
        ],
      );
      otherCustomerOrderId = insertedOrder[0].id;
    });

    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/orders/history').expect(401);
    });

    it('should fail with 403 for staff and admin', async () => {
      await request(app.getHttpServer())
        .get('/orders/history')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .get('/orders/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should return paginated summaries belonging only to the authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/history?page=1&limit=1')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 1 }),
      );
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0]).not.toHaveProperty('receiverName');
      expect(response.body.data.items[0]).not.toHaveProperty('receiverPhone');
      expect(response.body.data.items[0]).not.toHaveProperty('deliveryAddress');
      expect(response.body.data.items[0]).not.toHaveProperty('items');

      const allOrdersResponse = await request(app.getHttpServer())
        .get('/orders/history?limit=100')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(
        allOrdersResponse.body.data.items.map((order: any) => order.id),
      ).not.toContain(otherCustomerOrderId);
    });

    it('should filter the authenticated customer history by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/history?status=completed')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.data.items.length).toBeGreaterThan(0);
      for (const order of response.body.data.items) {
        expect(order.status).toBe('completed');
      }

      await request(app.getHttpServer())
        .get('/orders/history?status=invalid')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });

  // ==========================================
  // 3. GET /orders/staff (List Staff Orders)
  // ==========================================
  describe('GET /orders/staff (List Staff Orders)', () => {
    let unassignedStaffToken: string;

    beforeAll(async () => {
      // Create a staff user with no store assigned
      const unassignedStaffEmail = `staff-unassigned-${Date.now()}@gmail.com`;
      const regUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: unassignedStaffEmail,
          password,
          fullName: 'Unassigned Staff',
        })
        .expect(201);
      await dataSource.query(`UPDATE users SET role = 'staff' WHERE id = $1`, [
        regUnassignedStaff.body.data.id,
      ]);
      const loginUnassigned = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unassignedStaffEmail, password })
        .expect(200);
      unassignedStaffToken = loginUnassigned.body.data.accessToken;
    });

    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/orders/staff').expect(401);
    });

    it('should fail with 403 if role is not STAFF (e.g. CUSTOMER)', async () => {
      await request(app.getHttpServer())
        .get('/orders/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with 403 if staff has no assigned store', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/staff')
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Staff member has no assigned store');
    });

    it('should successfully list orders belonging to the staff store', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/staff')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.items)).toBe(true);
      // All returned orders must belong to storeIdOpen
      for (const order of response.body.data.items) {
        expect(order.storeId).toBe(storeIdOpen);
      }
    });

    it('should filter orders by status and return pagination meta', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/staff?status=pending&page=1&limit=5')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      const { items, meta } = response.body.data;
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(5);
      for (const order of items) {
        expect(order.status).toBe('pending');
      }
    });
  });

  // ==========================================
  // 4. GET /orders/staff/statistics (Staff Order Statistics)
  // ==========================================
  describe('GET /orders/staff/statistics (Staff Order Statistics)', () => {
    let unassignedStaffToken: string;

    beforeAll(async () => {
      const insertOrder = async (
        suffix: string,
        status: string,
        totalAmount: number,
        createdAt: string,
      ) =>
        dataSource.query(
          `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
          [
            `STA${suffix}`,
            customerId,
            storeIdOpen,
            'Statistics Customer',
            '0901234567',
            'Statistics Address',
            totalAmount,
            totalAmount,
            'COD',
            status,
            createdAt,
          ],
        );

      await insertOrder('0000001', 'completed', 100000, '2025-01-15T17:00:00Z');
      await insertOrder('0000002', 'cancelled', 50000, '2025-01-16T16:59:59Z');
      await insertOrder('0000003', 'pending', 30000, '2025-01-15T16:59:59Z');
      await insertOrder('0000004', 'completed', 200000, '2025-01-16T17:00:00Z');

      const unassignedStaffEmail = `staff-unassigned-statistics-${Date.now()}@gmail.com`;
      const registerUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: unassignedStaffEmail,
          password,
          fullName: 'Unassigned Statistics Staff',
        })
        .expect(201);
      await dataSource.query(`UPDATE users SET role = 'staff' WHERE id = $1`, [
        registerUnassignedStaff.body.data.id,
      ]);
      const loginUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unassignedStaffEmail, password })
        .expect(200);
      unassignedStaffToken = loginUnassignedStaff.body.data.accessToken;
    });

    it('should reject unauthenticated, non-staff, and unassigned staff requests', async () => {
      await request(app.getHttpServer())
        .get('/orders/staff/statistics')
        .expect(401);
      await request(app.getHttpServer())
        .get('/orders/staff/statistics')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .get('/orders/staff/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .get('/orders/staff/statistics')
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .expect(403);
    });

    it('should return all-time statistics for the assigned store', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/staff/statistics')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          totalOrders: expect.any(Number),
          completedOrders: expect.any(Number),
          cancelledOrders: expect.any(Number),
          completedRevenue: expect.any(Number),
        }),
      );
      expect(response.body.data.completedRevenue).toBeGreaterThanOrEqual(
        300000,
      );
    });

    it('should filter statistics using inclusive Asia/Ho_Chi_Minh day boundaries', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/staff/statistics?from=2025-01-16&to=2025-01-16')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.data).toEqual({
        totalOrders: 2,
        completedOrders: 1,
        cancelledOrders: 1,
        completedRevenue: 100000,
      });
    });

    it('should reject invalid dates and invalid date ranges', async () => {
      await request(app.getHttpServer())
        .get('/orders/staff/statistics?from=2025/01/16')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);
      await request(app.getHttpServer())
        .get('/orders/staff/statistics?from=2025-02-30')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);
      await request(app.getHttpServer())
        .get('/orders/staff/statistics?from=2025-01-17&to=2025-01-16')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);
    });
  });

  // ==========================================
  // 5. GET /orders/staff/:id (Staff Order Details)
  // ==========================================
  describe('GET /orders/staff/:id (Staff Order Details)', () => {
    let orderId: string;
    let otherOrderId: string;
    let unassignedStaffToken: string;

    beforeAll(async () => {
      // 1. Create a pending order for staff's store (storeIdOpen)
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'John Detail',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Detail Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      orderId = res.body.data.id;

      // 2. Create an order for a different store (storeIdClosed)
      const otherOrderRes = await dataSource.query(
        `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          'OTH' + Math.floor(1000000 + Math.random() * 9000000).toString(),
          res.body.data.customerId,
          storeIdClosed,
          'Receiver',
          '0901234567',
          'Address',
          15000,
          15000,
          'COD',
          'pending',
        ],
      );
      otherOrderId = otherOrderRes[0].id;

      // 3. Create unassigned staff
      const unassignedStaffEmail = `staff-unassigned-det-${Date.now()}@gmail.com`;
      const regUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: unassignedStaffEmail,
          password,
          fullName: 'Unassigned Staff',
        })
        .expect(201);
      await dataSource.query(`UPDATE users SET role = 'staff' WHERE id = $1`, [
        regUnassignedStaff.body.data.id,
      ]);
      const loginUnassigned = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unassignedStaffEmail, password })
        .expect(200);
      unassignedStaffToken = loginUnassigned.body.data.accessToken;
    });

    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/orders/staff/${orderId}`)
        .expect(401);
    });

    it('should fail with 403 if role is not STAFF', async () => {
      await request(app.getHttpServer())
        .get(`/orders/staff/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with 403 if staff has no assigned store', async () => {
      await request(app.getHttpServer())
        .get(`/orders/staff/${orderId}`)
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .expect(403);
    });

    it('should fail with 400 if order ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .get('/orders/staff/invalid-uuid')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);
    });

    it('should fail with 404 if the order does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/orders/staff/${nonExistentId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
    });

    it('should fail with 403 if the order belongs to another store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/staff/${otherOrderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'You do not have permission to access orders of another store',
      );
    });

    it('should return order details including items if order belongs to staff store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/staff/${orderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      const order = response.body.data;
      expect(order.id).toBe(orderId);
      expect(order.storeId).toBe(storeIdOpen);
      expect(order.items).toBeDefined();
      expect(order.items.length).toBeGreaterThan(0);
      expect(order.items[0].productId).toBe(productActive);
    });
  });

  // ==========================================
  // 4. GET /orders/admin (List Admin Orders)
  // ==========================================
  describe('GET /orders/admin (List Admin Orders)', () => {
    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/orders/admin').expect(401);
    });

    it('should fail with 403 if role is not ADMIN (e.g. CUSTOMER)', async () => {
      await request(app.getHttpServer())
        .get('/orders/admin')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with 403 if role is STAFF', async () => {
      await request(app.getHttpServer())
        .get('/orders/admin')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });

    it('should successfully list all orders in the system for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should filter all orders by storeId and return pagination meta', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/admin?storeId=${storeIdOpen}&page=1&limit=5`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      const { items, meta } = response.body.data;
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(5);
      for (const order of items) {
        expect(order.storeId).toBe(storeIdOpen);
      }
    });
  });

  // ==========================================
  // 5. GET /orders/admin/:id (Admin Order Details)
  // ==========================================
  describe('GET /orders/admin/:id (Admin Order Details)', () => {
    let orderOpenId: string;
    let orderClosedId: string;

    beforeAll(async () => {
      // 1. Create order in storeIdOpen
      const resOpen = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'John OpenDetail',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Open Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      orderOpenId = resOpen.body.data.id;

      // 2. Create order in storeIdClosed via direct query
      const resClosed = await dataSource.query(
        `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          'OTH' + Math.floor(1000000 + Math.random() * 9000000).toString(),
          resOpen.body.data.customerId,
          storeIdClosed,
          'Receiver',
          '0901234567',
          'Address',
          15000,
          15000,
          'COD',
          'pending',
        ],
      );
      orderClosedId = resClosed[0].id;
    });

    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/orders/admin/${orderOpenId}`)
        .expect(401);
    });

    it('should fail with 403 if role is not ADMIN', async () => {
      await request(app.getHttpServer())
        .get(`/orders/admin/${orderOpenId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with 400 if order ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .get('/orders/admin/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should fail with 404 if the order does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/orders/admin/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should successfully retrieve order details for an order in any store', async () => {
      // 1. Order in open store
      const responseOpen = await request(app.getHttpServer())
        .get(`/orders/admin/${orderOpenId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expectSuccessEnvelope(responseOpen.body);
      expect(responseOpen.body.data.id).toBe(orderOpenId);
      expect(responseOpen.body.data.storeId).toBe(storeIdOpen);

      // 2. Order in closed store
      const responseClosed = await request(app.getHttpServer())
        .get(`/orders/admin/${orderClosedId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expectSuccessEnvelope(responseClosed.body);
      expect(responseClosed.body.data.id).toBe(orderClosedId);
      expect(responseClosed.body.data.storeId).toBe(storeIdClosed);
    });
  });

  // ==========================================
  // 6. GET /orders/:id (Customer Order Details)
  // ==========================================
  describe('GET /orders/:id (Customer Order Details)', () => {
    let ownOrderId: string;
    let otherCustomerOrderId: string;
    let otherCustomerToken: string;

    beforeAll(async () => {
      const ownOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'Customer Detail',
          receiverPhone: '0901111222',
          deliveryAddress: '123 Detail Road',
          items: [{ productId: productActive, quantity: 2 }],
        })
        .expect(201);
      ownOrderId = ownOrder.body.data.id;

      const otherCustomerEmail = `other-detail-${Date.now()}@gmail.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: otherCustomerEmail,
          password,
          fullName: 'Other Detail Customer',
        })
        .expect(201);
      const otherCustomerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: otherCustomerEmail, password })
        .expect(200);
      otherCustomerToken = otherCustomerLogin.body.data.accessToken;

      const otherOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'Other Customer Detail',
          receiverPhone: '0901111333',
          deliveryAddress: '456 Other Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      otherCustomerOrderId = otherOrder.body.data.id;
    });

    it('should fail with 401 if no token is provided', async () => {
      await request(app.getHttpServer())
        .get(`/orders/${ownOrderId}`)
        .expect(401);
    });

    it('should fail with 403 for staff and admin', async () => {
      await request(app.getHttpServer())
        .get(`/orders/${ownOrderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .get(`/orders/${ownOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should fail with 400 for an invalid order ID', async () => {
      await request(app.getHttpServer())
        .get('/orders/invalid-uuid')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });

    it('should fail with 404 for a missing or another customer order', async () => {
      await request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
      await request(app.getHttpServer())
        .get(`/orders/${otherCustomerOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should return order details and items for the owning customer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${ownOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: ownOrderId,
          receiverName: 'Customer Detail',
          receiverPhone: '0901111222',
          deliveryAddress: '123 Detail Road',
        }),
      );
      expect(response.body.data.items).toEqual([
        expect.objectContaining({ productId: productActive, quantity: 2 }),
      ]);
    });
  });

  // ==========================================
  // 7. PATCH /orders/:id/cancel (Cancel Order)
  // ==========================================
  describe('PATCH /orders/:id/cancel (Cancel Order)', () => {
    let orderId: string;
    let otherCustomerToken: string;

    beforeAll(async () => {
      // 1. Create a pending order for customer
      const payload = {
        storeId: storeIdOpen,
        receiverName: 'John Cancel',
        receiverPhone: '0901111111',
        deliveryAddress: '123 Cancel Road',
        items: [{ productId: productActive, quantity: 1 }],
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload)
        .expect(201);

      orderId = response.body.data.id;

      // 2. Create and login another customer
      const otherCustEmail = `other-cust-${Date.now()}@gmail.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: otherCustEmail, password, fullName: 'Other Customer' })
        .expect(201);

      const loginOther = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: otherCustEmail, password })
        .expect(200);

      otherCustomerToken = loginOther.body.data.accessToken;
    });

    it('should fail with 401 if no authorization header is provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .send({ cancelReason: 'Changed mind' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with 401 if invalid token is provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ cancelReason: 'Changed mind' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with 403 if user role is not CUSTOMER (e.g. STAFF)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'You do not have permission to access this resource',
      );
    });

    it('should fail with 400 if cancelReason is missing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with 400 if cancelReason is empty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with 400 if order ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/orders/invalid-uuid/cancel')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(400);
    });

    it('should fail with 404 if the order does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .patch(`/orders/${nonExistentId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });

    it('should fail with 404 if the order belongs to a different customer', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order not found');
    });

    it('should fail with 400 if the order is already in PREPARING status', async () => {
      // 1. Create another order
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'John Preparing',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Cancel Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      const targetOrderId = res.body.data.id;

      // 2. Query to change status to preparing
      await dataSource.query(
        `UPDATE orders SET status = 'preparing' WHERE id = $1`,
        [targetOrderId],
      );

      // 3. Attempt to cancel
      const response = await request(app.getHttpServer())
        .patch(`/orders/${targetOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Only pending orders can be cancelled',
      );
    });

    it('should fail with 400 if the order is already in COMPLETED status', async () => {
      // 1. Create another order
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'John Completed',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Cancel Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      const targetOrderId = res.body.data.id;

      // 2. Query to change status to completed
      await dataSource.query(
        `UPDATE orders SET status = 'completed' WHERE id = $1`,
        [targetOrderId],
      );

      // 3. Attempt to cancel
      const response = await request(app.getHttpServer())
        .patch(`/orders/${targetOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Changed mind' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Only pending orders can be cancelled',
      );
    });

    it('should successfully cancel a pending order and update status and cancelReason', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Not hungry anymore' })
        .expect(200);

      expectSuccessEnvelope(response.body);

      const order = response.body.data;
      expect(order.status).toBe('cancelled');
      expect(order.cancelReason).toBe('Not hungry anymore');

      // Verify in DB
      const dbOrder = await dataSource.query(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId],
      );
      expect(dbOrder).toHaveLength(1);
      expect(dbOrder[0].status).toBe('cancelled');
      expect(dbOrder[0].cancel_reason).toBe('Not hungry anymore');
    });

    it('should fail with 400 if the order is already in CANCELLED status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Another reason' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(
        'Only pending orders can be cancelled',
      );
    });
  });

  // ==========================================
  // 8. PATCH /orders/staff/:id/cancel (Staff Cancel Order)
  // ==========================================
  describe('PATCH /orders/staff/:id/cancel (Staff Cancel Order)', () => {
    let pendingOrderId: string;
    let preparingOrderId: string;
    let completedOrderId: string;
    let cancelledOrderId: string;
    let otherStoreOrderId: string;
    let unassignedStaffToken: string;

    const createOrderForStaffStore = async (receiverName: string) => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName,
          receiverPhone: '0901111111',
          deliveryAddress: '123 Staff Cancel Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      return response.body.data.id;
    };

    beforeAll(async () => {
      pendingOrderId = await createOrderForStaffStore('Pending Cancel');
      preparingOrderId = await createOrderForStaffStore('Preparing Cancel');
      completedOrderId = await createOrderForStaffStore('Completed Cancel');
      cancelledOrderId = await createOrderForStaffStore('Cancelled Cancel');

      await dataSource.query(
        `UPDATE orders SET status = 'preparing' WHERE id = $1`,
        [preparingOrderId],
      );
      await dataSource.query(
        `UPDATE orders SET status = 'completed' WHERE id = $1`,
        [completedOrderId],
      );
      await dataSource.query(
        `UPDATE orders SET status = 'cancelled', cancel_reason = 'Already cancelled' WHERE id = $1`,
        [cancelledOrderId],
      );

      const otherStoreOrder = await dataSource.query(
        `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          'OTH' + Math.floor(1000000 + Math.random() * 9000000).toString(),
          customerId,
          storeIdClosed,
          'Other Store Customer',
          '0901234567',
          'Other Store Address',
          15000,
          15000,
          'COD',
          'pending',
        ],
      );
      otherStoreOrderId = otherStoreOrder[0].id;

      const unassignedStaffEmail = `staff-unassigned-cancel-${Date.now()}@gmail.com`;
      const registerUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: unassignedStaffEmail,
          password,
          fullName: 'Unassigned Cancel Staff',
        })
        .expect(201);
      await dataSource.query(`UPDATE users SET role = 'staff' WHERE id = $1`, [
        registerUnassignedStaff.body.data.id,
      ]);
      const loginUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unassignedStaffEmail, password })
        .expect(200);
      unassignedStaffToken = loginUnassignedStaff.body.data.accessToken;
    });

    it('should reject missing authentication and non-staff roles', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .send({ cancelReason: 'Store issue' })
        .expect(401);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(403);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(403);
    });

    it('should reject an unassigned staff member, invalid ID, and missing reason', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(403);
      await request(app.getHttpServer())
        .patch('/orders/staff/invalid-uuid/cancel')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({})
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: '' })
        .expect(400);
    });

    it('should reject missing and another-store orders', async () => {
      await request(app.getHttpServer())
        .patch('/orders/staff/00000000-0000-0000-0000-000000000000/cancel')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(404);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${otherStoreOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Store issue' })
        .expect(403);
    });

    it('should cancel pending and preparing orders with a reason', async () => {
      const pendingResponse = await request(app.getHttpServer())
        .patch(`/orders/staff/${pendingOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Ingredient unavailable' })
        .expect(200);
      expect(pendingResponse.body.data).toEqual(
        expect.objectContaining({
          status: 'cancelled',
          cancelReason: 'Ingredient unavailable',
        }),
      );

      const preparingResponse = await request(app.getHttpServer())
        .patch(`/orders/staff/${preparingOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Equipment failure' })
        .expect(200);
      expect(preparingResponse.body.data).toEqual(
        expect.objectContaining({
          status: 'cancelled',
          cancelReason: 'Equipment failure',
        }),
      );
    });

    it('should reject completed and cancelled orders', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${completedOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Too late' })
        .expect(400);
      await request(app.getHttpServer())
        .patch(`/orders/staff/${cancelledOrderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ cancelReason: 'Already cancelled' })
        .expect(400);
    });
  });

  // ==========================================
  // 9. PATCH /orders/staff/:id/status (Staff Update Order Status)
  // ==========================================
  describe('PATCH /orders/staff/:id/status (Staff Update Order Status)', () => {
    let orderId: string;
    let cancelledOrderId: string;
    let otherStoreOrderId: string;
    let unassignedStaffToken: string;

    beforeAll(async () => {
      // 1. Create a pending order for staff's store (storeIdOpen)
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'John State',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Open Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      orderId = res.body.data.id;

      const cancelledOrder = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          storeId: storeIdOpen,
          receiverName: 'Cancelled State',
          receiverPhone: '0901111111',
          deliveryAddress: '123 Open Road',
          items: [{ productId: productActive, quantity: 1 }],
        })
        .expect(201);
      cancelledOrderId = cancelledOrder.body.data.id;
      await dataSource.query(
        `UPDATE orders SET status = 'cancelled', cancel_reason = 'Cancelled' WHERE id = $1`,
        [cancelledOrderId],
      );

      // 2. Create a pending order for other store (storeIdClosed)
      const otherOrderRes = await dataSource.query(
        `INSERT INTO orders (order_code, customer_id, store_id, receiver_name, receiver_phone, delivery_address, subtotal, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          'OTH' + Math.floor(1000000 + Math.random() * 9000000).toString(),
          res.body.data.customerId,
          storeIdClosed,
          'Receiver',
          '0901234567',
          'Address',
          15000,
          15000,
          'COD',
          'pending',
        ],
      );
      otherStoreOrderId = otherOrderRes[0].id;

      // 3. Create unassigned staff
      const unassignedStaffEmail = `staff-unassigned-status-${Date.now()}@gmail.com`;
      const regUnassignedStaff = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: unassignedStaffEmail,
          password,
          fullName: 'Unassigned Staff',
        })
        .expect(201);
      await dataSource.query(`UPDATE users SET role = 'staff' WHERE id = $1`, [
        regUnassignedStaff.body.data.id,
      ]);
      const loginUnassigned = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unassignedStaffEmail, password })
        .expect(200);
      unassignedStaffToken = loginUnassigned.body.data.accessToken;
    });

    it('should fail with 401 if no authorization header is provided', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .send({ status: 'preparing' })
        .expect(401);
    });

    it('should fail with 403 if role is not STAFF (e.g. CUSTOMER)', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'preparing' })
        .expect(403);
    });

    it('should fail with 403 if staff has no assigned store', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${unassignedStaffToken}`)
        .send({ status: 'preparing' })
        .expect(403);
    });

    it('should fail with 400 if order ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .patch('/orders/staff/invalid-uuid/status')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'preparing' })
        .expect(400);
    });

    it('should fail with 404 if the order does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/orders/staff/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'preparing' })
        .expect(404);
    });

    it('should fail with 403 if the order belongs to another store', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${otherStoreOrderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'preparing' })
        .expect(403);
    });

    it('should fail with 400 if transition is invalid (e.g. pending -> completed)', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'completed' })
        .expect(400);
    });

    it('should successfully update status from pending to preparing', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'preparing' })
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.status).toBe('preparing');
    });

    it('should fail with 400 if transition is invalid (e.g. preparing -> pending)', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'pending' })
        .expect(400);
    });

    it('should successfully update status from preparing to completed', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expectSuccessEnvelope(response.body);
      expect(response.body.data.status).toBe('completed');
    });

    it('should fail with 400 if order is already completed', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${orderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'preparing' })
        .expect(400);
    });

    it('should fail with 400 for cancelled -> pending', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/staff/${cancelledOrderId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'pending' })
        .expect(400);
    });
  });
});
