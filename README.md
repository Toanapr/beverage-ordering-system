# Beverage Ordering System

REST API cho hệ thống đặt đồ uống đa cửa hàng. Khách hàng có thể tìm cửa hàng, xem sản phẩm và đặt hàng; nhân viên quản lý menu, cửa hàng và xử lý đơn; quản trị viên quản lý toàn hệ thống và theo dõi thống kê.

## Tính năng chính

- Xác thực bằng JWT access token và refresh token, hỗ trợ đăng ký, đăng nhập, làm mới token và đăng xuất.
- Phân quyền theo ba vai trò: `customer`, `staff` và `admin`.
- Quản lý cửa hàng, danh mục, sản phẩm, người dùng và nhân viên.
- Đặt hàng, xem lịch sử, hủy đơn và cập nhật trạng thái đơn hàng.
- Thống kê doanh thu, xu hướng, cửa hàng/sản phẩm nổi bật và phân bố trạng thái đơn.
- Upload ảnh sản phẩm vào local storage.
- Swagger UI, validation đầu vào và định dạng response thống nhất.
- Demo UI và dữ liệu mẫu để trải nghiệm nhanh.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16 |
| ORM | TypeORM |
| Authentication | Passport, JWT, bcrypt |
| API documentation | Swagger / OpenAPI |
| Testing | Jest, Supertest |
| Container | Docker, Docker Compose |

## Yêu cầu

Chọn một trong hai cách chạy bên dưới:

- Docker và Docker Compose để chạy toàn bộ hệ thống; hoặc
- Node.js 22+, npm và Docker để phát triển backend trên máy local.

## Chạy nhanh bằng Docker

```bash
cp .env.example .env
docker compose up --build -d
```

Sau khi các container khởi động:

| Dịch vụ | Địa chỉ |
| --- | --- |
| Demo UI | <http://localhost:5173> |
| Backend API | <http://localhost:3000> |
| Swagger UI | <http://localhost:3000/api-docs> |
| Pgweb | <http://localhost:8081> |

Container backend tự động chạy migration và seed dữ liệu demo mỗi khi khởi động. Seed có tính idempotent nên có thể chạy lại an toàn. Để không seed dữ liệu, đặt `RUN_DB_SEED=false` trong `.env` rồi khởi động lại container.

Xem log hoặc dừng hệ thống:

```bash
docker compose logs -f backend
docker compose down
```

Muốn xóa cả dữ liệu PostgreSQL và file upload trong Docker volume để khởi tạo lại từ đầu:

```bash
docker compose down -v
```

> Lệnh trên xóa vĩnh viễn dữ liệu đang lưu trong các Docker volume của project.

## Chạy backend ở môi trường development

### 1. Cài đặt và cấu hình

```bash
npm ci
cp .env.example .env
```

File `.env.example` đã chứa cấu hình phù hợp để backend local kết nối đến PostgreSQL tại `localhost:5432`. Hãy thay các JWT secret trước khi sử dụng ngoài môi trường development.

### 2. Khởi động PostgreSQL

```bash
docker compose up -d db
```

Script `init-db.sql` sẽ tạo thêm database `beverage_ordering_test` trong lần khởi tạo PostgreSQL đầu tiên.

### 3. Tạo schema và dữ liệu mẫu

```bash
npm run migration:run
npm run seed
```

### 4. Khởi động ứng dụng

```bash
npm run start:dev
```

Backend chạy mặc định tại <http://localhost:3000> và Swagger UI tại <http://localhost:3000/api-docs>.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `demo.admin@example.com` | `password123` |
| Staff | `demo.staff@example.com` | `password123` |
| Customer | `demo.customer@example.com` | `password123` |

Lệnh `npm run seed` tạo cửa hàng, danh mục, sản phẩm và các đơn hàng ở mọi trạng thái được hỗ trợ: `pending`, `preparing`, `completed`, `cancelled`. Khi chạy bằng Docker, entrypoint còn sao chép các ảnh demo từ `seed-assets/` vào upload volume.

## Cấu hình môi trường

| Biến | Mặc định mẫu | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | `development` | Môi trường chạy ứng dụng |
| `PORT` | `3000` | Cổng backend |
| `DB_HOST` | `localhost` | Host PostgreSQL; Docker Compose ghi đè thành `db` |
| `DB_PORT` | `5432` | Cổng PostgreSQL |
| `DB_USERNAME` | `postgres` | Tài khoản PostgreSQL |
| `DB_PASSWORD` | `postgres` | Mật khẩu PostgreSQL |
| `DB_DATABASE` | `beverage_ordering` | Database chính |
| `JWT_ACCESS_SECRET` | - | Secret ký access token |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Thời hạn access token |
| `JWT_REFRESH_SECRET` | - | Secret ký refresh token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Thời hạn refresh token |
| `UPLOAD_DIR` | `./uploads` | Thư mục lưu file upload |
| `UPLOAD_MAX_SIZE_MB` | `5` | Kích thước file upload tối đa |
| `UPLOAD_ALLOWED_TYPES` | `jpg,jpeg,png,webp` | Các định dạng ảnh cho phép |
| `CLIENT_URL` | `http://localhost:5173` | Origin được phép gọi API kèm credentials |
| `RUN_DB_SEED` | `true` | Bật/tắt seed tự động khi chạy backend bằng Docker |
| `UI_PORT` | `5173` | Cổng demo UI khi chạy Docker Compose |

Ứng dụng kết nối PostgreSQL qua TypeORM bằng nhóm biến `DB_*`. Các biến ở nhóm Docker Compose chỉ có tác dụng khi chạy bằng `docker compose`.

## Tổng quan API

Các route hiện không có global prefix. Ví dụ endpoint đăng nhập là `POST /auth/login`, không phải `/api/v1/auth/login`.

| Nhóm | Base route | Chức năng |
| --- | --- | --- |
| Authentication | `/auth` | Đăng ký, đăng nhập, thông tin hiện tại, refresh, logout |
| Stores | `/stores`, `/staff/store` | Danh sách, chi tiết và quản lý cửa hàng |
| Categories | `/categories` | Quản lý danh mục |
| Products | `/products` | Tìm kiếm và quản lý sản phẩm |
| Orders | `/orders` | Tạo, hủy, tra cứu và xử lý đơn hàng |
| Users | `/admin/users`, `/admin/staff` | Quản lý người dùng và nhân viên |
| Uploads | `/uploads` | Upload ảnh; file tĩnh được phục vụ tại `/uploads/...` |
| Statistics | `/statistics/admin` | Báo cáo và thống kê dành cho admin |

Chi tiết request body, query, response và yêu cầu xác thực của từng endpoint có tại Swagger UI: <http://localhost:3000/api-docs>.

Access token được gửi qua header:

```http
Authorization: Bearer <access_token>
```

Refresh token được lưu trong HTTP-only cookie. Khi gọi API từ frontend, cần bật credentials và origin phải trùng với `CLIENT_URL`.

### Định dạng response

Response thành công:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Response lỗi:

```json
{
  "success": false,
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/auth/register"
}
```

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run start:dev` | Chạy development với watch mode |
| `npm run build` | Build project vào thư mục `dist` |
| `npm run start:prod` | Chạy bản build production |
| `npm run migration:run` | Chạy migration ở môi trường local |
| `npm run migration:revert` | Hoàn tác migration gần nhất |
| `npm run migration:generate -- <path>` | Sinh migration mới từ thay đổi entity |
| `npm run seed` | Seed dữ liệu demo ở môi trường local |
| `npm run lint:check` | Kiểm tra ESLint, không tự sửa file |
| `npm run format:check` | Kiểm tra Prettier |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run test` | Chạy unit test |
| `npm run test:e2e` | Chạy end-to-end test |
| `npm run test:cov` | Chạy test và xuất báo cáo coverage |

End-to-end test sử dụng database test. Đảm bảo PostgreSQL đang chạy và tạo file `.env.test` với các biến `DB_*` trỏ tới `beverage_ordering_test` trước khi chạy `npm run test:e2e`.

## Cấu trúc dự án

```text
.
├── src/
│   ├── common/          # Guard, decorator, filter, interceptor và DTO dùng chung
│   ├── db/              # TypeORM data source, migration và demo seed
│   └── modules/         # Các feature module của hệ thống
├── test/                # End-to-end tests và test helpers
├── seed-assets/         # Ảnh sản phẩm cho demo seed
├── UI/                  # Demo UI tĩnh
├── documents/           # Tổng quan, kiến trúc, schema và kế hoạch dự án
├── docker-compose.yml
└── Dockerfile
```

Mỗi feature module thường được tổ chức theo `controller → service → repository → entity`, kèm DTO, Swagger decorator và test tương ứng. Xem thêm tài liệu trong thư mục [`documents`](./documents/).

## Kiểm tra trước khi commit

```bash
npm run format:check
npm run lint:check
npm run typecheck
npm run test
```

## License

Project hiện được khai báo là private và `UNLICENSED` trong `package.json`.
