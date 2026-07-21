import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';

export const DEMO_PASSWORD = 'password123';

export const DEMO_EMAILS = {
  admin: 'demo.admin@example.com',
  staff: 'demo.staff@example.com',
  customer: 'demo.customer@example.com',
} as const;

const IDS = {
  stores: {
    main: '10000000-0000-4000-8000-000000000001',
    secondary: '10000000-0000-4000-8000-000000000002',
    riverside: '10000000-0000-4000-8000-000000000003',
    garden: '10000000-0000-4000-8000-000000000004',
    campus: '10000000-0000-4000-8000-000000000005',
  },
  categories: {
    coffee: '20000000-0000-4000-8000-000000000001',
    milkTea: '20000000-0000-4000-8000-000000000002',
    softDrink: '20000000-0000-4000-8000-000000000003',
    matcha: '20000000-0000-4000-8000-000000000004',
    riversideTea: '20000000-0000-4000-8000-000000000005',
    vietnameseCoffee: '20000000-0000-4000-8000-000000000006',
    gardenFruitTea: '20000000-0000-4000-8000-000000000007',
    campusCoffee: '20000000-0000-4000-8000-000000000008',
    campusTea: '20000000-0000-4000-8000-000000000009',
  },
  products: {
    espresso: '30000000-0000-4000-8000-000000000001',
    milkTea: '30000000-0000-4000-8000-000000000002',
    seasonal: '30000000-0000-4000-8000-000000000003',
    soldOut: '30000000-0000-4000-8000-000000000004',
    cola: '30000000-0000-4000-8000-000000000005',
    sparklingWater: '30000000-0000-4000-8000-000000000006',
    vietnameseIcedCoffee: '30000000-0000-4000-8000-000000000007',
    peachTea: '30000000-0000-4000-8000-000000000008',
    mangoMatcha: '30000000-0000-4000-8000-000000000009',
    lycheeJasmine: '30000000-0000-4000-8000-000000000010',
    coconutCoffee: '30000000-0000-4000-8000-000000000011',
    strawberryHibiscus: '30000000-0000-4000-8000-000000000012',
    campusColdBrew: '30000000-0000-4000-8000-000000000013',
    campusPeachTea: '30000000-0000-4000-8000-000000000014',
  },
  orders: {
    pending: '40000000-0000-4000-8000-000000000001',
    preparing: '40000000-0000-4000-8000-000000000002',
    completed: '40000000-0000-4000-8000-000000000003',
    cancelled: '40000000-0000-4000-8000-000000000004',
  },
  orderItems: {
    pending: '50000000-0000-4000-8000-000000000001',
    preparing: '50000000-0000-4000-8000-000000000002',
    completedCoffee: '50000000-0000-4000-8000-000000000003',
    completedMilkTea: '50000000-0000-4000-8000-000000000004',
    cancelled: '50000000-0000-4000-8000-000000000005',
  },
} as const;

interface DemoUserInput {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff' | 'customer';
  storeId: string | null;
  fullName: string;
}

async function upsertDemoUser(
  manager: EntityManager,
  input: DemoUserInput,
): Promise<string> {
  const rows = await manager.query<Array<{ id: string }>>(
    `INSERT INTO "users"
      ("id", "email", "password_hash", "role", "store_id", "full_name", "is_banned")
     VALUES ($1, $2, $3, $4, $5, $6, false)
     ON CONFLICT ("email") DO UPDATE SET
       "password_hash" = EXCLUDED."password_hash",
       "role" = EXCLUDED."role",
       "store_id" = EXCLUDED."store_id",
       "full_name" = EXCLUDED."full_name",
       "is_banned" = false,
       "updated_at" = now()
     RETURNING "id"`,
    [
      input.id,
      input.email,
      input.passwordHash,
      input.role,
      input.storeId,
      input.fullName,
    ],
  );

  return rows[0].id;
}

async function seedStores(manager: EntityManager): Promise<void> {
  await manager.query(
    `INSERT INTO "stores"
      ("id", "name", "phone", "address", "is_open", "is_locked", "rating_avg", "rating_count")
     VALUES
      ($1, 'Saigon Brew Demo', '0901000001', '1 Nguyễn Huệ, Quận 1, TP.HCM', true, false, 4.80, 128),
      ($2, 'Closed Corner Demo', '0901000002', '2 Lê Lợi, Quận 1, TP.HCM', false, true, 4.20, 36),
      ($3, 'Mộc Riverside', '0901000003', '21 Nguyễn Văn Hưởng, Thảo Điền, TP.HCM', true, false, 4.70, 94),
      ($4, 'Vườn Nắng Coffee', '0901000004', '118 Phan Xích Long, Phú Nhuận, TP.HCM', true, false, 4.60, 72),
      ($5, 'Mây Campus', '0901000005', '50 Lê Văn Việt, TP. Thủ Đức, TP.HCM', true, false, 4.50, 51)
     ON CONFLICT ("id") DO UPDATE SET
       "name" = EXCLUDED."name",
       "phone" = EXCLUDED."phone",
       "address" = EXCLUDED."address",
       "is_open" = EXCLUDED."is_open",
       "is_locked" = EXCLUDED."is_locked",
       "rating_avg" = EXCLUDED."rating_avg",
       "rating_count" = EXCLUDED."rating_count",
       "updated_at" = now()`,
    [
      IDS.stores.main,
      IDS.stores.secondary,
      IDS.stores.riverside,
      IDS.stores.garden,
      IDS.stores.campus,
    ],
  );
}

async function seedCategoriesAndProducts(
  manager: EntityManager,
): Promise<void> {
  await manager.query(
    `INSERT INTO "categories" ("id", "store_id", "name")
     VALUES
       ($1, $10, 'Cà phê'),
       ($2, $10, 'Trà sữa'),
       ($3, $11, 'Nước giải khát'),
       ($4, $12, 'Matcha và kem'),
       ($5, $12, 'Trà thanh vị'),
       ($6, $13, 'Cà phê Việt'),
       ($7, $13, 'Trà trái cây'),
       ($8, $14, 'Cà phê pha lạnh'),
       ($9, $14, 'Trà hiện đại')
     ON CONFLICT ("id") DO UPDATE SET
       "store_id" = EXCLUDED."store_id",
       "name" = EXCLUDED."name",
       "updated_at" = now()`,
    [
      IDS.categories.coffee,
      IDS.categories.milkTea,
      IDS.categories.softDrink,
      IDS.categories.matcha,
      IDS.categories.riversideTea,
      IDS.categories.vietnameseCoffee,
      IDS.categories.gardenFruitTea,
      IDS.categories.campusCoffee,
      IDS.categories.campusTea,
      IDS.stores.main,
      IDS.stores.secondary,
      IDS.stores.riverside,
      IDS.stores.garden,
      IDS.stores.campus,
    ],
  );

  await manager.query(
    `INSERT INTO "products"
     ("id", "store_id", "category_id", "name", "description", "price", "image_url", "status")
     VALUES
       ($1, $15, $20, 'Espresso Demo', 'Espresso đôi đậm vị và cân bằng.', 35000, '/uploads/products/espresso.jpg', 'active'),
       ($2, $15, $21, 'Trà sữa đường nâu', 'Trà sữa béo nhẹ cùng trân châu đường nâu.', 45000, '/uploads/products/brown-sugar-milk-tea.jpg', 'active'),
       ($3, $15, $21, 'Trà sữa dâu theo mùa', 'Món theo mùa đang được ẩn khỏi thực đơn.', 50000, '/uploads/products/seasonal-strawberry-milk-tea.jpg', 'hidden'),
       ($4, $15, $20, 'Cold Brew Demo', 'Cà phê ủ lạnh hiện đang tạm hết.', 40000, '/uploads/products/cold-brew.jpg', 'out_of_stock'),
       ($5, $16, $22, 'Cola Demo', 'Cola cổ điển dùng lạnh.', 20000, '/uploads/products/cola.jpg', 'active'),
       ($6, $16, $22, 'Nước khoáng có ga', 'Nước khoáng mát lạnh với ga nhẹ.', 25000, '/uploads/products/sparkling-water.jpg', 'out_of_stock'),
       ($7, $15, $20, 'Cà phê sữa đá', 'Cà phê Việt pha cùng sữa đặc và đá.', 39000, '/uploads/products/vietnamese-iced-coffee.jpg', 'active'),
       ($8, $15, $21, 'Trà đào', 'Trà đen thanh nhẹ cùng lát đào.', 42000, '/uploads/products/peach-tea.jpg', 'active'),
       ($9, $17, $23, 'Matcha xoài', 'Matcha dịu, kem xoài chín và đá lạnh.', 59000, '/uploads/products/mango-matcha-latte.jpg', 'active'),
       ($10, $17, $24, 'Trà nhài vải', 'Trà nhài thơm nhẹ cùng trái vải mọng nước.', 52000, '/uploads/products/lychee-jasmine-tea.jpg', 'active'),
       ($11, $18, $25, 'Cà phê dừa', 'Cà phê Việt đậm vị phủ kem dừa mịn.', 55000, '/uploads/products/coconut-coffee.jpg', 'active'),
       ($12, $18, $26, 'Trà bụp giấm dâu', 'Trà trái cây chua nhẹ, có ga và dâu tươi.', 54000, '/uploads/products/strawberry-hibiscus-tea.jpg', 'active'),
       ($13, $19, $27, 'Cold Brew cam', 'Cà phê ủ lạnh với hương cam tươi.', 48000, '/uploads/products/cold-brew.jpg', 'active'),
       ($14, $19, $28, 'Trà đào oolong', 'Oolong thơm dịu, đào chín và đá lạnh.', 46000, '/uploads/products/peach-tea.jpg', 'active')
     ON CONFLICT ("id") DO UPDATE SET
       "store_id" = EXCLUDED."store_id",
       "category_id" = EXCLUDED."category_id",
       "name" = EXCLUDED."name",
       "description" = EXCLUDED."description",
       "price" = EXCLUDED."price",
       "image_url" = EXCLUDED."image_url",
       "status" = EXCLUDED."status",
       "updated_at" = now()`,
    [
      IDS.products.espresso,
      IDS.products.milkTea,
      IDS.products.seasonal,
      IDS.products.soldOut,
      IDS.products.cola,
      IDS.products.sparklingWater,
      IDS.products.vietnameseIcedCoffee,
      IDS.products.peachTea,
      IDS.products.mangoMatcha,
      IDS.products.lycheeJasmine,
      IDS.products.coconutCoffee,
      IDS.products.strawberryHibiscus,
      IDS.products.campusColdBrew,
      IDS.products.campusPeachTea,
      IDS.stores.main,
      IDS.stores.secondary,
      IDS.stores.riverside,
      IDS.stores.garden,
      IDS.stores.campus,
      IDS.categories.coffee,
      IDS.categories.milkTea,
      IDS.categories.softDrink,
      IDS.categories.matcha,
      IDS.categories.riversideTea,
      IDS.categories.vietnameseCoffee,
      IDS.categories.gardenFruitTea,
      IDS.categories.campusCoffee,
      IDS.categories.campusTea,
    ],
  );
}

async function seedOrders(
  manager: EntityManager,
  customerId: string,
): Promise<void> {
  await manager.query(
    `INSERT INTO "orders"
      ("id", "order_code", "customer_id", "store_id", "receiver_name",
       "receiver_phone", "delivery_address", "subtotal", "total_amount",
       "payment_method", "status", "cancel_reason", "created_at")
     VALUES
       ($1, 'DEMO0001', $5, $6, 'Demo Customer', '0909000001', '10 Demo Street, HCMC', 35000, 35000, 'COD', 'pending', null, '2026-07-10T01:00:00Z'),
       ($2, 'DEMO0002', $5, $6, 'Demo Customer', '0909000001', '10 Demo Street, HCMC', 90000, 90000, 'COD', 'preparing', null, '2026-07-11T01:00:00Z'),
       ($3, 'DEMO0003', $5, $6, 'Demo Customer', '0909000001', '10 Demo Street, HCMC', 80000, 80000, 'COD', 'completed', null, '2026-07-12T01:00:00Z'),
       ($4, 'DEMO0004', $5, $6, 'Demo Customer', '0909000001', '10 Demo Street, HCMC', 50000, 50000, 'COD', 'cancelled', 'Customer changed their mind', '2026-07-13T01:00:00Z')
     ON CONFLICT ("id") DO UPDATE SET
       "customer_id" = EXCLUDED."customer_id",
       "store_id" = EXCLUDED."store_id",
       "receiver_name" = EXCLUDED."receiver_name",
       "receiver_phone" = EXCLUDED."receiver_phone",
       "delivery_address" = EXCLUDED."delivery_address",
       "subtotal" = EXCLUDED."subtotal",
       "total_amount" = EXCLUDED."total_amount",
       "payment_method" = EXCLUDED."payment_method",
       "status" = EXCLUDED."status",
       "cancel_reason" = EXCLUDED."cancel_reason",
       "created_at" = EXCLUDED."created_at",
       "updated_at" = now()`,
    [
      IDS.orders.pending,
      IDS.orders.preparing,
      IDS.orders.completed,
      IDS.orders.cancelled,
      customerId,
      IDS.stores.main,
    ],
  );

  await manager.query(
    `INSERT INTO "order_items"
      ("id", "order_id", "product_id", "product_name", "price", "quantity", "line_total")
     VALUES
       ($1, $6, $10, 'Espresso Demo', 35000, 1, 35000),
       ($2, $7, $11, 'Brown Sugar Milk Tea Demo', 45000, 2, 90000),
       ($3, $8, $10, 'Espresso Demo', 35000, 1, 35000),
       ($4, $8, $11, 'Brown Sugar Milk Tea Demo', 45000, 1, 45000),
       ($5, $9, $12, 'Seasonal Milk Tea Demo', 50000, 1, 50000)
     ON CONFLICT ("id") DO UPDATE SET
       "order_id" = EXCLUDED."order_id",
       "product_id" = EXCLUDED."product_id",
       "product_name" = EXCLUDED."product_name",
       "price" = EXCLUDED."price",
       "quantity" = EXCLUDED."quantity",
       "line_total" = EXCLUDED."line_total"`,
    [
      IDS.orderItems.pending,
      IDS.orderItems.preparing,
      IDS.orderItems.completedCoffee,
      IDS.orderItems.completedMilkTea,
      IDS.orderItems.cancelled,
      IDS.orders.pending,
      IDS.orders.preparing,
      IDS.orders.completed,
      IDS.orders.cancelled,
      IDS.products.espresso,
      IDS.products.milkTea,
      IDS.products.seasonal,
    ],
  );
}

export async function seedDemoData(dataSource: DataSource): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await dataSource.transaction(async (manager) => {
    await seedStores(manager);

    const adminId = await upsertDemoUser(manager, {
      id: '00000000-0000-4000-8000-000000000001',
      email: DEMO_EMAILS.admin,
      passwordHash,
      role: 'admin',
      storeId: null,
      fullName: 'Demo Admin',
    });
    const staffId = await upsertDemoUser(manager, {
      id: '00000000-0000-4000-8000-000000000002',
      email: DEMO_EMAILS.staff,
      passwordHash,
      role: 'staff',
      storeId: IDS.stores.main,
      fullName: 'Demo Staff',
    });
    const customerId = await upsertDemoUser(manager, {
      id: '00000000-0000-4000-8000-000000000003',
      email: DEMO_EMAILS.customer,
      passwordHash,
      role: 'customer',
      storeId: null,
      fullName: 'Demo Customer',
    });

    await manager.query(
      `DELETE FROM "refresh_tokens" WHERE "user_id" = ANY($1::uuid[])`,
      [[adminId, staffId, customerId]],
    );

    await seedCategoriesAndProducts(manager);
    await seedOrders(manager, customerId);
  });
}
