import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from 'src/common/interceptors/reponse.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

describe('AuthController (Integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testEmail = `test-${Date.now()}@gmail.com`;
    const testPassword = 'password123';
    const testFullName = 'Nguyen Van Test';

    let storedRefreshToken: string;
    let storedAccessToken: string;
    let storedUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalInterceptors(new ResponseInterceptor());
        app.useGlobalFilters(new HttpExceptionFilter());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.query(`DELETE FROM users WHERE email = $1`, [testEmail]);
            await dataSource.destroy();
        }
        await app.close();
    });

    // Helper: assert the standard envelope produced by ResponseInterceptor
    const expectSuccessEnvelope = (body: any) => {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('message', 'Request successful');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('timestamp');
        expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    };

    // --- 1. REGISTER ---
    describe('POST /auth/register', () => {
        it('should register successfully with valid data', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    fullName: testFullName,
                })
                .expect(201);

            expectSuccessEnvelope(response.body);

            const user = response.body.data;
            expect(user).toHaveProperty('id');
            expect(user.email).toBe(testEmail);
            expect(user.fullName).toBe(testFullName);
            expect(user.role).toBe('customer');
            expect(user).not.toHaveProperty('passwordHash');
        });

        it('should fail (400 Bad Request) on missing fields or invalid email format', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'invalid-email-format',
                    password: '123',
                    fullName: '',
                })
                .expect(400);

            expect(response.body.message).toContain('Email không đúng định dạng');
            expect(response.body.message).toContain('Mật khẩu phải có ít nhất 6 kí tự');
        });

        it('should fail (400 Bad Request) when required fields are entirely missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({})
                .expect(400);

            expect(Array.isArray(response.body.message)).toBe(true);
            expect(response.body.message.length).toBeGreaterThan(0);
        });

        it('should fail (409 Conflict) when registering with a duplicate email', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: testEmail,
                    password: testPassword,
                    fullName: testFullName,
                })
                .expect(409);

            expect(response.body.message).toContain('Email này đã được sử dụng!');
        });
    });

    // --- 2. LOGIN ---
    describe('POST /auth/login', () => {
        it('should log in successfully and return a token pair', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                })
                .expect(200);

            expectSuccessEnvelope(response.body);

            const data = response.body.data;
            expect(data).toHaveProperty('accessToken');
            expect(data).toHaveProperty('refreshToken');
            expect(data).toHaveProperty('user');
            expect(data.user.email).toBe(testEmail);
            expect(data.user).not.toHaveProperty('passwordHash');

            storedAccessToken = data.accessToken;
            storedRefreshToken = data.refreshToken;
            storedUserId = data.user.id;
        });

        it('should fail (401 Unauthorized) on wrong password', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body.message).toContain('Email hoặc mật khẩu không chính xác');
        });

        it('should fail (401 Unauthorized) when the email does not exist', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'does-not-exist@gmail.com',
                    password: testPassword,
                })
                .expect(401);

            expect(response.body.message).toContain('Email hoặc mật khẩu không chính xác');
        });

        it('should fail (400 Bad Request) when email or password is missing', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: testEmail })
                .expect(400);
        });

        it('should fail (403 Forbidden) when the account is banned', async () => {
            await dataSource.query(
                `UPDATE users SET "is_banned" = true WHERE email = $1`,
                [testEmail],
            );

            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testEmail,
                    password: testPassword,
                })
                .expect(403);

            expect(response.body.message).toContain('Tài khoản của bạn đã bị khóa!');

            // Unban so the rest of the suite (refresh/logout flows) can proceed normally
            await dataSource.query(
                `UPDATE users SET "is_banned" = false WHERE email = $1`,
                [testEmail],
            );
        });
    });

    // --- 3. REFRESH TOKEN ---
    describe('POST /auth/refresh', () => {
        it('should refresh the access token successfully with a valid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                    userId: storedUserId,
                    refreshToken: storedRefreshToken,
                })
                .expect(200);

            expectSuccessEnvelope(response.body);

            const data = response.body.data;
            expect(data).toHaveProperty('accessToken');
            expect(data).toHaveProperty('refreshToken');

            storedAccessToken = data.accessToken;
            storedRefreshToken = data.refreshToken;
        });

        it('should fail (401 Unauthorized) with an invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                    userId: storedUserId,
                    refreshToken: 'fake-token-that-does-not-exist',
                })
                .expect(401);
        });

        it('should fail (403 Forbidden) when userId does not exist', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                    userId: '00000000-0000-0000-0000-000000000000',
                    refreshToken: storedRefreshToken,
                })
                .expect(403);
        });

        it('should fail (403 Forbidden) when the account is banned', async () => {
            await dataSource.query(
                `UPDATE users SET "is_banned" = true WHERE email = $1`,
                [testEmail],
            );

            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                    userId: storedUserId,
                    refreshToken: storedRefreshToken,
                })
                .expect(403);

            await dataSource.query(
                `UPDATE users SET "is_banned" = false WHERE email = $1`,
                [testEmail],
            );
        });
    });

    // --- 4. LOGOUT ---
    describe('POST /auth/logout', () => {
        it('should log out successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/logout')
                .send({
                    userId: storedUserId,
                })
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data).toHaveProperty('message', 'Đăng xuất thành công!');
        });

        it('should fail (401 Unauthorized) when reusing the old refresh token after logout', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({
                    userId: storedUserId,
                    refreshToken: storedRefreshToken,
                })
                .expect(401);
        });
    });
});