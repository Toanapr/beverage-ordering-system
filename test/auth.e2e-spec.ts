import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

describe('AuthController (Integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testEmail = `test-${Date.now()}@gmail.com`;
    const testPassword = 'password123';
    const testFullName = 'Nguyen Van Test';

    let storedUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.use(cookieParser());
        app.useGlobalInterceptors(new ResponseInterceptor());
        app.useGlobalFilters(new HttpExceptionFilter());
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);

        await dataSource.runMigrations();
    });

    afterAll(async () => {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.dropDatabase();
            await dataSource.destroy();
        }
        await app.close();
    });

    const expectSuccessEnvelope = (body: any) => {
        expect(body).toHaveProperty('success', true);
        expect(body).toHaveProperty('message', 'Request successful');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('timestamp');
        expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    };

    // Helper: pull the refreshToken cookie string out of a Set-Cookie header
    const getRefreshCookie = (response: request.Response): string | undefined => {
        const rawCookies = response.headers['set-cookie'];
        if (!rawCookies) return undefined;
        const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
        return cookies.find((c) => c.startsWith('refreshToken='));
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

            // Register should never set a refresh-token cookie
            expect(getRefreshCookie(response)).toBeUndefined();
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
        it('should log in successfully, return accessToken in body and set refreshToken as httpOnly cookie', async () => {
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
            expect(data).toHaveProperty('user');
            expect(data.user.email).toBe(testEmail);
            expect(data.user).not.toHaveProperty('passwordHash');

            expect(data).not.toHaveProperty('refreshToken');

            const cookie = getRefreshCookie(response);
            expect(cookie).toBeDefined();
            expect(cookie).toMatch(/HttpOnly/i);

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
            expect(getRefreshCookie(response)).toBeUndefined();
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

            await dataSource.query(
                `UPDATE users SET "is_banned" = false WHERE email = $1`,
                [testEmail],
            );
        });
    });

    // --- 3. REFRESH TOKEN (cookie-based) ---
    describe('POST /auth/refresh', () => {
        let refreshAgent: ReturnType<typeof request.agent>;

        beforeAll(() => {
            refreshAgent = request.agent(app.getHttpServer());
        });

        it('should log in first to obtain a refreshToken cookie on the agent', async () => {
            const response = await refreshAgent
                .post('/auth/login')
                .send({ email: testEmail, password: testPassword })
                .expect(200);

            expect(getRefreshCookie(response)).toBeDefined();
        });

        it('should refresh the access token successfully using the refreshToken cookie', async () => {
            const response = await refreshAgent
                .post('/auth/refresh')
                .send()
                .expect(200);

            expectSuccessEnvelope(response.body);

            const data = response.body.data;
            expect(data).toHaveProperty('accessToken');
            expect(data).not.toHaveProperty('refreshToken');

            const cookie = getRefreshCookie(response);
            expect(cookie).toBeDefined();
        });

        it('should fail (401 Unauthorized) when no refreshToken cookie is sent', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .send()
                .expect(401);
        });

        it('should fail (401 Unauthorized) with an invalid/forged refreshToken cookie', async () => {
            await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Cookie', ['refreshToken=fake-token-that-does-not-exist'])
                .send()
                .expect(401);
        });

        it('should fail (403 Forbidden) when the account is banned', async () => {
            await dataSource.query(
                `UPDATE users SET "is_banned" = true WHERE email = $1`,
                [testEmail],
            );

            await refreshAgent
                .post('/auth/refresh')
                .send()
                .expect(403);

            await dataSource.query(
                `UPDATE users SET "is_banned" = false WHERE email = $1`,
                [testEmail],
            );
        });

        it('should fail (403 Forbidden) when the user referenced by the token no longer exists', async () => {
            const deletedUserEmail = `test-deleted-${Date.now()}@gmail.com`;
            const oneOffAgent = request.agent(app.getHttpServer());

            await oneOffAgent
                .post('/auth/register')
                .send({
                    email: deletedUserEmail,
                    password: testPassword,
                    fullName: 'To Be Deleted',
                })
                .expect(201);

            await oneOffAgent
                .post('/auth/login')
                .send({ email: deletedUserEmail, password: testPassword })
                .expect(200);

            await dataSource.query(`DELETE FROM users WHERE email = $1`, [deletedUserEmail]);

            await oneOffAgent
                .post('/auth/refresh')
                .send()
                .expect(403);
        });
    });

    // --- 4. LOGOUT ---
    describe('POST /auth/logout', () => {
        it('should log out successfully and clear the refreshToken cookie', async () => {
            const agent = request.agent(app.getHttpServer());

            await agent
                .post('/auth/login')
                .send({ email: testEmail, password: testPassword })
                .expect(200);

            const response = await agent
                .post('/auth/logout')
                .send({ userId: storedUserId })
                .expect(200);

            expectSuccessEnvelope(response.body);
            expect(response.body.data).toHaveProperty('message', 'Đăng xuất thành công!');

            const cookie = getRefreshCookie(response);
            expect(cookie).toBeDefined();
            expect(cookie).toMatch(/refreshToken=;|Expires=Thu, 01 Jan 1970/i);
        });

        it('should fail (401 Unauthorized) when reusing the old refreshToken cookie after logout', async () => {
            const agent = request.agent(app.getHttpServer());

            await agent
                .post('/auth/login')
                .send({ email: testEmail, password: testPassword })
                .expect(200);

            await agent.post('/auth/logout').send({ userId: storedUserId }).expect(200);

            await agent.post('/auth/refresh').send().expect(401);
        });
    });
});