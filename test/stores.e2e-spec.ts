import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestContext, setupTestContext, teardownTestContext } from './test-helper';

describe('StoresController (Integration)', () => {
    let context: TestContext;
    let app: INestApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        context = await setupTestContext();
        app = context.app;
        dataSource = context.dataSource;
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
        it('should create a store successfully with valid data', async () => {
            const storeData = {
                name: 'Cửa hàng Test E2E',
                phone: '0987654321',
                address: '456 Lê Lợi, Quận 1, TP. HCM',
            };

            const response = await request(app.getHttpServer())
                .post('/stores')
                .send(storeData)
                .expect(201);

            expectSuccessEnvelope(response.body);
            const store = response.body.data;
            expect(store).toHaveProperty('id');
            expect(store.name).toBe(storeData.name);
            expect(store.phone).toBe(storeData.phone);
            expect(store.address).toBe(storeData.address);
            expect(store.isOpen).toBe(true); // Default value
            expect(store.isLocked).toBe(false); // Default value
        });

        it('should fail (400 Bad Request) when name is empty', async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: '',
                    phone: '0987654321',
                    address: '456 Lê Lợi',
                })
                .expect(400);

            expect(response.body.message).toContain('Tên cửa hàng không được để trống');
        });

        it('should fail (400 Bad Request) when phone is empty', async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng No Phone',
                    phone: '',
                    address: '456 Lê Lợi',
                })
                .expect(400);

            expect(response.body.message).toContain('Số điện thoại không được để trống');
        });

        it('should fail (400 Bad Request) when address is empty', async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng No Address',
                    phone: '0987654321',
                    address: '',
                })
                .expect(400);

            expect(response.body.message).toContain('Địa chỉ không được để trống');
        });

        it('should fail (400 Bad Request) when name exceeds 100 characters', async () => {
            const longName = 'a'.repeat(101);
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: longName,
                    phone: '0987654321',
                    address: '456 Lê Lợi',
                })
                .expect(400);

            expect(response.body.message).toContain('Tên cửa hàng tối đa 100 ký tự');
        });

        it('should fail (400 Bad Request) when phone exceeds 20 characters', async () => {
            const longPhone = '0'.repeat(21);
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng Long Phone',
                    phone: longPhone,
                    address: '456 Lê Lợi',
                })
                .expect(400);

            expect(response.body.message).toContain('Số điện thoại tối đa 20 ký tự');
        });

        it('should fail (409 Conflict) when store name already exists', async () => {
            const storeData = {
                name: 'Cửa hàng Trùng Tên',
                phone: '0901234567',
                address: '123 Nguyễn Trãi',
            };

            // Seed first store
            await request(app.getHttpServer())
                .post('/stores')
                .send(storeData)
                .expect(201);

            // Attempt to create second store with same name
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: storeData.name,
                    phone: '0907654321',
                    address: '321 Lê Hồng Phong',
                })
                .expect(409);

            expect(response.body.message).toBe('Tên cửa hàng đã tồn tại');
        });
    });

    describe('GET /stores (List Stores)', () => {
        it('should return a paginated list of public stores (isLocked: false)', async () => {
            // Seed active store
            await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng Active E2E',
                    phone: '0908888888',
                    address: 'Địa chỉ Active',
                });

            // Seed locked store
            const lockTarget = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng Bị Khóa E2E',
                    phone: '0909999999',
                    address: 'Địa chỉ Bị Khóa',
                });
            const lockId = lockTarget.body.data.id;
            // Lock it
            await request(app.getHttpServer()).patch(`/stores/${lockId}/lock`).expect(200);

            // Fetch public list
            const response = await request(app.getHttpServer())
                .get('/stores')
                .expect(200);

            expectSuccessEnvelope(response.body);
            const { items } = response.body.data;
            expect(Array.isArray(items)).toBe(true);

            // The active store must be present, and the locked store must NOT be present
            const activeStore = items.find((s: any) => s.name === 'Cửa hàng Active E2E');
            const lockedStore = items.find((s: any) => s.id === lockId);

            expect(activeStore).toBeDefined();
            expect(lockedStore).toBeUndefined();
        });
    });

    describe('GET /stores/:id (Get Store Details)', () => {
        it('should return a store by valid ID', async () => {
            const seedResponse = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng Single Test',
                    phone: '0902222222',
                    address: 'Địa chỉ B',
                });
            const seedId = seedResponse.body.data.id;

            const response = await request(app.getHttpServer())
                .get(`/stores/${seedId}`)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.id).toBe(seedId);
            expect(response.body.data.name).toBe('Cửa hàng Single Test');
        });

        it('should fail (400 Bad Request) if ID is not a valid UUID', async () => {
            await request(app.getHttpServer())
                .get('/stores/invalid-uuid-string')
                .expect(400);
        });

        it('should fail (404 Not Found) if store ID does not exist', async () => {
            const fakeUuid = 'e8c4596d-3a36-4184-be46-3bbcf143d221';
            const response = await request(app.getHttpServer())
                .get(`/stores/${fakeUuid}`)
                .expect(404);

            expect(response.body.message).toBe('Không tìm thấy cửa hàng');
        });

        it('should fail (404 Not Found) if the store is locked', async () => {
            // Seed a store
            const seedResponse = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: 'Cửa hàng Sẽ Bị Khóa',
                    phone: '0901239999',
                    address: 'Địa chỉ X',
                });
            const seedId = seedResponse.body.data.id;

            // Lock it
            await request(app.getHttpServer()).patch(`/stores/${seedId}/lock`).expect(200);

            // Attempt to get details publicly (should return 404)
            const response = await request(app.getHttpServer())
                .get(`/stores/${seedId}`)
                .expect(404);

            expect(response.body.message).toBe('Không tìm thấy cửa hàng');
        });
    });

    describe('PATCH /stores/:id (Update Store)', () => {
        let storeId: string;

        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: `Cửa hàng Cần Update ${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    phone: '0903333333',
                    address: 'Địa chỉ Cũ',
                });
            storeId = response.body.data.id;
        });

        it('should update store information successfully', async () => {
            const updateData = {
                name: 'Cửa hàng Đã Update',
                phone: '0904444444',
            };

            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}`)
                .send(updateData)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.id).toBe(storeId);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.phone).toBe(updateData.phone);
            expect(response.body.data.address).toBe('Địa chỉ Cũ'); // Unchanged
        });

        it('should fail (400 Bad Request) if ID is not a valid UUID', async () => {
            await request(app.getHttpServer())
                .patch('/stores/invalid-uuid-string')
                .send({ name: 'Tên Mới' })
                .expect(400);
        });

        it('should fail (404 Not Found) if store ID does not exist', async () => {
            const fakeUuid = 'e8c4596d-3a36-4184-be46-3bbcf143d221';
            await request(app.getHttpServer())
                .patch(`/stores/${fakeUuid}`)
                .send({ name: 'Tên Mới' })
                .expect(404);
        });

        it('should fail (409 Conflict) if updating to a name that is already taken by another store', async () => {
            const duplicateName = `Cửa hàng Khác ${Date.now()}_${Math.random().toString(36).substring(7)}`;
            // Seed another store
            await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: duplicateName,
                    phone: '0909999888',
                    address: 'Địa chỉ Khác',
                });

            // Try to update current store's name to duplicateName
            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}`)
                .send({ name: duplicateName })
                .expect(409);

            expect(response.body.message).toBe('Tên cửa hàng đã tồn tại');
        });
    });

    describe('PATCH /stores/:id/lock (Lock Store)', () => {
        let storeId: string;

        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: `Cửa hàng Lock Test ${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    phone: '0905555555',
                    address: 'Địa chỉ E',
                });
            storeId = response.body.data.id;
        });

        it('should lock an active store successfully', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}/lock`)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.isLocked).toBe(true);
        });

        it('should be idempotent (locking an already locked store returns 200 and remains locked)', async () => {
            // Lock first time
            await request(app.getHttpServer()).patch(`/stores/${storeId}/lock`).expect(200);

            // Lock second time
            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}/lock`)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.isLocked).toBe(true);
        });

        it('should fail (400 Bad Request) if ID is not a valid UUID', async () => {
            await request(app.getHttpServer())
                .patch('/stores/invalid-uuid-string/lock')
                .expect(400);
        });

        it('should fail (404 Not Found) if store ID does not exist', async () => {
            const fakeUuid = 'e8c4596d-3a36-4184-be46-3bbcf143d221';
            await request(app.getHttpServer())
                .patch(`/stores/${fakeUuid}/lock`)
                .expect(404);
        });
    });

    describe('PATCH /stores/:id/unlock (Unlock Store)', () => {
        let storeId: string;

        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/stores')
                .send({
                    name: `Cửa hàng Unlock Test ${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    phone: '0905555556',
                    address: 'Địa chỉ F',
                });
            storeId = response.body.data.id;
            // Lock it first
            await request(app.getHttpServer()).patch(`/stores/${storeId}/lock`).expect(200);
        });

        it('should unlock a locked store successfully', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}/unlock`)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.isLocked).toBe(false);
        });

        it('should be idempotent (unlocking an already unlocked store returns 200 and remains unlocked)', async () => {
            // Unlock first time
            await request(app.getHttpServer()).patch(`/stores/${storeId}/unlock`).expect(200);

            // Unlock second time
            const response = await request(app.getHttpServer())
                .patch(`/stores/${storeId}/unlock`)
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data.isLocked).toBe(false);
        });

        it('should fail (400 Bad Request) if ID is not a valid UUID', async () => {
            await request(app.getHttpServer())
                .patch('/stores/invalid-uuid-string/unlock')
                .expect(400);
        });

        it('should fail (404 Not Found) if store ID does not exist', async () => {
            const fakeUuid = 'e8c4596d-3a36-4184-be46-3bbcf143d221';
            await request(app.getHttpServer())
                .patch(`/stores/${fakeUuid}/unlock`)
                .expect(404);
        });
    });
});
