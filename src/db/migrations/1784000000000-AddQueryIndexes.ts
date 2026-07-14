import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQueryIndexes1784000000000 implements MigrationInterface {
  name = 'AddQueryIndexes1784000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_products_store_status" ON "products" ("store_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_category" ON "products" ("category_id")`,
    );

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(
      `CREATE INDEX "idx_products_name" ON "products" USING GIN ("name" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_orders_customer_id" ON "orders" ("customer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_store_status" ON "orders" ("store_id", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_orders_store_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_customer_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_store_status"`);
  }
}
