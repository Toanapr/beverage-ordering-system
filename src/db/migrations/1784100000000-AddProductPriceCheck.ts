import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductPriceCheck1784100000000 implements MigrationInterface {
  name = 'AddProductPriceCheck1784100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_products_price_nonnegative" CHECK ("price" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_products_price_nonnegative"`,
    );
  }
}
